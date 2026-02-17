// app/api/schedules/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";


// app/api/schedules/[id]/route.ts (add this GET function to the existing file)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        s.schedule_id,
        s.staff_id,
        st.staff_name,
        DATE_FORMAT(s.schedule_date, '%Y-%m-%d') as schedule_date,
        TIME_FORMAT(s.start_time, '%H:%i:%s') as start_time,
        TIME_FORMAT(s.end_time, '%H:%i:%s') as end_time,
        s.break_minutes,
        s.shift_type,
        s.status,
        DATE_FORMAT(s.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        DATE_FORMAT(s.updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
       FROM staff_schedules s
       JOIN staffs st ON st.staff_id = s.staff_id
       WHERE s.schedule_id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ schedule: rows[0] });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

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