import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";
import { recalculateBookingAmounts } from "@/lib/bookingHelpers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingID: string }> }
) {
  const connection = await pool.getConnection();

  try {
    const { bookingID } = await params;
    const body = await req.json();

    const {
      paymentID,
      refundAmount,
      refundMethod,
      refundStatus = "pending",
      refundReason,
      refundRef,
      note,
    }: {
      paymentID: number;
      refundAmount: number;
      refundMethod: "cash" | "kbzpay" | "wavepay" | "bank_transfer" | "card";
      refundStatus?: "pending" | "approved" | "rejected";
      refundReason?: string | null;
      refundRef?: string | null;
      note?: string | null;
    } = body;

    if (
      !paymentID ||
      !refundAmount ||
      Number(refundAmount) <= 0 ||
      !refundMethod
    ) {
      return NextResponse.json(
        { error: "paymentID, refundAmount and refundMethod are required" },
        { status: 400 }
      );
    }

    if (!["pending", "approved", "rejected"].includes(refundStatus)) {
      return NextResponse.json(
        { error: "Invalid refundStatus" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const [bookingRows] = await connection.query<RowDataPacket[]>(
      `
      SELECT bookingID, bookingStatus
      FROM bookings
      WHERE bookingID = ?
      `,
      [bookingID]
    );

    if (bookingRows.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = bookingRows[0];

    if (booking.bookingStatus !== "cancelled") {
      throw new Error("Refund can only be created for cancelled bookings");
    }

    const [paymentRows] = await connection.query<RowDataPacket[]>(
      `
      SELECT paymentID, bookingID, amount
      FROM payments
      WHERE paymentID = ?
        AND bookingID = ?
      `,
      [paymentID, bookingID]
    );

    if (paymentRows.length === 0) {
      throw new Error("Payment not found for this booking");
    }

    const payment = paymentRows[0];

    const [refundSumRows] = await connection.query<RowDataPacket[]>(
      `
      SELECT COALESCE(SUM(refundAmount), 0) AS totalRefunded
      FROM refunds
      WHERE paymentID = ?
        AND refundStatus = 'approved'
      `,
      [paymentID]
    );

    const alreadyRefunded = Number(refundSumRows[0].totalRefunded || 0);
    const remainingRefundable = Number(payment.amount) - alreadyRefunded;

    if (Number(refundAmount) > remainingRefundable) {
      throw new Error(
        `Refund exceeds remaining refundable amount. Remaining: ${remainingRefundable}`
      );
    }

    await connection.query(
      `
      INSERT INTO refunds (
        bookingID,
        paymentID,
        refundAmount,
        refundMethod,
        refundStatus,
        refundReason,
        refundRef,
        note,
        refundedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        bookingID,
        paymentID,
        Number(refundAmount),
        refundMethod,
        refundStatus,
        refundReason || null,
        refundRef || null,
        note || null,
        refundStatus === "approved" ? new Date() : null,
      ]
    );

    await recalculateBookingAmounts(connection, bookingID);

    await connection.commit();

    return NextResponse.json({
      message: "Refund added successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Add refund error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to add refund",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}