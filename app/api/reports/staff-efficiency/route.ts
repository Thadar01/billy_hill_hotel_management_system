import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");

    // 1. Workforce Costs (Payrolls)
    const [payrollRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        SUM(gross_pay) as totalPayroll,
        COUNT(DISTINCT staff_id) as totalStaff
      FROM payrolls
      WHERE period_start >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `,
      [days]
    );

    // 2. Operational Activity (Bookings)
    const [bookingRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        COUNT(*) as totalBookings,
        SUM(totalAmount) as totalRevenue
      FROM bookings
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND bookingStatus NOT IN ('cancelled')
      `,
      [days]
    );

    // 3. Efficiency Stats
    const stats = {
      totalPayroll: Number(payrollRows[0].totalPayroll || 0),
      totalStaff: Number(payrollRows[0].totalStaff || 0),
      totalBookings: Number(bookingRows[0].totalBookings || 0),
      totalRevenue: Number(bookingRows[0].totalRevenue || 0),
    };

    const costPerBooking = stats.totalBookings > 0 ? stats.totalPayroll / stats.totalBookings : 0;
    const revenueToStaffRatio = stats.totalStaff > 0 ? stats.totalRevenue / stats.totalStaff : 0;

    // 4. Daily Workforce Cost Trend
    const [dailyRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        DATE(period_start) as date,
        SUM(gross_pay) as cost
      FROM payrolls
      WHERE period_start >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(period_start)
      ORDER BY DATE(period_start) ASC
      `,
      [days]
    );

    return NextResponse.json({
      ...stats,
      costPerBooking,
      revenueToStaffRatio,
      dailyStats: dailyRows.map(r => ({
        date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
        cost: Number(r.cost || 0)
      }))
    });
  } catch (error) {
    console.error("Staff Efficiency API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff efficiency data" },
      { status: 500 }
    );
  }
}
