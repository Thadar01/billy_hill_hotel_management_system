// app/api/rooms/route.ts
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

export async function GET() {
  try {
    const [rooms] = await pool.query<Room[]>(`SELECT * FROM rooms`);
    const [images] = await pool.query<RoomImage[]>(`SELECT * FROM room_images`);

    const formattedRooms = rooms.map(room => ({
      ...room,
      isPetAllowed: Boolean(room.isPetAllowed),
      images: images.filter(img => img.roomID === room.roomID).map(img => img.image_url),
    }));

    return NextResponse.json(formattedRooms);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Debug: Log headers
    console.log("Headers:", Object.fromEntries(req.headers.entries()));
    
    // Process with upload function directly - don't consume formData twice
    const { files: images, fields } = await uploadRoomImage(req);
    console.log("Processed fields:", fields);
    console.log("Processed images:", images);

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
    } = fields;

    // Validate required fields
    if (!roomNumber || !roomType || !description || !price || !floor || !roomSize || !bed || !person || !bathroom) {
      console.error("Missing fields:", { roomNumber, roomType, description, price, floor, roomSize, bed, person, bathroom });
      return NextResponse.json({ 
        error: "Missing required fields",
        received: fields 
      }, { status: 400 });
    }

    // Generate sequential roomID (RM001, RM002, etc.)
    const [rows] = await pool.query(`SELECT COUNT(*) as count FROM rooms`);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const count = rows[0].count;
    const nextNumber = (count + 1).toString().padStart(3, '0');
    const roomID = `RM${nextNumber}`;

    // Insert room with proper parsing and validation
    await pool.query(
      `INSERT INTO rooms (roomID, roomNumber, roomType, description, price, floor, roomSize, bed, person, bathroom, isPetAllowed, roomStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        roomID,
        roomNumber,
        roomType,
        description,
        parseFloat(price) || 0,
        parseInt(floor) || 1,
        parseInt(roomSize) || 1,
        parseInt(bed) || 1,
        parseInt(person) || 1,
        parseInt(bathroom) || 1,
        isPetAllowed === 'true' ? 1 : 0,
        'available' // Default status
      ]
    );

    // Insert images
    for (const img of images) {
      await pool.query(
        `INSERT INTO room_images (roomID, image_url) VALUES (?, ?)`,
        [roomID, img]
      );
    }

    return NextResponse.json({ 
      message: "Room created successfully",
      roomID: roomID
    });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ 
      error: "Failed to create room", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}