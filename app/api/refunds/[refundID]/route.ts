import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";
import { recalculateBookingAmounts } from "@/lib/bookingHelpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ refundID: string }> }
) {
  try {
    const { refundID } = await params;

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
        c.email AS customerEmail,
        c.phone AS customerPhone
      FROM refunds r
      INNER JOIN bookings b ON r.bookingID = b.bookingID
      INNER JOIN customers c ON b.customerID = c.customerID
      WHERE r.refundID = ?
      `,
      [refundID]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Refund not found" }, { status: 404 });
    }

    return NextResponse.json({ refund: rows[0] });
  } catch (error) {
    console.error("Fetch refund detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch refund detail" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ refundID: string }> }
) {
  const connection = await pool.getConnection();

  try {
    const { refundID } = await params;
    const body = await req.json();
    const { refundStatus } = body;

    if (!["accepted", "rejected"].includes(refundStatus)) {
      return NextResponse.json(
        { error: "Invalid refundStatus. Must be 'accepted' or 'rejected'" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // Check if refund exists
    const [refundRows] = await connection.query<RowDataPacket[]>(
      "SELECT refundID, bookingID, refundStatus FROM refunds WHERE refundID = ?",
      [refundID]
    );

    if (refundRows.length === 0) {
      throw new Error("Refund not found");
    }

    const refund = refundRows[0];

    // Update refund status
    await connection.query(
      `
      UPDATE refunds 
      SET refundStatus = ?, 
          refundedAt = ?
      WHERE refundID = ?
      `,
      [
        refundStatus,
        refundStatus === "accepted" ? new Date() : null,
        refundID,
      ]
    );

    // Recalculate booking amounts
    await recalculateBookingAmounts(connection, refund.bookingID);

    await connection.commit();

    return NextResponse.json({
      message: `Refund ${refundStatus} successfully`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update refund status error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update refund",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
