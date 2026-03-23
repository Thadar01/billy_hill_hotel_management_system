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

    if (booking.bookingStatus !== "confirmed") {
      await connection.rollback();
      return NextResponse.json(
        {
          error: `Only confirmed bookings can be checked in. Current status: ${booking.bookingStatus}`,
        },
        { status: 400 }
      );
    }

    const [roomRows] = await connection.query<RowDataPacket[]>(
      `
      SELECT br.roomID, r.roomStatus
      FROM booking_rooms br
      INNER JOIN rooms r ON br.roomID = r.roomID
      WHERE br.bookingID = ?
      `,
      [bookingID]
    );

    if (roomRows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: "No rooms found for this booking" },
        { status: 400 }
      );
    }

    const blockedRooms = roomRows.filter(
      (room) => room.roomStatus === "maintenance"
    );

    if (blockedRooms.length > 0) {
      await connection.rollback();
      return NextResponse.json(
        {
          error: `Some rooms cannot be checked in because they are under maintenance: ${blockedRooms
            .map((r) => r.roomID)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    await connection.query(
      `
      UPDATE bookings
      SET bookingStatus = 'checked_in',
          actualCheckInAt = NOW()
      WHERE bookingID = ?
      `,
      [bookingID]
    );

    await connection.query(
      `
      UPDATE rooms r
      INNER JOIN booking_rooms br ON r.roomID = br.roomID
      SET r.roomStatus = 'occupied'
      WHERE br.bookingID = ?
      `,
      [bookingID]
    );

    await connection.commit();

    return NextResponse.json({
      message: "Checked in successfully",
      bookingID,
      bookingStatus: "checked_in",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Check-in error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check in",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}