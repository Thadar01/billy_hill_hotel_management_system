import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import {
  calculateDiscountAmount,
  calculateNights,
  calculateServiceLineTotal,
  ensureRoomsAvailable,
  generateBookingID,
  getActiveRoomDiscounts,
  recalculateBookingAmounts,
  CustomerRow,
  PremiumServiceRow,
  RoomRow,
} from "@/lib/bookingHelpers";

type BookingRoomInput = {
  roomID: string;
  adults?: number;
  children?: number;
};

type BookingServiceInput = {
  premiumServiceId: number;
  pricingType?: "unit" | "person" | "unit_person";
  quantity?: number;
  personCount?: number | null;
  serviceDate?: string | null;
  note?: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerID = searchParams.get("customerID");

    let query = `
      SELECT
        b.*,
        c.fullName,
        c.email,
        c.phone
      FROM bookings b
      INNER JOIN customers c ON b.customerID = c.customerID
    `;

    const params: string[] = [];

    if (customerID) {
      query += ` WHERE b.customerID = ?`;
      params.push(customerID);
    }

    query += ` ORDER BY b.createdAt DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({ bookings: rows });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const body = await req.json();

    const {
      customerID,
      checkInDate,
      checkOutDate,
      checkInTime,
      checkOutTime,
      specialRequest,
      note,
      pointsToUse = 0,
      taxAmount = 0,
      rooms = [],
      services = [],
      payment = null,
    }: {
      customerID: string;
      checkInDate: string;
      checkOutDate: string;
      checkInTime?: string | null;
      checkOutTime?: string | null;
      specialRequest?: string;
      note?: string;
      pointsToUse?: number;
      taxAmount?: number;
      rooms: BookingRoomInput[];
      services: BookingServiceInput[];
      payment?: {
        amount: number;
        paymentMethod: "cash" | "kbzpay" | "wavepay" | "bank_transfer" | "card";
        paymentType?: "deposit" | "partial" | "full" | "balance";
        paymentStatus?: "pending" | "paid" | "failed" | "cancelled";
        transactionRef?: string | null;
        note?: string | null;
      } | null;
    } = body;

    if (
      !customerID ||
      !checkInDate ||
      !checkOutDate ||
      !Array.isArray(rooms) ||
      rooms.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "customerID, checkInDate, checkOutDate and rooms are required",
        },
        { status: 400 }
      );
    }

    const nights = calculateNights(checkInDate, checkOutDate);

    if (nights <= 0) {
      return NextResponse.json(
        { error: "checkOutDate must be later than checkInDate" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const [customerRows] = await connection.query<CustomerRow[]>(
      `
      SELECT customerID, points
      FROM customers
      WHERE customerID = ?
      `,
      [customerID]
    );

    if (customerRows.length === 0) {
      throw new Error("Customer not found");
    }

    const customer = customerRows[0];

    if (Number(pointsToUse) < 0) {
      throw new Error("Invalid pointsToUse");
    }

    if (Number(pointsToUse) > Number(customer.points)) {
      throw new Error("Customer does not have enough points");
    }

    const roomIDs = rooms.map((r) => r.roomID);

    await ensureRoomsAvailable(connection, roomIDs, checkInDate, checkOutDate);

    const [roomRows] = await connection.query<RoomRow[]>(
      `
      SELECT roomID, price
      FROM rooms
      WHERE roomID IN (?)
      `,
      [roomIDs]
    );

    if (roomRows.length !== roomIDs.length) {
      throw new Error("Some selected rooms were not found");
    }

    const activeDiscounts = await getActiveRoomDiscounts(
      connection,
      roomIDs,
      checkInDate,
      checkOutDate
    );

    const discountMap = new Map(activeDiscounts.map((d) => [d.roomID, d]));
    const roomMap = new Map(roomRows.map((r) => [r.roomID, r]));

    let roomSubtotal = 0;
    let totalDiscountAmount = 0;

    const roomLines = rooms.map((room) => {
      const roomData = roomMap.get(room.roomID);

      if (!roomData) {
        throw new Error(`Room not found: ${room.roomID}`);
      }

      const baseLine = Number(roomData.price) * nights;
      const discount = discountMap.get(room.roomID) || null;
      const discountAmount = calculateDiscountAmount(baseLine, discount);
      const lineTotal = Number((baseLine - discountAmount).toFixed(2));

      roomSubtotal += lineTotal;
      totalDiscountAmount += discountAmount;

      return {
        roomID: room.roomID,
        adults: room.adults ?? 1,
        children: room.children ?? 0,
        nights,
        pricePerNight: Number(roomData.price),
        discountID: discount?.discountID ?? null,
        discountAmount,
        lineTotal,
      };
    });

    let serviceSubtotal = 0;

    let serviceLines: Array<{
      premiumServiceId: number;
      pricingType: "unit" | "person" | "unit_person";
      quantity: number;
      personCount: number | null;
      unitPrice: number;
      lineTotal: number;
      serviceDate: string | null;
      note: string | null;
    }> = [];

    if (Array.isArray(services) && services.length > 0) {
      const serviceIDs = services.map((s) => s.premiumServiceId);

      const [serviceRows] = await connection.query<PremiumServiceRow[]>(
        `
        SELECT premiumServiceId, price
        FROM premiumservices
        WHERE premiumServiceId IN (?)
        `,
        [serviceIDs]
      );

      if (serviceRows.length !== serviceIDs.length) {
        throw new Error("Some selected premium services were not found");
      }

      const serviceMap = new Map(
        serviceRows.map((s) => [s.premiumServiceId, s])
      );

      serviceLines = services.map((service) => {
        const serviceData = serviceMap.get(service.premiumServiceId);

        if (!serviceData) {
          throw new Error(
            `Premium service not found: ${service.premiumServiceId}`
          );
        }

        const pricingType = service.pricingType ?? "unit";
        const quantity = service.quantity ?? 1;
        const personCount = service.personCount ?? null;
        const unitPrice = Number(serviceData.price);

        const lineTotal = calculateServiceLineTotal(
          pricingType,
          unitPrice,
          quantity,
          personCount
        );

        serviceSubtotal += lineTotal;

        return {
          premiumServiceId: service.premiumServiceId,
          pricingType,
          quantity,
          personCount,
          unitPrice,
          lineTotal,
          serviceDate: service.serviceDate ?? null,
          note: service.note ?? null,
        };
      });
    }

    const pointsDiscountAmount = Number(pointsToUse || 0);

    // FIXED: do not subtract totalDiscountAmount again
    const totalAmount = Number(
      (
        roomSubtotal +
        serviceSubtotal -
        pointsDiscountAmount +
        Number(taxAmount || 0)
      ).toFixed(2)
    );

    if (totalAmount < 0) {
      throw new Error("Total amount cannot be negative");
    }

    const bookingID = generateBookingID();

    await connection.query<ResultSetHeader>(
      `
      INSERT INTO bookings (
        bookingID,
        customerID,
        checkInDate,
        checkOutDate,
        checkInTime,
        checkOutTime,
        bookingStatus,
        paymentStatus,
        roomSubtotal,
        serviceSubtotal,
        discountAmount,
        pointsUsed,
        pointsDiscountAmount,
        taxAmount,
        totalAmount,
        paidAmount,
        refundedAmount,
        balanceAmount,
        specialRequest,
        note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        bookingID,
        customerID,
        checkInDate,
        checkOutDate,
        checkInTime || null,
        checkOutTime || null,
        "confirmed",
        "unpaid",
        roomSubtotal,
        serviceSubtotal,
        totalDiscountAmount,
        pointsToUse,
        pointsDiscountAmount,
        Number(taxAmount || 0),
        totalAmount,
        0,
        0,
        totalAmount,
        specialRequest || null,
        note || null,
      ]
    );

    for (const roomLine of roomLines) {
      await connection.query(
        `
        INSERT INTO booking_rooms (
          bookingID,
          roomID,
          adults,
          children,
          nights,
          pricePerNight,
          discountID,
          discountAmount,
          lineTotal
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          bookingID,
          roomLine.roomID,
          roomLine.adults,
          roomLine.children,
          roomLine.nights,
          roomLine.pricePerNight,
          roomLine.discountID,
          roomLine.discountAmount,
          roomLine.lineTotal,
        ]
      );
    }

    for (const serviceLine of serviceLines) {
      await connection.query(
        `
        INSERT INTO booking_services (
          bookingID,
          premiumServiceId,
          pricingType,
          quantity,
          personCount,
          unitPrice,
          lineTotal,
          serviceDate,
          note
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          bookingID,
          serviceLine.premiumServiceId,
          serviceLine.pricingType,
          serviceLine.quantity,
          serviceLine.personCount,
          serviceLine.unitPrice,
          serviceLine.lineTotal,
          serviceLine.serviceDate,
          serviceLine.note,
        ]
      );
    }

    if (Number(pointsToUse) > 0) {
      await connection.query(
        `
        INSERT INTO point_transactions (
          customerID,
          bookingID,
          type,
          points,
          description
        )
        VALUES (?, ?, 'redeem', ?, ?)
        `,
        [
          customerID,
          bookingID,
          Number(pointsToUse),
          `Redeemed points for booking ${bookingID}`,
        ]
      );

      await connection.query(
        `
        UPDATE customers
        SET points = points - ?
        WHERE customerID = ?
        `,
        [Number(pointsToUse), customerID]
      );
    }

    if (payment && Number(payment.amount) > 0) {
      await connection.query(
        `
        INSERT INTO payments (
          bookingID,
          amount,
          paymentMethod,
          paymentType,
          paymentStatus,
          transactionRef,
          note,
          paidAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          bookingID,
          Number(payment.amount),
          payment.paymentMethod,
          payment.paymentType || "partial",
          payment.paymentStatus || "paid",
          payment.transactionRef || null,
          payment.note || null,
          payment.paymentStatus === "paid" || !payment.paymentStatus
            ? new Date()
            : null,
        ]
      );
    }

    await recalculateBookingAmounts(connection, bookingID);

    await connection.commit();

    return NextResponse.json(
      {
        message: "Booking created successfully",
        bookingID,
      },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();
    console.error("Create booking error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create booking",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}