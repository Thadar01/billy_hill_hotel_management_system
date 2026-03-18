import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface HousekeepingScheduleRow extends RowDataPacket {
  housekeeping_id: number;
  room_id: string;
  roomNumber?: string;
  staff_id: string;
  staff_name?: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  cleaning_type: string;
  status: string;
  remarks: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function GET() {
  try {
    const [rows] = await pool.query<HousekeepingScheduleRow[]>(
      `
      SELECT
        hs.housekeeping_id,
        hs.room_id,
        r.roomNumber,
        hs.staff_id,
        s.staff_name,
        DATE_FORMAT(hs.schedule_date, '%Y-%m-%d') AS schedule_date,
        TIME_FORMAT(hs.start_time, '%H:%i') AS start_time,
        TIME_FORMAT(hs.end_time, '%H:%i') AS end_time,
        hs.cleaning_type,
        hs.status,
        hs.remarks,
        DATE_FORMAT(hs.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(hs.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
      FROM housekeeping_schedules hs
      JOIN rooms r ON r.roomID = hs.room_id
      JOIN staffs s ON s.staff_id = hs.staff_id
      ORDER BY hs.schedule_date DESC, hs.start_time ASC
      `
    );

    return NextResponse.json({ schedules: rows });
  } catch (error) {
    console.error("Error fetching housekeeping schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch housekeeping schedules" },
      { status: 500 }
    );
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      room_id,
      staff_id,
      schedule_date,
      start_time,
      end_time,
      cleaning_type,
      status,
      remarks,
    } = body;

    if (
      !room_id ||
      !staff_id ||
      !schedule_date ||
      !start_time ||
      !end_time ||
      !cleaning_type
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (start_time >= end_time) {
      return NextResponse.json(
        { error: "End time must be later than start time" },
        { status: 400 }
      );
    }

    const [conflicts] = await pool.query<RowDataPacket[]>(
      `
      SELECT housekeeping_id
      FROM housekeeping_schedules
      WHERE staff_id = ?
        AND schedule_date = ?
        AND start_time < ?
        AND end_time > ?
      `,
      [staff_id, schedule_date, end_time, start_time]
    );

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: "This staff already has another schedule during that time.",
        },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO housekeeping_schedules
      (room_id, staff_id, schedule_date, start_time, end_time, cleaning_type, status, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        room_id,
        staff_id,
        schedule_date,
        start_time,
        end_time,
        cleaning_type,
        status || "pending",
        remarks || null,
      ]
    );

    return NextResponse.json({
      message: "Housekeeping schedule created successfully",
      housekeeping_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating housekeeping schedule:", error);
    return NextResponse.json(
      { error: "Failed to create housekeeping schedule" },
      { status: 500 }
    );
  }
}