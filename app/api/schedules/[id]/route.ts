// app/api/schedules/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  await pool.query(
    `
    UPDATE staff_schedules
    SET start_time=?, end_time=?, break_minutes=?, status=?
    WHERE schedule_id=?
    `,
    [
      body.start_time,
      body.end_time,
      body.break_minutes,
      body.status,
      params.id,
    ]
  );

  return NextResponse.json({ message: "Schedule updated" });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await pool.query(
    `DELETE FROM staff_schedules WHERE schedule_id=?`,
    [params.id]
  );

  return NextResponse.json({ message: "Schedule deleted" });
}

