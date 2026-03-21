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
  roomID: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [discounts] = await pool.query<DiscountRow[]>(
      `
      SELECT
        discountID,
        discountName,
        discountType,
        discountValue,
        DATE_FORMAT(startDate, '%Y-%m-%dT%H:%i') AS startDate,
        DATE_FORMAT(endDate, '%Y-%m-%dT%H:%i') AS endDate,
        description,
        isActive,
        createdAt
      FROM discounts
      WHERE discountID = ?
      `,
      [id]
    );

    if (discounts.length === 0) {
      return NextResponse.json(
        { error: "Discount not found" },
        { status: 404 }
      );
    }

    const [rooms] = await pool.query<DiscountRoomRow[]>(
      `
      SELECT roomID
      FROM discount_rooms
      WHERE discountID = ?
      ORDER BY roomID ASC
      `,
      [id]
    );

    const discount = discounts[0];

    return NextResponse.json({
      discount: {
        ...discount,
        isActive: Boolean(discount.isActive),
        roomIDs: rooms.map((room) => room.roomID),
      },
    });
  } catch (error) {
    console.error("Error fetching discount:", error);
    return NextResponse.json(
      { error: "Failed to fetch discount" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();

  try {
    const { id } = await params;
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

    // Check overlapping active discounts for selected rooms, excluding current discount
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
        AND d.discountID != ?
        AND ? < d.endDate
        AND ? > d.startDate
      `,
      [roomIDs, id, startDate, endDate]
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
      UPDATE discounts
      SET discountName = ?,
          discountType = ?,
          discountValue = ?,
          startDate = ?,
          endDate = ?,
          description = ?,
          isActive = ?
      WHERE discountID = ?
      `,
      [
        discountName,
        discountType,
        discountValue,
        startDate,
        endDate,
        description || null,
        isActive ? 1 : 0,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Discount not found" },
        { status: 404 }
      );
    }

    await connection.query(
      `
      DELETE FROM discount_rooms
      WHERE discountID = ?
      `,
      [id]
    );

    for (const roomID of roomIDs) {
      await connection.query(
        `
        INSERT INTO discount_rooms (discountID, roomID)
        VALUES (?, ?)
        `,
        [id, roomID]
      );
    }

    await connection.commit();

    return NextResponse.json({
      message: "Discount updated successfully",
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Error updating discount:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Some selected rooms are duplicated for this discount" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update discount" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [result] = await pool.query<ResultSetHeader>(
      `
      DELETE FROM discounts
      WHERE discountID = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Discount not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Discount deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting discount:", error);
    return NextResponse.json(
      { error: "Failed to delete discount" },
      { status: 500 }
    );
  }
}