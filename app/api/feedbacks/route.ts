import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerID = searchParams.get("customerID");
    const bookingID = searchParams.get("bookingID");

    let query = `
      SELECT
        f.*,
        c.fullName AS customerName,
        r.roomNumber,
        r.roomType
      FROM feedbacks f
      LEFT JOIN customers c ON f.customerID = c.customerID
      LEFT JOIN bookings b ON f.bookingID = b.bookingID
      LEFT JOIN booking_rooms br ON br.bookingID = b.bookingID
      LEFT JOIN rooms r ON r.roomID = br.roomID
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (customerID) {
      conditions.push("f.customerID = ?");
      params.push(customerID);
    }

    if (bookingID) {
      conditions.push("f.bookingID = ?");
      params.push(bookingID);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY f.createdAt DESC";

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return NextResponse.json({ feedbacks: rows });
  } catch (error) {
    console.error("Fetch feedbacks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedbacks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const body = await req.json();
    const feedbacks = Array.isArray(body) ? body : [body];

    if (feedbacks.length === 0) {
      return NextResponse.json(
        { error: "No feedback data provided" },
        { status: 400 }
      );
    }

    // Basic validation for all items
    for (const f of feedbacks) {
      if (!f.rating || !f.category) {
        return NextResponse.json(
          { error: "Rating and category are required for all items" },
          { status: 400 }
        );
      }
      if (f.rating < 1 || f.rating > 5) {
        return NextResponse.json(
          { error: "Rating must be between 1 and 5" },
          { status: 400 }
        );
      }
    }

    await connection.beginTransaction();

    const resultIds: number[] = [];
    for (const f of feedbacks) {
      // Check if feedback already exists for this booking + category
      const [existing] = await connection.query<RowDataPacket[]>(
        `SELECT feedbackId FROM feedbacks WHERE customerID = ? AND bookingID = ? AND category = ?`,
        [f.customerID || null, f.bookingID || null, f.category]
      );

      if (existing.length > 0) {
        // Update existing feedback
        await connection.query<ResultSetHeader>(
          `UPDATE feedbacks SET rating = ?, comment = ? WHERE feedbackId = ?`,
          [f.rating, f.comment || null, existing[0].feedbackId]
        );
        resultIds.push(existing[0].feedbackId);
      } else {
        // Insert new feedback
        const [result] = await connection.query<ResultSetHeader>(
          `INSERT INTO feedbacks (customerID, bookingID, rating, category, comment)
           VALUES (?, ?, ?, ?, ?)`,
          [f.customerID || null, f.bookingID || null, f.rating, f.category, f.comment || null]
        );
        resultIds.push(result.insertId);
      }
    }

    await connection.commit();

    return NextResponse.json(
      {
        message: "Feedback submitted successfully",
        feedbackIds: resultIds,
      },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();
    console.error("Create feedback error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
