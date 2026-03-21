/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

interface DiscountRow extends RowDataPacket {
  discountID: number;
  discountName: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  description: string | null;
  isActive: number;
  createdAt: string;
}

interface DiscountRoomRow extends RowDataPacket {
  discountID: number;
  roomID: string;
}

export async function GET() {
  try {
    const [discounts] = await pool.query<DiscountRow[]>(
      `
      SELECT *
      FROM discounts
      ORDER BY discountID DESC
      `
    );

    const [discountRooms] = await pool.query<DiscountRoomRow[]>(
      `
      SELECT discountID, roomID
      FROM discount_rooms
      ORDER BY discountID ASC
      `
    );

    const formattedDiscounts = discounts.map((discount) => ({
      ...discount,
      isActive: Boolean(discount.isActive),
      roomIDs: discountRooms
        .filter((item) => item.discountID === discount.discountID)
        .map((item) => item.roomID),
    }));

    return NextResponse.json({ discounts: formattedDiscounts });
  } catch (error) {
    console.error("Error fetching discounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch discounts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const body = await req.json();

    const {
      discountName,
      discountType,
      discountValue,
      startDate,
      endDate,
      description,
      isActive,
      roomIDs,
    } = body;

    if (
      !discountName ||
      !discountType ||
      discountValue === undefined ||
      !startDate ||
      !endDate ||
      !Array.isArray(roomIDs) ||
      roomIDs.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      return NextResponse.json(
        { error: "discountType must be 'percentage' or 'fixed'" },
        { status: 400 }
      );
    }

    if (Number(discountValue) <= 0) {
      return NextResponse.json(
        { error: "discountValue must be greater than 0" },
        { status: 400 }
      );
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { error: "endDate must be later than startDate" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const [conflicts] = await connection.query<RowDataPacket[]>(
      `
      SELECT
        dr.roomID,
        d.discountID,
        d.discountName,
        d.startDate,
        d.endDate
      FROM discount_rooms dr
      INNER JOIN discounts d ON dr.discountID = d.discountID
      WHERE dr.roomID IN (?)
        AND d.isActive = 1
        AND ? < d.endDate
        AND ? > d.startDate
      `,
      [roomIDs, startDate, endDate]
    );

    if (conflicts.length > 0) {
      const conflictRooms = [...new Set(conflicts.map((item) => item.roomID))];

      await connection.rollback();
      return NextResponse.json(
        {
          error: `These rooms already have another active discount in the same time period: ${conflictRooms.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const [result] = await connection.query<ResultSetHeader>(
      `
      INSERT INTO discounts
      (discountName, discountType, discountValue, startDate, endDate, description, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        discountName,
        discountType,
        discountValue,
        startDate,
        endDate,
        description || null,
        isActive ? 1 : 0,
      ]
    );

    const discountID = result.insertId;

    for (const roomID of roomIDs) {
      await connection.query(
        `
        INSERT INTO discount_rooms (discountID, roomID)
        VALUES (?, ?)
        `,
        [discountID, roomID]
      );
    }

    await connection.commit();

    return NextResponse.json({
      message: "Discount created successfully",
      discountID,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Error creating discount:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Some selected rooms are duplicated for this discount" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create discount" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}