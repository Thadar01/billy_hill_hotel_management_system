import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "serviceName";
    const sortOrder = searchParams.get("sortOrder") || "ASC";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let sql = `SELECT * FROM premiumservices WHERE 1=1`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];

    // Add search condition
    if (query) {
      sql += ` AND (serviceName LIKE ? OR description LIKE ?)`;
      const searchTerm = `%${query}%`;
      values.push(searchTerm, searchTerm);
    }

    // Add price range filter
    if (minPrice) {
      sql += ` AND price >= ?`;
      values.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      sql += ` AND price <= ?`;
      values.push(parseFloat(maxPrice));
    }

    // Get total count
    const [countResult] = await pool.query<RowDataPacket[]>(
      sql.replace("SELECT *", "SELECT COUNT(*) as total"),
      values
    );
    const total = countResult[0].total;

    // Add sorting
    const validSortColumns = ["serviceName", "price", "premiumServiceId"];
    const validSortOrders = ["ASC", "DESC"];
    
    const orderBy = validSortColumns.includes(sortBy) ? sortBy : "serviceName";
    const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder : "ASC";
    
    sql += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
    values.push(limit, offset);

    const [services] = await pool.query(sql, values);

    return NextResponse.json({
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Advanced Search Error:", error);
    return NextResponse.json(
      { error: "Failed to search premium services" },
      { status: 500 }
    );
  }
}