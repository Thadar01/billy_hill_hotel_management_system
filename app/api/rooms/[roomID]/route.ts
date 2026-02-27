/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { uploadRoomImage } from "@/lib/uploadRoomImage";
import { RowDataPacket } from "mysql2";

// Remove the config export - it's not needed in App Router

interface Room extends RowDataPacket {
  roomID: string;
  roomNumber: string;
  roomType: string;
  description: string;
  price: number;
  roomStatus: string;
  floor: number;
  roomSize: number;
  bed: number;
  person: number;
  bathroom: number;
  isPetAllowed: number;
}

interface RoomImage extends RowDataPacket {
  image_url: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomID: string }> }
) {
  try {
    // Await the params Promise
    const { roomID } = await params;
    
    const [rooms] = await pool.query<Room[]>(`SELECT * FROM rooms WHERE roomID=?`, [roomID]);
    if (rooms.length === 0) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const [images] = await pool.query<RoomImage[]>(`SELECT image_url FROM room_images WHERE roomID=?`, [roomID]);
    const room = rooms[0];

    return NextResponse.json({ 
      ...room, 
      isPetAllowed: Boolean(room.isPetAllowed), 
      images: images.map(img => img.image_url) 
    });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ roomID: string }> }
) {
  const connection = await pool.getConnection();
  try {
    const { roomID } = await params;
    
    const { files: newImages, fields } = await uploadRoomImage(req);

    const {
      roomNumber,
      roomType,
      description,
      price,
      floor,
      roomSize,
      bed,
      person,
      bathroom,
      isPetAllowed,
      existingImages, // This will come as a JSON string
    } = fields;

    // Parse existing images from JSON string
    let existingImagesArray: string[] = [];
    if (existingImages) {
      try {
        existingImagesArray = JSON.parse(existingImages as string);
      } catch (e) {
        console.error("Failed to parse existingImages:", e);
      }
    }

    // Combine existing images with new ones
    const allImages = [...existingImagesArray, ...newImages];

    await connection.beginTransaction();

    // Update room
    await connection.query(
      `UPDATE rooms
       SET roomNumber=?, roomType=?, description=?, price=?, floor=?, roomSize=?, bed=?, person=?, bathroom=?, isPetAllowed=?
       WHERE roomID=?`,
      [
        roomNumber,
        roomType,
        description,
        parseFloat(price as string),
        parseInt(floor as string),
        parseInt(roomSize as string),
        parseInt(bed as string),
        parseInt(person as string),
        parseInt(bathroom as string),
        isPetAllowed === "true" ? 1 : 0,
        roomID,
      ]
    );

    // Delete old images from database only (not from filesystem)
    await connection.query(`DELETE FROM room_images WHERE roomID=?`, [roomID]);

    // Insert all current images
    for (const img of allImages) {
      await connection.query(`INSERT INTO room_images (roomID, image_url) VALUES (?, ?)`, [
        roomID,
        img,
      ]);
    }

    await connection.commit();

    return NextResponse.json({ message: "Room updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("PUT Error:", error);
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  } finally {
    connection.release();
  }
}



export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomID: string }> }
) {
  try {
    // Await the params Promise
    const { roomID } = await params;
    
    await pool.query(`DELETE FROM rooms WHERE roomID=?`, [roomID]);
    await pool.query(`DELETE FROM room_images WHERE roomID=?`, [roomID]);
    
    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
}