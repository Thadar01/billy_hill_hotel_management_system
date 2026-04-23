import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");

    // 1. Service Popularity & Revenue
    const [serviceSummary] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        ps.premiumServiceId,
        ps.serviceName,
        COUNT(bs.bookingServiceID) as totalOrders,
        SUM(bs.lineTotal) as totalRevenue,
        AVG(bs.lineTotal) as avgOrderValue
      FROM premiumservices ps
      LEFT JOIN booking_services bs ON ps.premiumServiceId = bs.premiumServiceId
      LEFT JOIN bookings b ON bs.bookingID = b.bookingID
      WHERE (b.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY) OR b.createdAt IS NULL)
        AND (b.bookingStatus NOT IN ('cancelled') OR b.bookingStatus IS NULL)
      GROUP BY ps.premiumServiceId, ps.serviceName
      ORDER BY totalRevenue DESC
      `,
      [days]
    );

    // 2. Daily Service Consumption Trend
    const [dailyTrend] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        DATE(bs.serviceDate) as date,
        COUNT(*) as orderCount,
        SUM(bs.lineTotal) as dailyRevenue
      FROM booking_services bs
      INNER JOIN bookings b ON bs.bookingID = b.bookingID
      WHERE b.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND b.bookingStatus NOT IN ('cancelled')
      GROUP BY DATE(bs.serviceDate)
      ORDER BY DATE(bs.serviceDate) ASC
      `,
      [days]
    );

    // 3. Overall Service Statistics
    const totalServiceRevenue = serviceSummary.reduce((acc, curr) => acc + Number(curr.totalRevenue || 0), 0);
    const totalServiceOrders = serviceSummary.reduce((acc, curr) => acc + Number(curr.totalOrders || 0), 0);

    return NextResponse.json({
      summary: serviceSummary.map(s => ({
        ...s,
        totalRevenue: Number(s.totalRevenue || 0),
        totalOrders: Number(s.totalOrders || 0),
        avgOrderValue: Number(s.avgOrderValue || 0)
      })),
      trends: dailyTrend.map(t => ({
        date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : t.date,
        count: Number(t.orderCount || 0),
        revenue: Number(t.dailyRevenue || 0)
      })),
      totalServiceRevenue,
      totalServiceOrders
    });
  } catch (error) {
    console.error("Service Performance API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch service performance data" },
      { status: 500 }
    );
  }
}
