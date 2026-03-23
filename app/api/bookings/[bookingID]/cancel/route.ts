import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingID: string }> }
) {
  const connection = await pool.getConnection();

  try {
    const { bookingID } = await params;
    const body = await req.json().catch(() => ({}));
    const { customerID } = body as { customerID?: string };

    await connection.beginTransaction();

    const [rows] = await connection.query<RowDataPacket[]>(
      `
      SELECT bookingID, customerID, bookingStatus
      FROM bookings
      WHERE bookingID = ?
      `,
      [bookingID]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = rows[0];

    if (!customerID) {
      await connection.rollback();
      return NextResponse.json(
        { error: "customerID is required" },
        { status: 400 }
      );
    }

    if (booking.customerID !== customerID) {
      await connection.rollback();
      return NextResponse.json(
        { error: "You are not allowed to cancel this booking" },
        { status: 403 }
      );
    }

    if (booking.bookingStatus !== "confirmed") {
      await connection.rollback();
      return NextResponse.json(
        {
          error: `Only confirmed bookings can be cancelled. Current status: ${booking.bookingStatus}`,
        },
        { status: 400 }
      );
    }

    await connection.query(
      `
      UPDATE bookings
      SET bookingStatus = 'cancelled'
      WHERE bookingID = ?
      `,
      [bookingID]
    );

    await connection.commit();

    return NextResponse.json({
      message: "Booking cancelled successfully",
      bookingID,
      bookingStatus: "cancelled",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Cancel booking error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to cancel booking",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}