import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface PreferenceRow extends RowDataPacket {
  id: number;
  customerID: string;
  preferenceKey: string;
  preferenceValue: string;
  createdAt: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ "customer-id": string }> }
) {
  try {
    const { "customer-id": customerID } = await params;

    const [rows] = await pool.query<PreferenceRow[]>(
      `
      SELECT id, customerID, preferenceKey, preferenceValue, createdAt
      FROM customer_preference_items
      WHERE customerID = ?
      ORDER BY preferenceKey ASC, preferenceValue ASC
      `,
      [customerID]
    );

    const grouped: Record<string, string[]> = {};

    for (const row of rows) {
      if (!grouped[row.preferenceKey]) {
        grouped[row.preferenceKey] = [];
      }
      grouped[row.preferenceKey].push(row.preferenceValue);
    }

    return NextResponse.json({
      customerID,
      preferences: grouped,
      items: rows,
    });
  } catch (error) {
    console.error("Fetch grouped preferences error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer preferences" },
      { status: 500 }
    );
  }
}