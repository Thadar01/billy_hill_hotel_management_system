import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface PreferenceRow extends RowDataPacket {
  id: number;
  customerID: string;
  preferenceKey: string;
  preferenceValue: string;
  createdAt: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await pool.query<PreferenceRow[]>(
      `
      SELECT id, customerID, preferenceKey, preferenceValue, createdAt
      FROM customer_preference_items
      WHERE id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Customer preference not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ preference: rows[0] });
  } catch (error) {
    console.error("Fetch customer preference error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer preference" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { customerID, preferenceKey, preferenceValue } = body;

    if (!customerID || !preferenceKey || !preferenceValue) {
      return NextResponse.json(
        { error: "customerID, preferenceKey, and preferenceValue are required." },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `
      UPDATE customer_preference_items
      SET customerID = ?,
          preferenceKey = ?,
          preferenceValue = ?
      WHERE id = ?
      `,
      [customerID, preferenceKey, preferenceValue, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Customer preference not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Customer preference updated successfully",
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Update customer preference error:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "This preference already exists for the customer." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update customer preference" },
      { status: 500 }
    );
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
      DELETE FROM customer_preference_items
      WHERE id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Customer preference not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Customer preference deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer preference error:", error);
    return NextResponse.json(
      { error: "Failed to delete customer preference" },
      { status: 500 }
    );
  }
}