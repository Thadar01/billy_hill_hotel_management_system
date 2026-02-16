// app/api/schedules/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");   // daily
  const week = searchParams.get("week");   // YYYY-MM-DD (Monday)

  let where = "";
  let values: string[] = [];

  if (date) {
    where = "WHERE s.schedule_date = ?";
    values = [date];
  }

  if (week) {
    where = "WHERE s.schedule_date BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY)";
    values = [week, week];
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 
      s.*, 
      st.staff_name,
      DATE_FORMAT(s.schedule_date, '%Y-%m-%d') as schedule_date,
      TIME_FORMAT(s.start_time, '%H:%i:%s') as start_time,
      TIME_FORMAT(s.end_time, '%H:%i:%s') as end_time,
      DATE_FORMAT(s.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
      DATE_FORMAT(s.updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
    FROM staff_schedules s
    JOIN staffs st ON st.staff_id = s.staff_id
    ${where}
    ORDER BY s.schedule_date, st.staff_name
    `,
    values
  );

  return NextResponse.json({ schedules: rows });
}