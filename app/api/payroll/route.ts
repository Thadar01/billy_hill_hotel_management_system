import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface PayrollRow extends RowDataPacket {
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
}

interface AttendanceSummaryRow extends RowDataPacket {
  staff_id: string;
  total_worked_hours: number;
  total_overtime_minutes: number;
  total_late_minutes: number;
  salary_rate: number;
  overtime_fees: number;
}

export async function GET() {
  try {
    const [rows] = await pool.query<PayrollRow[]>(`
      SELECT p.*, s.staff_name
      FROM payrolls p
      JOIN staffs s ON s.staff_id = p.staff_id
      ORDER BY p.period_start DESC
    `);

    return NextResponse.json({ payrolls: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch payrolls" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { period_start, period_end } = await req.json();

    const [rows] = await pool.query<AttendanceSummaryRow[]>(
      `
      SELECT 
        sa.staff_id,
        COALESCE(SUM(sa.worked_hours), 0) as total_worked_hours,
        COALESCE(SUM(sa.overtime_minutes), 0) as total_overtime_minutes,
        COALESCE(SUM(sa.late_minutes), 0) as total_late_minutes,
        s.salary_rate,
        s.overtime_fees
      FROM schedule_attendance sa
      JOIN staffs s ON s.staff_id = sa.staff_id
      WHERE sa.schedule_date BETWEEN ? AND ?
      GROUP BY sa.staff_id
      `,
      [period_start, period_end]
    );

    for (const row of rows) {
      const basePay = row.total_worked_hours * row.salary_rate;
      const overtimePay =
        (row.total_overtime_minutes / 60) * row.overtime_fees;
      const lateDeduction =
        (row.total_late_minutes / 60) * row.salary_rate;
      const grossPay = basePay + overtimePay - lateDeduction;

      await pool.query<ResultSetHeader>(
        `
        INSERT INTO payrolls (
          staff_id,
          period_start,
          period_end,
          total_worked_hours,
          total_overtime_minutes,
          total_late_minutes,
          base_pay,
          overtime_pay,
          late_deduction,
          gross_pay
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          row.staff_id,
          period_start,
          period_end,
          row.total_worked_hours,
          row.total_overtime_minutes,
          row.total_late_minutes,
          basePay,
          overtimePay,
          lateDeduction,
          grossPay,
        ]
      );
    }

    return NextResponse.json({
      message: "Payroll generated successfully",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate payroll" },
      { status: 500 }
    );
  }
}