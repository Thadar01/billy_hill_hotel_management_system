import { PoolConnection, RowDataPacket } from "mysql2/promise";

export interface CustomerRow extends RowDataPacket {
  customerID: string;
  points: number;
}

export interface RoomRow extends RowDataPacket {
  roomID: string;
  price: number;
}

export interface PremiumServiceRow extends RowDataPacket {
  premiumServiceId: number;
  price: number;
}

export interface ActiveDiscountRow extends RowDataPacket {
  roomID: string;
  discountID: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
}

export function generateBookingID() {
  return `BK-${Date.now()}`;
}

export function calculateNights(checkInDate: string, checkOutDate: string) {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calculateDiscountAmount(
  price: number,
  discount: ActiveDiscountRow | null
) {
  if (!discount) return 0;

  let discountAmount = 0;

  if (discount.discountType === "percentage") {
    discountAmount = (price * Number(discount.discountValue)) / 100;
  } else {
    discountAmount = Number(discount.discountValue);
  }

  if (discountAmount > price) return price;
  return Number(discountAmount.toFixed(2));
}

export function calculateServiceLineTotal(
  pricingType: "unit" | "person" | "unit_person",
  unitPrice: number,
  quantity: number,
  personCount?: number | null
) {
  if (pricingType === "unit") {
    return Number((unitPrice * quantity).toFixed(2));
  }

  if (pricingType === "person") {
    return Number((unitPrice * (personCount || 1)).toFixed(2));
  }

  return Number((unitPrice * quantity * (personCount || 1)).toFixed(2));
}

export async function getActiveRoomDiscounts(
  connection: PoolConnection,
  roomIDs: string[],
  checkInDate: string,
  checkOutDate: string
) {
  if (roomIDs.length === 0) return [];

  const [rows] = await connection.query<ActiveDiscountRow[]>(
    `
    SELECT
      dr.roomID,
      d.discountID,
      d.discountType,
      d.discountValue
    FROM discount_rooms dr
    INNER JOIN discounts d ON dr.discountID = d.discountID
    WHERE dr.roomID IN (?)
      AND d.isActive = 1
      AND ? < d.endDate
      AND ? > d.startDate
    ORDER BY d.discountID DESC
    `,
    [roomIDs, checkInDate, checkOutDate]
  );

  const uniqueByRoom = new Map<string, ActiveDiscountRow>();
  for (const row of rows) {
    if (!uniqueByRoom.has(row.roomID)) {
      uniqueByRoom.set(row.roomID, row);
    }
  }

  return Array.from(uniqueByRoom.values());
}

export async function ensureRoomsAvailable(
  connection: PoolConnection,
  roomIDs: string[],
  checkInDate: string,
  checkOutDate: string
) {
  if (roomIDs.length === 0) return;

  const [conflicts] = await connection.query<RowDataPacket[]>(
    `
    SELECT br.roomID
    FROM booking_rooms br
    INNER JOIN bookings b ON br.bookingID = b.bookingID
    WHERE br.roomID IN (?)
      AND b.bookingStatus IN ('pending', 'confirmed', 'checked_in')
      AND NOT (
        ? <= b.checkInDate
        OR ? >= b.checkOutDate
      )
    `,
    [roomIDs, checkOutDate, checkInDate]
  );

  if (conflicts.length > 0) {
    const usedRoomIDs = [...new Set(conflicts.map((r) => r.roomID))];
    throw new Error(
      `These rooms are not available: ${usedRoomIDs.join(", ")}`
    );
  }
}

export async function recalculateBookingAmounts(
  connection: PoolConnection,
  bookingID: string
) {
  const [bookingRows] = await connection.query<RowDataPacket[]>(
    `
    SELECT totalAmount
    FROM bookings
    WHERE bookingID = ?
    `,
    [bookingID]
  );

  if (bookingRows.length === 0) {
    throw new Error("Booking not found");
  }

  const totalAmount = Number(bookingRows[0].totalAmount || 0);

  const [paymentRows] = await connection.query<RowDataPacket[]>(
    `
    SELECT COALESCE(SUM(amount), 0) AS paidAmount
    FROM payments
    WHERE bookingID = ?
      AND paymentStatus = 'paid'
    `,
    [bookingID]
  );

  const [refundRows] = await connection.query<RowDataPacket[]>(
    `
    SELECT COALESCE(SUM(refundAmount), 0) AS refundedAmount
    FROM refunds
    WHERE bookingID = ?
      AND refundStatus = 'accepted'
    `,
    [bookingID]
  );

  const paidAmount = Number(paymentRows[0].paidAmount || 0);
  const refundedAmount = Number(refundRows[0].refundedAmount || 0);
  const netPaid = paidAmount - refundedAmount;
  const balanceAmount = Number((totalAmount - netPaid).toFixed(2));

  let paymentStatus:
    | "unpaid"
    | "partially_paid"
    | "paid"
    | "refunded" = "unpaid";

  if (refundedAmount > 0) {
    if (netPaid <= 0) {
      paymentStatus = "refunded";
    } else {
      paymentStatus = "refunded";
    }
  } else if (netPaid <= 0) {
    paymentStatus = "unpaid";
  } else if (netPaid < totalAmount) {
    paymentStatus = "partially_paid";
  } else {
    paymentStatus = "paid";
  }

  await connection.query(
    `
    UPDATE bookings
    SET paidAmount = ?,
        refundedAmount = ?,
        balanceAmount = ?,
        paymentStatus = ?
    WHERE bookingID = ?
    `,
    [paidAmount, refundedAmount, balanceAmount, paymentStatus, bookingID]
  );
}