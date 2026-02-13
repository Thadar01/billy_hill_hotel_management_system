import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";

interface StaffRow extends RowDataPacket {
  staff_id: number;
  staff_name: string;
  staff_gmail: string;
  staff_passwords: string;
  role_id: number;
}

export async function POST(req: NextRequest) {
  try {
    const { staff_gmail, staff_passwords } = await req.json();

    if (!staff_gmail || !staff_passwords) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<StaffRow[]>(
      "SELECT staff_id, staff_name, staff_gmail, staff_passwords, role_id FROM staffs WHERE staff_gmail = ?",
      [staff_gmail]
    );

    const staff = rows[0];

    if (!staff) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(
      staff_passwords,
      staff.staff_passwords
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 🔐 Create JWT
    const token = jwt.sign(
      {
        staff_id: staff.staff_id,
        role_id: staff.role_id,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    // 🍪 Store token in HTTP-only cookie
    const response = NextResponse.json({
      message: "Login successful",
      staff: {
        staff_id: staff.staff_id,
        staff_name: staff.staff_name,
        staff_gmail: staff.staff_gmail,
        role_id: staff.role_id,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
