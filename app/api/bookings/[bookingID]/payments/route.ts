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
      amount,
      paymentMethod,
      paymentType = "partial",
      paymentStatus = "paid",
      transactionRef,
      note,
    }: {
      amount: number;
      paymentMethod: "cash" | "kbzpay" | "wavepay" | "bank_transfer" | "card";
      paymentType?: "deposit" | "partial" | "full" | "balance";
      paymentStatus?: "pending" | "paid" | "failed" | "cancelled";
      transactionRef?: string | null;
      note?: string | null;
    } = body;

    if (!amount || Number(amount) <= 0 || !paymentMethod) {
      return NextResponse.json(
        { error: "amount and paymentMethod are required" },
        { status: 400 }
      );
    }

    if (!["pending", "paid", "failed", "cancelled"].includes(paymentStatus)) {
      return NextResponse.json(
        { error: "Invalid paymentStatus" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const [bookingRows] = await connection.query<RowDataPacket[]>(
      `
      SELECT bookingID, bookingStatus, balanceAmount
      FROM bookings
      WHERE bookingID = ?
      `,
      [bookingID]
    );

    if (bookingRows.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = bookingRows[0];

    if (booking.bookingStatus === "cancelled") {
      throw new Error("Cannot add payment to a cancelled booking");
    }

    if (booking.bookingStatus === "checked_out") {
      throw new Error("Cannot add payment to a checked-out booking");
    }

    await connection.query(
      `
      INSERT INTO payments (
        bookingID,
        amount,
        paymentMethod,
        paymentType,
        paymentStatus,
        transactionRef,
        note,
        paidAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        bookingID,
        Number(amount),
        paymentMethod,
        paymentType,
        paymentStatus,
        transactionRef || null,
        note || null,
        paymentStatus === "paid" ? new Date() : null,
      ]
    );

    await recalculateBookingAmounts(connection, bookingID);

    await connection.commit();

    return NextResponse.json({
      message: "Payment added successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Add payment error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to add payment",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}