import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface PremiumService extends RowDataPacket {
  premiumServiceId: number;
  serviceName: string;
  description: string;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// GET all premium services
export async function GET(req: NextRequest) {
  try {
    const [services] = await pool.query<PremiumService[]>(
      `SELECT * FROM premiumservices ORDER BY premiumServiceId DESC`
    );
    return NextResponse.json(services);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch premium services" },
      { status: 500 }
    );
  }
}

// POST create new premium service
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serviceName, description, price } = body;

    // Validate required fields
    if (!serviceName || !price) {
      return NextResponse.json(
        { error: "Service name and price are required" },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO premiumservices (serviceName, description, price) VALUES (?, ?, ?)`,
      [serviceName, description, price]
    );

    const [newService] = await pool.query<PremiumService[]>(
      `SELECT * FROM premiumservices WHERE premiumServiceId = ?`,
      [result.insertId]
    );

    return NextResponse.json(newService[0], { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { error: "Failed to create premium service" },
      { status: 500 }
    );
  }
}