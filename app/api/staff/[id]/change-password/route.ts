import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "Old and new passwords are required" },
        { status: 400 }
      );
    }

    // 1. Fetch staff to get current password hash
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT staff_passwords FROM staffs WHERE staff_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const staff = rows[0];

    // 2. Verify old password
    const isValid = await bcrypt.compare(oldPassword, staff.staff_passwords);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect old password" },
        { status: 401 }
      );
    }

    // 3. Hash and save new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE staffs SET staff_passwords = ? WHERE staff_id = ?",
      [hashedNewPassword, id]
    );

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password update error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
