import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface ExistingCustomer extends RowDataPacket {
  customerID: string;
  email: string;
}

function generateCustomerID() {
  return `CUST-${Date.now()}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password, phone } = body;

    if (!fullName || !email || !password || !phone) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const [existing] = await pool.query<ExistingCustomer[]>(
      `SELECT customerID, email FROM customers WHERE email = ?`,
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email is already registered." },
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
      [customerID, fullName, email, hashedPassword, phone, 0]
    );

    return NextResponse.json({
      message: "Customer registered successfully",
      customerID,
    });
  } catch (error) {
    console.error("Register customer error:", error);
    return NextResponse.json(
      { error: "Failed to register customer" },
      { status: 500 }
    );
  }
}