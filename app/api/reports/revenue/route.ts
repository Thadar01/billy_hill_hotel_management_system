import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");

    const [revRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        SUM(roomSubtotal) as roomRevenue,
        SUM(serviceSubtotal) as serviceRevenue,
        SUM(taxAmount) as totalTax,
        SUM(totalAmount) as totalRevenue,
        SUM(paidAmount) as actualCashflow
      FROM bookings
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND bookingStatus NOT IN ('cancelled')
      `,
      [days]
    );

    const [refundRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT SUM(refundAmount) as totalRefunds
      FROM refunds
      WHERE refundStatus = 'accepted'
        AND createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `,
      [days]
    );

    const stats = revRows[0] as any;
    const totalRefunds = Number(refundRows[0].totalRefunds || 0);

    // Get daily revenue for trend chart
    const [dailyRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        DATE(createdAt) as date,
        SUM(totalAmount) as dailyTotal
      FROM bookings
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND bookingStatus NOT IN ('cancelled')
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt) ASC
      `,
      [days]
    );

    return NextResponse.json({
      roomRevenue: Number(stats.roomRevenue || 0),
      serviceRevenue: Number(stats.serviceRevenue || 0),
      totalTax: Number(stats.totalTax || 0),
      totalRefunds: totalRefunds,
      totalRevenue: Number(stats.totalRevenue || 0),
      actualCashflow: Number(stats.actualCashflow || 0),
      netProfit: Number((stats.totalRevenue || 0) - totalRefunds),
      dailyStats: dailyRows.map(r => ({
        date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
        revenue: Number(r.dailyTotal || 0)
      }))
    });
  } catch (error) {
    console.error("Revenue API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}
