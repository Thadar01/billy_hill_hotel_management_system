import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader } from "mysql2";

// Interface for request body
interface RoleRequest {
  role: string;
}

// Interface for MySQL error
interface MySQLError extends Error {
  code?: string;
}

/**
 * ✏️ UPDATE ROLE
 * PUT /api/roles/:id
 */
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params; // ✅ MUST await

  try {
    const body: RoleRequest = await req.json();

    if (!body.role) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE staff_roles SET role=? WHERE role_id=?",
      [body.role, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Role updated successfully",
    });
  } catch (err) {
    console.error(err);

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

/**
 * ❌ DELETE ROLE
 * DELETE /api/roles/:id
 */
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params; // ✅ MUST await

  try {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM staff_roles WHERE role_id=?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Role deleted successfully",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
