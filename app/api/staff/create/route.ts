import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import pool from "@/lib/db";
import { ResultSetHeader } from "mysql2";
import { v4 as uuidv4 } from "uuid";


export async function POST(req: NextRequest) {
  try {
    const {
      staff_name,
      staff_phone,
      staff_gmail,
      staff_passwords,
      salary_rate,
      overtime_fees,
      staff_profile,
      date_of_birth,
      role_id,
    } = await req.json();

    if (
      !staff_name ||
      !staff_gmail ||
      !staff_passwords ||
      !salary_rate ||
      !overtime_fees ||
      !role_id
    ) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(staff_passwords, 10);
    const staffId = uuidv4(); 

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO staffs 
      (staff_id, staff_name, staff_phone, staff_gmail, staff_passwords, salary_rate, overtime_fees, staff_profile, date_of_birth, role_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staffId,
        staff_name,
        staff_phone || null,
        staff_gmail,
        hashedPassword,
        salary_rate,
        overtime_fees,
        staff_profile || null,
        date_of_birth || null,
        role_id,
      ]
    );

    return NextResponse.json({
      message: "Staff created successfully",
      staffId: result.insertId,
    });
  } catch (err: unknown) {
    console.error(err);

    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "ER_DUP_ENTRY"
    ) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
