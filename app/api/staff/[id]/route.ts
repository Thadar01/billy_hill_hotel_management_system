// app/api/staff/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";

// GET /api/staff/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM staffs WHERE staff_id=?`,
      [id]
    );
    
    if (rows.length === 0) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const staff = rows[0];

    // Fetch Performance Data (Last 30 Days)
    const [performanceRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        IFNULL(SUM(worked_hours), 0) as totalWorkedHours,
        IFNULL(SUM(overtime_minutes), 0) as totalOvertimeMinutes,
        IFNULL(SUM(late_minutes), 0) as totalLateMinutes
      FROM schedule_attendance
      WHERE staff_id = ? 
        AND schedule_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND attendance_status != 'cancelled'
      `,
      [id]
    );

    return NextResponse.json({
      ...staff,
      performance: {
        stats: performanceRows[0]
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

// PUT /api/staff/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { staff_name, staff_gmail, staff_phone, role_id, salary_rate, overtime_fees } = body;

    await pool.query(
      `UPDATE staffs 
       SET staff_name=?, staff_gmail=?, staff_phone=?, role_id=?, salary_rate=?, overtime_fees=? 
       WHERE staff_id=?`,
      [staff_name, staff_gmail, staff_phone, role_id, salary_rate, overtime_fees, id]
    );

    return NextResponse.json({ message: "Staff updated successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

// DELETE /api/staff/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await pool.query(`DELETE FROM staffs WHERE staff_id=?`, [id]);
    return NextResponse.json({ message: "Staff deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}

// PATCH /api/staff/:id (Reset Password)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const newPassword = "Staff123!@#";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE staffs SET staff_passwords=? WHERE staff_id=?`,
      [hashedPassword, id]
    );

    return NextResponse.json({
      message: "Password reset successfully",
      password: newPassword,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}