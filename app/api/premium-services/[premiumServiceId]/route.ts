import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface PremiumService extends RowDataPacket {
  premiumServiceId: number;
  serviceName: string;
  description: string;
  price: number;
}

// GET single premium service
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ premiumServiceId: string }> }
) {
  try {
    const { premiumServiceId } = await params;

    const [services] = await pool.query<PremiumService[]>(
      `SELECT * FROM premiumservices WHERE premiumServiceId = ?`,
      [premiumServiceId]
    );

    if (services.length === 0) {
      return NextResponse.json(
        { error: "Premium service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(services[0]);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch premium service" },
      { status: 500 }
    );
  }
}

// PUT update premium service
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ premiumServiceId: string }> }
) {
  try {
    const { premiumServiceId } = await params;
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
      `UPDATE premiumservices 
       SET serviceName = ?, description = ?, price = ? 
       WHERE premiumServiceId = ?`,
      [serviceName, description, price, premiumServiceId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Premium service not found" },
        { status: 404 }
      );
    }

    const [updatedService] = await pool.query<PremiumService[]>(
      `SELECT * FROM premiumservices WHERE premiumServiceId = ?`,
      [premiumServiceId]
    );

    return NextResponse.json(updatedService[0]);
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      { error: "Failed to update premium service" },
      { status: 500 }
    );
  }
}

// DELETE premium service
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ premiumServiceId: string }> }
) {
  try {
    const { premiumServiceId } = await params;

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM premiumservices WHERE premiumServiceId = ?`,
      [premiumServiceId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Premium service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Premium service deleted successfully" }
    );
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { error: "Failed to delete premium service" },
      { status: 500 }
    );
  }
}