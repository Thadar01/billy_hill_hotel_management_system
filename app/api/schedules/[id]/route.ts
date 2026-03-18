// app/api/schedule-attendance/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await pool.query<ScheduleAttendanceRow[]>(
      `SELECT 
        sa.id,
        sa.staff_id,
        s.staff_name,
        DATE_FORMAT(sa.schedule_date, '%Y-%m-%d') as schedule_date,
        TIME_FORMAT(sa.planned_start_time, '%H:%i') as planned_start_time,
        TIME_FORMAT(sa.planned_end_time, '%H:%i') as planned_end_time,
        sa.break_minutes,
        sa.shift_type,
        sa.schedule_status,
        TIME_FORMAT(sa.actual_check_in, '%H:%i') as actual_check_in,
        TIME_FORMAT(sa.actual_check_out, '%H:%i') as actual_check_out,
        sa.attendance_status,
        sa.overtime_minutes,
        sa.late_minutes,
        sa.worked_hours,
        DATE_FORMAT(sa.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        DATE_FORMAT(sa.updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
       FROM schedule_attendance sa
       JOIN staffs s ON s.staff_id = sa.staff_id
       WHERE sa.id = ?`,
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
    const { id } = await params;
    const body = await req.json();

    // Validate required fields
    if (!body.planned_start_time || !body.planned_end_time) {
      return NextResponse.json(
        { error: "Start time and end time are required" },
        { status: 400 }
      );
    }

    // Update schedule details (planned shift)
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE schedule_attendance 
       SET planned_start_time = ?,
           planned_end_time = ?,
           break_minutes = ?,
           shift_type = ?,
           schedule_status = ?
       WHERE id = ?`,
      [
        body.planned_start_time,
        body.planned_end_time,
        body.break_minutes || 0,
        body.shift_type || 'morning',
        body.schedule_status || 'scheduled',
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Schedule updated successfully",
      id: parseInt(id)
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Handle different patch actions
    if (body.action === "checkin") {
      const now = new Date(body.time);

      const [schedules] = await pool.query<ScheduleAttendanceRow[]>(
        "SELECT * FROM schedule_attendance WHERE id = ?",
        [id]
      );

      if (!schedules.length) {
        return NextResponse.json(
          { error: "Schedule not found" },
          { status: 404 }
        );
      }

      const schedule = schedules[0];

      // ✅ Create plannedStart safely
      const plannedStart = new Date(schedule.schedule_date);

      const [hour, minute, second] = schedule.planned_start_time
        .split(":")
        .map(Number);

      plannedStart.setHours(hour, minute, second || 0, 0);

      // ✅ Calculate lateness
      const diffMs = now.getTime() - plannedStart.getTime();
      const lateMinutes = diffMs > 0
        ? Math.floor(diffMs / (1000 * 60))
        : 0;

      const isLate = lateMinutes > 0;

      console.log("Planned:", plannedStart);
      console.log("Actual:", now);
      console.log("Late minutes:", lateMinutes);

      await pool.query(
        `UPDATE schedule_attendance 
     SET actual_check_in = ?,
         attendance_status = ?,
         late_minutes = ?
     WHERE id = ?`,
        [
          now,
          isLate ? "late" : "present",
          lateMinutes,
          id
        ]
      );
    }
else if (body.action === "checkout") {
  const now = body.time ? new Date(body.time) : new Date();

  const [schedules] = await pool.query<ScheduleAttendanceRow[]>(
    `SELECT 
       id,
       staff_id,
       DATE_FORMAT(schedule_date, '%Y-%m-%d') AS schedule_date,
       TIME_FORMAT(planned_start_time, '%H:%i:%s') AS planned_start_time,
       TIME_FORMAT(planned_end_time, '%H:%i:%s') AS planned_end_time,
       TIME_FORMAT(actual_check_in, '%H:%i:%s') AS actual_check_in,
       TIME_FORMAT(actual_check_out, '%H:%i:%s') AS actual_check_out,
       break_minutes,
       attendance_status,
       late_minutes,
       worked_hours,
       overtime_minutes,
       schedule_status,
       shift_type
     FROM schedule_attendance
     WHERE id = ?`,
    [id]
  );

  if (!schedules.length) {
    return NextResponse.json(
      { error: "Schedule not found" },
      { status: 404 }
    );
  }

  const schedule = schedules[0];

  if (!schedule.actual_check_in) {
    return NextResponse.json(
      { error: "Cannot checkout without checkin" },
      { status: 400 }
    );
  }

  if (isNaN(now.getTime())) {
    return NextResponse.json(
      { error: "Invalid checkout time" },
      { status: 400 }
    );
  }

  const rawScheduleDate = String(schedule.schedule_date); // YYYY-MM-DD
  const rawCheckIn = String(schedule.actual_check_in);    // HH:mm:ss

  const checkInTime = new Date(`${rawScheduleDate}T${rawCheckIn}`);

  if (isNaN(checkInTime.getTime())) {
    return NextResponse.json(
      {
        error: "Invalid checkin time",
        raw_checkin: rawCheckIn,
        schedule_date: rawScheduleDate,
      },
      { status: 400 }
    );
  }

  if (now.getTime() < checkInTime.getTime()) {
    return NextResponse.json(
      { error: "Checkout time cannot be earlier than checkin time" },
      { status: 400 }
    );
  }

  const totalWorkedSeconds = Math.floor(
    (now.getTime() - checkInTime.getTime()) / 1000
  );

  const breakSeconds = (schedule.break_minutes || 0) * 60;

  const netWorkedSeconds =
    totalWorkedSeconds > breakSeconds
      ? totalWorkedSeconds - breakSeconds
      : totalWorkedSeconds;

  const workedHours = Number((netWorkedSeconds / 3600).toFixed(2));

  const plannedEnd = new Date(`${rawScheduleDate}T${schedule.planned_end_time}`);

  const diffMs = now.getTime() - plannedEnd.getTime();
  const overtimeMinutes =
    diffMs > 0 ? Math.floor(diffMs / (1000 * 60)) : 0;

  await pool.query(
    `UPDATE schedule_attendance 
     SET actual_check_out = ?,
         worked_hours = ?,
         overtime_minutes = ?
     WHERE id = ?`,
    [now, workedHours, overtimeMinutes, id]
  );

  return NextResponse.json({
    message: "checkout successful",
    id: parseInt(id),
    worked_hours: workedHours,
    overtime_minutes: overtimeMinutes,
  });
}
    else if (body.action === 'status') {
      const newStatus = body.attendance_status;

      // If the user sets "cancelled", update schedule_status instead
      if (newStatus === 'cancelled') {
        await pool.query(
          `UPDATE schedule_attendance 
       SET schedule_status = ?
       WHERE id = ?`,
          [newStatus || `Status manually set to ${newStatus}`, id]
        );
      } else {
        // Normal attendance status updates
        await pool.query(
          `UPDATE schedule_attendance 
       SET attendance_status = ?
       WHERE id = ?`,
          [newStatus || `Status manually set to ${newStatus}`, id]
        );
      }
    }


    return NextResponse.json({
      message: `${body.action} successful`,
      id: parseInt(id)
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Failed to update attendance" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM schedule_attendance WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Schedule deleted successfully",
      id: parseInt(id)
    });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}

// Helper function to calculate minutes between two times
function calculateMinutesDifference(start: string | Date | null, end: string | Date | null): number {
  if (!start || !end) return 0;

  const startDate = new Date(`2000-01-01T${start}`);
  const endDate = new Date(`2000-01-01T${end}`);
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
}