import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      staff_ids, 
      dates, 
      start_time, 
      end_time, 
      break_minutes, 
      shift_type,
      schedule_status = 'scheduled'
    } = body;

    // Validate input
    if (!staff_ids?.length || !dates?.length || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let createdCount = 0;
      const errors: string[] = [];

      // Insert for each staff and date combination
      for (const staff_id of staff_ids) {
        for (const date of dates) {
          try {
            // Check if record already exists
            const [existing] = await connection.query<RowDataPacket[]>(
              "SELECT id FROM schedule_attendance WHERE staff_id = ? AND schedule_date = ?",
              [staff_id, date]
            );

            if (existing.length > 0) {
              errors.push(`Schedule already exists for staff ${staff_id} on ${date}`);
              continue;
            }

            // Insert new schedule
            await connection.query(
              `INSERT INTO schedule_attendance 
               (staff_id, schedule_date, planned_start_time, planned_end_time, 
                break_minutes, shift_type, schedule_status) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [staff_id, date, start_time, end_time, break_minutes, shift_type, schedule_status]
            );

            createdCount++;
          } catch (err) {
            errors.push(`Failed for staff ${staff_id} on ${date}: ${err}`);
          }
        }
      }

      await connection.commit();

      return NextResponse.json({
        message: "Bulk schedule creation completed",
        created: createdCount,
        errors: errors.length > 0 ? errors : undefined,
        total_expected: staff_ids.length * dates.length
      });

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Bulk schedule creation error:", err);
    return NextResponse.json(
      { error: "Failed to create schedules" }, 
      { status: 500 }
    );
  }
}
