import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface RoleRow extends RowDataPacket {
  role_id: number;
  role: string;
}

export async function GET(req: NextRequest) {
  try {
    const [rows] = await pool.query<RoleRow[]>("SELECT * FROM staff_roles");
    return NextResponse.json({ roles: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}
