import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader } from "mysql2";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [result] = await pool.query<ResultSetHeader>(
      `
      UPDATE payrolls
      SET status = 'paid',
          paid_at = NOW()
      WHERE payroll_id = ?
      AND status = 'approved'
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Payroll not found or not approved" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Payroll paid successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to pay payroll" },
      { status: 500 }
    );
  }
}