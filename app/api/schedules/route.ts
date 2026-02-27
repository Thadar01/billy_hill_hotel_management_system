import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface ScheduleAttendanceRow extends RowDataPacket {
  id: number;
  staff_id: string;
  staff_name: string;
  schedule_date: string;
  planned_start_time: string;
  planned_end_time: string;
  break_minutes: number;
  shift_type: string;
  schedule_status: string;
  actual_check_in: string | null;
  actual_check_out: string | null;
  attendance_status: string;
  overtime_minutes: number;
  late_minutes: number;
  worked_hours: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const week = searchParams.get("week");
    const staffId = searchParams.get("staff_id");
    const status = searchParams.get("status");

    const whereConditions: string[] = [];
    const values: (string | number)[] = [];

    if (staffId) {
      whereConditions.push("sa.staff_id = ?");
      values.push(staffId);
    }

    if (date) {
      whereConditions.push("sa.schedule_date = ?");
      values.push(date);
    }

    if (week) {
      whereConditions.push("sa.schedule_date BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY)");
      values.push(week, week);
    }

    if (status && status !== 'all') {
      whereConditions.push("sa.attendance_status = ?");
      values.push(status);
    }

    const whereSQL = whereConditions.length 
      ? `WHERE ${whereConditions.join(" AND ")}` 
      : "";

    const [rows] = await pool.query<ScheduleAttendanceRow[]>(
      `
      SELECT 
        sa.*, 
        s.staff_name,
        DATE_FORMAT(sa.schedule_date, '%Y-%m-%d') as schedule_date,
        TIME_FORMAT(sa.planned_start_time, '%H:%i') as planned_start_time,
        TIME_FORMAT(sa.planned_end_time, '%H:%i') as planned_end_time,
        TIME_FORMAT(sa.actual_check_in, '%H:%i') as actual_check_in,
        TIME_FORMAT(sa.actual_check_out, '%H:%i') as actual_check_out
      FROM schedule_attendance sa
      JOIN staffs s ON s.staff_id = sa.staff_id
      ${whereSQL}
      ORDER BY sa.schedule_date, s.staff_name
      `,
      values
    );

    return NextResponse.json({ schedules: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}

