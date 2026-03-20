import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader } from "mysql2";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ "customer-id": string }> }
) {
  try {
    const { "customer-id": customerID } = await params;
    const body = await req.json();

    const { preferenceKey, values } = body as {
      preferenceKey: string;
      values: string[];
    };

    if (!customerID || !preferenceKey || !Array.isArray(values)) {
      return NextResponse.json(
        { error: "customer-id, preferenceKey, and values are required." },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        `
        DELETE FROM customer_preference_items
        WHERE customerID = ? AND preferenceKey = ?
        `,
        [customerID, preferenceKey]
      );

      const cleanValues = values
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0);

      for (const value of cleanValues) {
        await connection.query<ResultSetHeader>(
          `
          INSERT INTO customer_preference_items
          (customerID, preferenceKey, preferenceValue)
          VALUES (?, ?, ?)
          `,
          [customerID, preferenceKey, value]
        );
      }

      await connection.commit();

      return NextResponse.json({
        message: "Customer preferences replaced successfully",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Replace customer preferences error:", error);
    return NextResponse.json(
      { error: "Failed to replace customer preferences" },
      { status: 500 }
    );
  }
}