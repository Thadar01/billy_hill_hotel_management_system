import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface PremiumService extends RowDataPacket {
  premiumServiceId: number;
  serviceName: string;
  description: string;
  price: number;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Search in serviceName and description
    const searchTerm = `%${query}%`;
    
    // Get total count for pagination
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM premiumservices 
       WHERE serviceName LIKE ? OR description LIKE ?`,
      [searchTerm, searchTerm]
    );
    const total = countResult[0].total;

    // Get paginated results
    const [services] = await pool.query<PremiumService[]>(
      `SELECT * FROM premiumservices 
       WHERE serviceName LIKE ? OR description LIKE ? 
       ORDER BY 
         CASE 
           WHEN serviceName LIKE ? THEN 1
           WHEN description LIKE ? THEN 2
           ELSE 3
         END,
         serviceName ASC
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm, limit, offset]
    );

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
    console.error("Search Error:", error);
    return NextResponse.json(
      { error: "Failed to search premium services" },
      { status: 500 }
    );
  }
}