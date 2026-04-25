import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface PayrollRow extends RowDataPacket {
  payroll_id: number;
  staff_id: string;
  staff_name: string;
  role?: string;
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
      SELECT p.*, s.staff_name, r.role
      FROM payrolls p
      JOIN staffs s ON s.staff_id = p.staff_id
      LEFT JOIN staff_roles r ON s.role_id = r.role_id
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
    const { period_start, period_end, is_fixed } = await req.json();

    let rows: AttendanceSummaryRow[] = [];

    if (is_fixed) {
      // Management Payroll: Roles NOT in ('staff', 'receptionist', 'housekeeping')
      // No time calculation, use salary_rate directly
      const [fixedRows] = await pool.query<AttendanceSummaryRow[]>(
        `
        SELECT 
          s.staff_id,
          0 as total_worked_hours,
          0 as total_overtime_minutes,
          0 as total_late_minutes,
          s.salary_rate,
          s.overtime_fees
        FROM staffs s
        JOIN staff_roles r ON s.role_id = r.role_id
        WHERE LOWER(TRIM(r.role)) NOT IN ('staff', 'receptionist', 'housekeeping')
        `
      );
      rows = fixedRows;
    } else {
      // Standard Payroll: Roles in ('staff', 'receptionist', 'housekeeping')
      // Time-based calculation
      const [standardRows] = await pool.query<AttendanceSummaryRow[]>(
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
        JOIN staff_roles r ON s.role_id = r.role_id
        WHERE sa.schedule_date BETWEEN ? AND ?
          AND LOWER(TRIM(r.role)) IN ('staff', 'receptionist', 'housekeeping')
        GROUP BY sa.staff_id
        `,
        [period_start, period_end]
      );
      rows = standardRows;
    }

    for (const row of rows) {
      let basePay = 0;
      let overtimePay = 0;
      let lateDeduction = 0;

      if (is_fixed) {
        basePay = row.salary_rate;
        // overtime and late are 0 as defined in the query
      } else {
        basePay = row.total_worked_hours * row.salary_rate;
        overtimePay = (row.total_overtime_minutes / 60) * row.overtime_fees;
        lateDeduction = (row.total_late_minutes / 60) * row.salary_rate;
      }

      const grossPay = basePay + overtimePay - lateDeduction;

      await pool.query<ResultSetHeader>(
        `
        INSERT IGNORE INTO payrolls (
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