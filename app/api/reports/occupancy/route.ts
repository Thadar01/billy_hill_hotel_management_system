import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");

    // 1. Get total rooms
    const [totalRoomsRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM rooms"
    );
    const totalRooms = totalRoomsRows[0].count;

    if (totalRooms === 0) {
      return NextResponse.json({
        totalRooms: 0,
        averageOccupancy: 0,
        dailyStats: [],
        peakPeriods: [],
      });
    }

    // 2. Get bookings in the range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const [bookings] = await pool.query<RowDataPacket[]>(
      `
      SELECT b.checkInDate, b.checkOutDate, br.roomID
      FROM bookings b
      JOIN booking_rooms br ON b.bookingID = br.bookingID
      WHERE b.bookingStatus IN ('confirmed', 'checked_in', 'checked_out')
        AND b.checkInDate <= ? AND b.checkOutDate >= ?
      `,
      [endDate.toISOString().split("T")[0], startDate.toISOString().split("T")[0]]
    );

    // 3. Calculate daily stats
    const dailyStats = [];
    const occupancyMap: Record<string, number> = {};

    for (let i = 0; i < days; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const dateStr = current.toISOString().split("T")[0];
      
      let count = 0;
      bookings.forEach((b) => {
        const start = new Date(b.checkInDate).toISOString().split("T")[0];
        const end = new Date(b.checkOutDate).toISOString().split("T")[0];
        if (dateStr >= start && dateStr < end) {
          count++;
        }
      });

      const rate = (count / totalRooms) * 100;
      occupancyMap[dateStr] = rate;
      dailyStats.push({
        date: dateStr,
        bookedRooms: count,
        occupancyRate: parseFloat(rate.toFixed(1)),
      });
    }

    // 4. Calculate average occupancy
    const averageOccupancy = dailyStats.reduce((acc, curr) => acc + curr.occupancyRate, 0) / days;

    // 5. Find peak periods (Top 5 dates)
    const peakPeriods = [...dailyStats]
      .sort((a, b) => b.occupancyRate - a.occupancyRate)
      .slice(0, 5);

    return NextResponse.json({
      totalRooms,
      averageOccupancy: parseFloat(averageOccupancy.toFixed(1)),
      dailyStats,
      peakPeriods,
    });
  } catch (error) {
    console.error("Report API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
