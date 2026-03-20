import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface CustomerRow extends RowDataPacket {
  customerID: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
  createdAt: string;
  points: number;
}

function generateCustomerID() {
  return `CUST-${Date.now()}`;
}

export async function GET() {
  try {
    const [rows] = await pool.query<CustomerRow[]>(
      `
      SELECT customerID, fullName, email, phone, createdAt, points
      FROM customers
      ORDER BY createdAt DESC
      `
    );

    return NextResponse.json({ customers: rows });
  } catch (error) {
    console.error("Fetch customers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password, phone, points } = body;

    if (!fullName || !email || !password || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [existing] = await pool.query<CustomerRow[]>(
      `SELECT customerID FROM customers WHERE email = ?`,
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const customerID = generateCustomerID();

    await pool.query<ResultSetHeader>(
      `
      INSERT INTO customers
      (customerID, fullName, email, password, phone, points)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [customerID, fullName, email, hashedPassword, phone, points ?? 0]
    );

    return NextResponse.json({
      message: "Customer created successfully",
      customerID,
    });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}