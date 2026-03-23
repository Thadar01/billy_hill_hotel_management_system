import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookingID: string }> }
) {
  try {
    const { bookingID } = await params;

    const [bookingRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        b.bookingID,
        b.customerID,
        c.fullName,
        c.email,
        c.phone,
        DATE_FORMAT(b.checkInDate, '%Y-%m-%d') AS checkInDate,
        DATE_FORMAT(b.checkOutDate, '%Y-%m-%d') AS checkOutDate,
        TIME_FORMAT(b.checkInTime, '%H:%i') AS checkInTime,
        TIME_FORMAT(b.checkOutTime, '%H:%i') AS checkOutTime,
        DATE_FORMAT(b.actualCheckInAt, '%Y-%m-%d %H:%i:%s') AS actualCheckInAt,
        DATE_FORMAT(b.actualCheckOutAt, '%Y-%m-%d %H:%i:%s') AS actualCheckOutAt,
        b.bookingStatus,
        b.paymentStatus,
        b.roomSubtotal,
        b.serviceSubtotal,
        b.discountAmount,
        b.pointsUsed,
        b.pointsDiscountAmount,
        b.taxAmount,
        b.totalAmount,
        b.paidAmount,
        b.refundedAmount,
        b.balanceAmount,
        b.specialRequest,
        b.note,
        DATE_FORMAT(b.createdAt, '%Y-%m-%d %H:%i:%s') AS createdAt
      FROM bookings b
      INNER JOIN customers c ON b.customerID = c.customerID
      WHERE b.bookingID = ?
      `,
      [bookingID]
    );

    if (bookingRows.length === 0) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const [roomRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        br.*,
        r.roomNumber,
        r.roomType
      FROM booking_rooms br
      INNER JOIN rooms r ON br.roomID = r.roomID
      WHERE br.bookingID = ?
      ORDER BY br.bookingRoomID ASC
      `,
      [bookingID]
    );

    const [serviceRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        bs.*,
        ps.serviceName,
        ps.description AS serviceDescription,
        DATE_FORMAT(bs.serviceDate, '%Y-%m-%d %H:%i:%s') AS serviceDate
      FROM booking_services bs
      INNER JOIN premiumservices ps
        ON bs.premiumServiceId = ps.premiumServiceId
      WHERE bs.bookingID = ?
      ORDER BY bs.bookingServiceID ASC
      `,
      [bookingID]
    );

    const [paymentRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        paymentID,
        bookingID,
        amount,
        paymentMethod,
        paymentType,
        paymentStatus,
        transactionRef,
        note,
        DATE_FORMAT(paidAt, '%Y-%m-%d %H:%i:%s') AS paidAt,
        DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i:%s') AS createdAt
      FROM payments
      WHERE bookingID = ?
      ORDER BY createdAt DESC
      `,
      [bookingID]
    );

    const [refundRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        refundID,
        bookingID,
        paymentID,
        refundAmount,
        refundMethod,
        refundStatus,
        refundReason,
        refundRef,
        note,
        DATE_FORMAT(refundedAt, '%Y-%m-%d %H:%i:%s') AS refundedAt,
        DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i:%s') AS createdAt
      FROM refunds
      WHERE bookingID = ?
      ORDER BY createdAt DESC
      `,
      [bookingID]
    );

    const [pointRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        pointTransactionID,
        customerID,
        bookingID,
        type,
        points,
        description,
        DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i:%s') AS createdAt
      FROM point_transactions
      WHERE bookingID = ?
      ORDER BY createdAt DESC
      `,
      [bookingID]
    );

    return NextResponse.json({
      booking: bookingRows[0],
      rooms: roomRows,
      services: serviceRows,
      payments: paymentRows,
      refunds: refundRows,
      pointTransactions: pointRows,
    });
  } catch (error) {
    console.error("Fetch booking detail error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch booking detail",
      },
      { status: 500 }
    );
  }
}