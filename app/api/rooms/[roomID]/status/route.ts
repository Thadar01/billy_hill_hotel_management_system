// app/api/rooms/[roomID]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomID: string }> }
) {
  try {
    const { roomID } = await params;
    const { status } = await req.json();

    // Validate status
    const validStatuses = ['available', 'occupied', 'maintenance', 'cleaning'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status. Must be one of: " + validStatuses.join(', ') 
      }, { status: 400 });
    }

    // Update only the status
    const [result] = await pool.query(
      `UPDATE rooms SET roomStatus = ? WHERE roomID = ?`,
      [status, roomID]
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Status updated successfully",
      roomID,
      status 
    });
  } catch (error) {
    console.error("Status Update Error:", error);
    return NextResponse.json({ 
      error: "Failed to update status",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}