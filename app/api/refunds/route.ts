import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        r.refundID,
        r.bookingID,
        r.paymentID,
        r.refundAmount,
        r.refundMethod,
        r.refundStatus,
        r.refundReason,
        r.refundRef,
        r.note,
        DATE_FORMAT(r.refundedAt, '%Y-%m-%d %H:%i:%s') AS refundedAt,
        DATE_FORMAT(r.createdAt, '%Y-%m-%d %H:%i:%s') AS createdAt,
        c.fullName AS customerName,
        c.email AS customerEmail
      FROM refunds r
      INNER JOIN bookings b ON r.bookingID = b.bookingID
      INNER JOIN customers c ON b.customerID = c.customerID
      ORDER BY r.createdAt DESC
      `
    );

    return NextResponse.json({ refunds: rows });
  } catch (error) {
    console.error("Fetch all refunds error:", error);
    return NextResponse.json(
      { error: "Failed to fetch refunds" },
      { status: 500 }
    );
  }
}
