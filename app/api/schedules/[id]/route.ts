// app/api/schedules/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to get the id
    const { id } = await params;
    const body = await req.json();
    
    // Check if this is a status-only update or full update
    if (Object.keys(body).length === 1 && body.status) {
      // Status-only update
      await pool.query(
        `UPDATE staff_schedules SET status=? WHERE schedule_id=?`,
        [body.status, id]
      );
    } else {
      // Full update
      await pool.query(
        `UPDATE staff_schedules SET start_time=?, end_time=?, break_minutes=?, status=? WHERE schedule_id=?`,
        [
          body.start_time,
          body.end_time,
          body.break_minutes,
          body.status,
          id,
        ]
      );
    }

    return NextResponse.json({ message: "Schedule updated successfully" });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to get the id
    const { id } = await params;
    
    await pool.query(
      `DELETE FROM staff_schedules WHERE schedule_id=?`,
      [id]
    );

    return NextResponse.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}