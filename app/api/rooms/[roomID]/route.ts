/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { uploadRoomImage } from "@/lib/uploadRoomImage";
import { ResultSetHeader, RowDataPacket } from "mysql2";

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
  image_url: string;
}

interface DiscountRow extends RowDataPacket {
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
  discount: DiscountRow | null
): number {
  if (!discount) return originalPrice;

  let finalPrice = originalPrice;

  if (discount.discountType === "percentage") {
    finalPrice = originalPrice - (originalPrice * Number(discount.discountValue)) / 100;
  } else if (discount.discountType === "fixed") {
    finalPrice = originalPrice - Number(discount.discountValue);
  }

  if (finalPrice < 0) return 0;

  return Number(finalPrice.toFixed(2));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomID: string }> }
) {
  try {
    const { roomID } = await params;

    const [rooms] = await pool.query<Room[]>(
      `SELECT * FROM rooms WHERE roomID = ?`,
      [roomID]
    );

    if (rooms.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const [images] = await pool.query<RoomImage[]>(
      `SELECT image_url FROM room_images WHERE roomID = ?`,
      [roomID]
    );

    const [discounts] = await pool.query<DiscountRow[]>(
      `
      SELECT d.*
      FROM discounts d
      INNER JOIN discount_rooms dr ON d.discountID = dr.discountID
      WHERE dr.roomID = ?
        AND d.isActive = 1
        AND NOW() BETWEEN d.startDate AND d.endDate
      ORDER BY d.discountID DESC
      LIMIT 1
      `,
      [roomID]
    );

    const room = rooms[0];
    const activeDiscount = discounts.length > 0 ? discounts[0] : null;
    const finalPrice = calculateFinalPrice(Number(room.price), activeDiscount);

    return NextResponse.json({
      ...room,
      isPetAllowed: Boolean(room.isPetAllowed),
      isBalcony: Boolean(room.isBalcony),
      images: images.map((img) => img.image_url),
      activeDiscount: activeDiscount
        ? {
            ...activeDiscount,
            isActive: Boolean(activeDiscount.isActive),
          }
        : null,
      finalPrice,
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
      isBalcony,
      existingImages,
    } = fields;

    let existingImagesArray: string[] = [];
    if (existingImages) {
      try {
        existingImagesArray = JSON.parse(existingImages as string);
      } catch (e) {
        console.error("Failed to parse existingImages:", e);
      }
    }

    const allImages = [...existingImagesArray, ...newImages];

    await connection.beginTransaction();

    await connection.query(
      `UPDATE rooms
       SET roomNumber = ?, roomType = ?, description = ?, price = ?, floor = ?, roomSize = ?, bed = ?, person = ?, bathroom = ?, isPetAllowed = ?, isBalcony = ?
       WHERE roomID = ?`,
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
        isBalcony === "true" ? 1 : 0,
        roomID,
      ]
    );

    await connection.query(`DELETE FROM room_images WHERE roomID = ?`, [roomID]);

    for (const img of allImages) {
      await connection.query(
        `INSERT INTO room_images (roomID, image_url) VALUES (?, ?)`,
        [roomID, img]
      );
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
    const { roomID } = await params;

    await pool.query(`DELETE FROM rooms WHERE roomID = ?`, [roomID]);
    await pool.query(`DELETE FROM room_images WHERE roomID = ?`, [roomID]);

    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
}