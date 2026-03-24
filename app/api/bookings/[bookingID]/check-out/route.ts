import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ bookingID: string }> }
) {
  const connection = await pool.getConnection();

  try {
    const { bookingID } = await params;

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
      await connection.rollback();
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = bookingRows[0];

    if (booking.bookingStatus !== "checked_in") {
      await connection.rollback();
      return NextResponse.json(
        {
          error: `Only checked-in bookings can be checked out. Current status: ${booking.bookingStatus}`,
        },
        { status: 400 }
      );
    }

    await connection.query(
      `
      UPDATE bookings
      SET bookingStatus = 'checked_out',
          actualCheckOutAt = NOW()
      WHERE bookingID = ?
      `,
      [bookingID]
    );

    // Update rooms to 'check-out' status
    await connection.query(
      `
      UPDATE rooms r
      INNER JOIN booking_rooms br ON r.roomID = br.roomID
      SET r.roomStatus = 'check-out'
      WHERE br.bookingID = ?
      `,
      [bookingID]
    );

    await connection.commit();

    return NextResponse.json({
      message: "Checked out successfully",
      bookingID,
      bookingStatus: "checked_out",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Check-out error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check out",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
