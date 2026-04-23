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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [customerRows] = await pool.query<CustomerRow[]>(
      `
      SELECT customerID, fullName, email, phone, createdAt, points
      FROM customers
      WHERE customerID = ?
      `,
      [id]
    );

    if (customerRows.length === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Fetch Bookings
    const [bookingRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        bookingID, 
        DATE_FORMAT(checkInDate, '%Y-%m-%d') as checkInDate, 
        DATE_FORMAT(checkOutDate, '%Y-%m-%d') as checkOutDate, 
        totalAmount, 
        bookingStatus,
        paymentStatus,
        createdAt
      FROM bookings
      WHERE customerID = ?
      ORDER BY createdAt DESC
      `,
      [id]
    );

    // Fetch Feedbacks with Room Info
    const [feedbackRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        f.*,
        GROUP_CONCAT(DISTINCT r.roomNumber SEPARATOR ', ') as roomNumbers
      FROM feedbacks f
      LEFT JOIN bookings b ON f.bookingID = b.bookingID
      LEFT JOIN booking_rooms br ON b.bookingID = br.bookingID
      LEFT JOIN rooms r ON br.roomID = r.roomID
      WHERE f.customerID = ?
      GROUP BY f.feedbackId
      ORDER BY f.createdAt DESC
      `,
      [id]
    );
    console.log("DEBUG: Feedback Rows for", id, feedbackRows);

    return NextResponse.json({ 
      customer: customerRows[0],
      bookings: bookingRows,
      feedbacks: feedbackRows
    });
  } catch (error) {
    console.error("Fetch customer error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { fullName, phone, oldPassword, newPassword } = body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { error: "Full name and phone are required." },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<CustomerRow[]>(
      `
      SELECT customerID, fullName, email, password, phone, createdAt, points
      FROM customers
      WHERE customerID = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const existingCustomer = rows[0];

    if (newPassword) {
      if (!oldPassword) {
        return NextResponse.json(
          { error: "Old password is required to change password." },
          { status: 400 }
        );
      }

      const isOldPasswordCorrect = await bcrypt.compare(
        oldPassword,
        existingCustomer.password
      );

      if (!isOldPasswordCorrect) {
        return NextResponse.json(
          { error: "Old password is incorrect." },
          { status: 400 }
        );
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      await pool.query<ResultSetHeader>(
        `
        UPDATE customers
        SET fullName = ?,
            phone = ?,
            password = ?
        WHERE customerID = ?
        `,
        [fullName, phone, hashedNewPassword, id]
      );
    } else {
      await pool.query<ResultSetHeader>(
        `
        UPDATE customers
        SET fullName = ?,
            phone = ?
        WHERE customerID = ?
        `,
        [fullName, phone, id]
      );
    }

    return NextResponse.json({
      message: "Customer profile updated successfully",
    });
  } catch (error) {
    console.error("Update customer error:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM customers WHERE customerID = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}