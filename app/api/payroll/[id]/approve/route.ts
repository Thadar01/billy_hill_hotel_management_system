import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader } from "mysql2";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `
      UPDATE payrolls
      SET status = 'approved'
      WHERE payroll_id = ?
      AND status = 'draft'
      `,
      [params.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Payroll not found or not draft" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Payroll approved" });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to approve payroll" },
      { status: 500 }
    );
  }
}