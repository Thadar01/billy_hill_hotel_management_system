import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface PayrollDetailRow extends RowDataPacket {
  payroll_id: number;
  staff_id: string;
  staff_name: string;
  period_start: string;
  period_end: string;
  total_worked_hours: number;
  total_overtime_minutes: number;
  total_late_minutes: number;
  base_pay: number;
  overtime_pay: number;
  late_deduction: number;
  gross_pay: number;
  status: "draft" | "approved" | "paid";
  paid_at: string | null;
  created_at: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await pool.query<PayrollDetailRow[]>(
      `
      SELECT p.*, s.staff_name
      FROM payrolls p
      JOIN staffs s ON s.staff_id = p.staff_id
      WHERE p.payroll_id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Payroll not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ payroll: rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch payroll" },
      { status: 500 }
    );
  }
}