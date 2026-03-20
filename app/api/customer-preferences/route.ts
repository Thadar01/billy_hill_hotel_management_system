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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerID = searchParams.get("customerID") || "";
    const preferenceKey = searchParams.get("preferenceKey") || "";

    const conditions: string[] = [];
    const values: string[] = [];

    if (customerID) {
      conditions.push("customerID = ?");
      values.push(customerID);
    }

    if (preferenceKey) {
      conditions.push("preferenceKey = ?");
      values.push(preferenceKey);
    }

    const whereSQL = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query<PreferenceRow[]>(
      `
      SELECT id, customerID, preferenceKey, preferenceValue, createdAt
      FROM customer_preference_items
      ${whereSQL}
      ORDER BY customerID ASC, preferenceKey ASC, preferenceValue ASC
      `,
      values
    );

    return NextResponse.json({ preferences: rows });
  } catch (error) {
    console.error("Fetch customer preferences error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer preferences" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
      INSERT INTO customer_preference_items
      (customerID, preferenceKey, preferenceValue)
      VALUES (?, ?, ?)
      `,
      [customerID, preferenceKey, preferenceValue]
    );

    return NextResponse.json({
      message: "Customer preference created successfully",
      id: result.insertId,
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Create customer preference error:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "This preference already exists for the customer." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create customer preference" },
      { status: 500 }
    );
  }
}