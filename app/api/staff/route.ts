import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface StaffRow extends RowDataPacket {
  staff_id: string;
  staff_name: string;
  staff_gmail: string;
  staff_phone: string;
  role_id: number;
  salary_rate: number;
  overtime_fees: number;
  role: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("q") || "";
    const roleId = searchParams.get("role_id") || "";

    // Build dynamic WHERE clause
    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (query) {
      conditions.push("s.staff_name LIKE ?");
      values.push(`%${query}%`);
    }

    if (roleId) {
      conditions.push("s.role_id = ?");
      values.push(Number(roleId));
    }

    const whereSQL = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Fetch all staff with role join (no LIMIT/OFFSET)
    const [rows] = await pool.query<StaffRow[]>(
      `
      SELECT s.staff_id, s.staff_name, s.staff_gmail, s.staff_phone,
             s.role_id, s.salary_rate, s.overtime_fees,
             r.role
      FROM staffs s
      LEFT JOIN staff_roles r ON s.role_id = r.role_id
      ${whereSQL}
      ORDER BY s.staff_name ASC
      `,
      values
    );

    return NextResponse.json({ staff: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}
