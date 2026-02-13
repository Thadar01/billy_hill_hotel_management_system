import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader } from "mysql2";

// Interface for the request body
interface RoleRequest {
  role: string;
}

// Interface for MySQL error
interface MySQLError extends Error {
  code?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RoleRequest = await req.json();

    if (!body.role) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      );
    }

    // Insert role into database
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO staff_roles (role) VALUES (?)",
      [body.role]
    );

    return NextResponse.json({
      message: "Role created successfully",
      roleId: result.insertId,
    });
  } catch (err) {
    console.error(err);

    // Type-safe error check
    const mysqlErr = err as MySQLError;
    if (mysqlErr.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Role already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
