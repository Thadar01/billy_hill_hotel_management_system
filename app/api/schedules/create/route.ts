import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// request interface
interface ScheduleCreateRequest {
  staff_ids: string[];
  dates: string[]; // exact dates
  start_time: string;
  end_time: string;
  break_minutes: number;
  shift_type: "morning" | "evening" | "night";
}

export async function POST(req: NextRequest) {
  try {
    const body: ScheduleCreateRequest = await req.json();
    const { staff_ids, dates, start_time, end_time, break_minutes, shift_type } = body;

    if (!staff_ids.length || !dates.length || !start_time || !end_time || !shift_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    for (const staff_id of staff_ids) {
      for (const date of dates) {
        await pool.query(
          `
          INSERT INTO staff_schedules
            (staff_id, schedule_date, start_time, end_time, break_minutes, shift_type)
          VALUES (?, ?, ?, ?, ?, ?)
          `,
          [staff_id, date, start_time, end_time, break_minutes, shift_type]
        );
      }
    }

    return NextResponse.json({ message: "Schedule created successfully" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Failed to create schedule:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
