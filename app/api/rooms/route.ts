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
  isBalcony: number;
}

interface RoomImage extends RowDataPacket {
  roomID: string;
  image_url: string;
}

interface RoomDiscountRow extends RowDataPacket {
  roomID: string;
  discountID: number;
  discountName: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  description: string | null;
  isActive: number;
  createdAt: string;
}

function calculateFinalPrice(
  originalPrice: number,
  discount: RoomDiscountRow | null
): number {
  if (!discount) return originalPrice;

  let finalPrice = originalPrice;

  if (discount.discountType === "percentage") {
    finalPrice =
      originalPrice - (originalPrice * Number(discount.discountValue)) / 100;
  } else if (discount.discountType === "fixed") {
    finalPrice = originalPrice - Number(discount.discountValue);
  }

  if (finalPrice < 0) return 0;

  return Number(finalPrice.toFixed(2));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkIn = searchParams.get("checkIn") || new Date().toISOString().split("T")[0];
    const checkOut = searchParams.get("checkOut") || new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const isAdmin = searchParams.get("admin") === "true";

    const today = new Date().toISOString().split("T")[0];

    let queryStr = "";
    let queryParams: any[] = [];

    if (isAdmin) {
      queryStr = `SELECT * FROM rooms r ORDER BY r.floor ASC, CAST(r.roomNumber AS UNSIGNED) ASC`;
      queryParams = [];
    } else {
      queryStr = `
        SELECT * FROM rooms r
        WHERE r.roomStatus NOT IN ('maintenance')
          AND (? > ? OR r.roomStatus = 'available')
          AND r.roomID NOT IN (
            SELECT br.roomID
            FROM booking_rooms br
            INNER JOIN bookings b ON br.bookingID = b.bookingID
            WHERE b.bookingStatus IN ('pending', 'confirmed', 'checked_in')
              AND (b.checkInDate < ? AND b.checkOutDate > ?)
          )
        ORDER BY r.floor ASC, CAST(r.roomNumber AS UNSIGNED) ASC
      `;
      queryParams = [checkIn, today, checkOut, checkIn];
    }

    const [rooms] = await pool.query<Room[]>(queryStr, queryParams);

    const [images] = await pool.query<RoomImage[]>(
      `SELECT roomID, image_url FROM room_images`
    );

    const [activeDiscounts] = await pool.query<RoomDiscountRow[]>(
      `
      SELECT
        dr.roomID,
        d.discountID,
        d.discountName,
        d.discountType,
        d.discountValue,
        d.startDate,
        d.endDate,
        d.description,
        d.isActive,
        d.createdAt
      FROM discount_rooms dr
      INNER JOIN discounts d ON dr.discountID = d.discountID
      WHERE d.isActive = 1
        AND NOW() BETWEEN d.startDate AND d.endDate
      ORDER BY d.discountID DESC
      `
    );

    const formattedRooms = rooms.map((room) => {
      const roomImages = images
        .filter((img) => img.roomID === room.roomID)
        .map((img) => img.image_url);

      const activeDiscount =
        activeDiscounts.find((discount) => discount.roomID === room.roomID) ||
        null;

      return {
        ...room,
        isPetAllowed: Boolean(room.isPetAllowed),
        isBalcony: Boolean(room.isBalcony),
        images: roomImages,
        activeDiscount: activeDiscount
          ? {
              discountID: activeDiscount.discountID,
              discountName: activeDiscount.discountName,
              discountType: activeDiscount.discountType,
              discountValue: activeDiscount.discountValue,
              startDate: activeDiscount.startDate,
              endDate: activeDiscount.endDate,
              description: activeDiscount.description,
              isActive: Boolean(activeDiscount.isActive),
              createdAt: activeDiscount.createdAt,
            }
          : null,
        finalPrice: calculateFinalPrice(Number(room.price), activeDiscount),
      };
    });

    return NextResponse.json(formattedRooms);
  } catch (error) {
    console.error("Failed to fetch rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
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
      isBalcony
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
      `INSERT INTO rooms (roomID, roomNumber, roomType, description, price, floor, roomSize, bed, person, bathroom, isPetAllowed,isBalcony, roomStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
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
        isBalcony === 'true' ? 1 : 0,
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
  } catch (error: any) {
    console.error("POST Error:", error);
    
    // Handle duplicate room number error
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ 
        error: "Room number already exists. Please use a unique room number." 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: "Failed to create room", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}