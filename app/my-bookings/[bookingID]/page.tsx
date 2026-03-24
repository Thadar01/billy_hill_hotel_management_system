"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import UserLayout from "../../components/UserLayout";
import { useCustomerAuthStore } from "@/store/useCustomerAuthStore";

interface Booking {
  bookingID: string;
  customerID: string;
  fullName: string;
  email: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  actualCheckInAt?: string | null;
  actualCheckOutAt?: string | null;
  bookingStatus: string;
  paymentStatus: string;
  roomSubtotal: number;
  serviceSubtotal: number;
  discountAmount: number;
  pointsUsed: number;
  pointsDiscountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  balanceAmount: number;
  specialRequest: string | null;
  note: string | null;
  createdAt: string;
}

interface BookingRoom {
  bookingRoomID: number;
  roomID: string;
  roomNumber: string;
  roomType: string;
  adults: number;
  children: number;
  nights: number;
  pricePerNight: number;
  discountID: number | null;
  discountAmount: number;
  lineTotal: number;
}

interface BookingService {
  bookingServiceID: number;
  premiumServiceId: number;
  serviceName: string;
  serviceDescription: string | null;
  pricingType: "unit" | "person" | "unit_person";
  quantity: number;
  personCount: number | null;
  unitPrice: number;
  lineTotal: number;
  serviceDate: string | null;
  note: string | null;
}

interface Payment {
  paymentID: number;
  bookingID: string;
  amount: number;
  paymentMethod: string;
  paymentType: string;
  paymentStatus: string;
  transactionRef: string | null;
  note: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface Refund {
  refundID: number;
  bookingID: string;
  paymentID: number;
  refundAmount: number;
  refundMethod: string;
  refundStatus: string;
  refundReason: string | null;
  refundRef: string | null;
  note: string | null;
  refundedAt: string | null;
  createdAt: string;
}

interface PointTransaction {
  pointTransactionID: number;
  customerID: string;
  bookingID: string | null;
  type: string;
  points: number;
  description: string | null;
  createdAt: string;
}

interface BookingDetailResponse {
  booking: Booking;
  rooms: BookingRoom[];
  services: BookingService[];
  payments: Payment[];
  refunds: Refund[];
  pointTransactions: PointTransaction[];
}

function formatMoney(value: number | string) {
  return Number(value || 0).toFixed(2);
}

function formatDate(value?: string | null, mounted?: boolean) {
  if (!value) return "-";
  if (!mounted) return "...";
  return new Date(value).toLocaleString();
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingID = params.bookingID as string;

  const { customer } = useCustomerAuthStore();

  const [data, setData] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!bookingID) {
      setLoading(false);
      setError("Booking ID is missing");
      return;
    }

    if (!customer?.customerID) {
      setLoading(false);
      return;
    }

    fetchBookingDetail();
  }, [bookingID, customer?.customerID]);

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/bookings/${bookingID}`);
      const text = await res.text();

      let parsed: BookingDetailResponse | { error?: string } | null = null;

      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(`Invalid server response: ${text}`);
      }

      if (!res.ok) {
        throw new Error(
          parsed &&
            typeof parsed === "object" &&
            "error" in parsed &&
            typeof parsed.error === "string"
            ? parsed.error
            : "Failed to fetch booking detail"
        );
      }

      setData(parsed as BookingDetailResponse);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch booking detail"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    try {
      if (!customer?.customerID) {
        alert("Please log in first");
        return;
      }

      const confirmed = window.confirm(
        "Are you sure you want to cancel this booking?"
      );

      if (!confirmed) return;

      setCancelling(true);

      const res = await fetch(`/api/bookings/${bookingID}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerID: customer.customerID }),
      });

      const text = await res.text();

      let result: { error?: string; message?: string } = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Invalid server response: ${text}`);
      }

      if (!res.ok) {
        throw new Error(result.error || "Failed to cancel booking");
      }

      alert(result.message || "Booking cancelled successfully");
      await fetchBookingDetail();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  if (!customer?.customerID && !loading) {
    return (
      <UserLayout>
        <div className="max-w-3xl mx-auto px-4 py-10 text-black">
          <div className="bg-white shadow rounded-2xl p-6">
            <h1 className="text-2xl font-bold mb-3">Booking Detail</h1>
            <p className="text-gray-600 mb-4">
              Please log in to view your booking detail.
            </p>
            <Link
              href="/my-bookings"
              className="inline-block border border-black px-4 py-2 rounded-lg"
            >
              Back to My Bookings
            </Link>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="min-h-screen flex items-center justify-center text-black">
          Loading booking detail...
        </div>
      </UserLayout>
    );
  }

  if (error || !data) {
    return (
      <UserLayout>
        <div className="max-w-3xl mx-auto px-4 py-10 text-black">
          <div className="bg-white shadow rounded-2xl p-6">
            <h1 className="text-2xl font-bold mb-3">Booking Detail</h1>
            <p className="text-red-500 mb-4">{error || "Booking not found"}</p>
            <Link
              href="/my-bookings"
              className="inline-block border border-black px-4 py-2 rounded-lg"
            >
              Back to My Bookings
            </Link>
          </div>
        </div>
      </UserLayout>
    );
  }

  const { booking, rooms, services, payments, refunds, pointTransactions } = data;

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 text-black space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Booking Detail</h1>
            <p className="text-gray-600 mt-1">
              Booking ID: <span className="font-semibold">{booking.bookingID}</span>
            </p>
          </div>

          <div className="flex gap-3">
            {booking.bookingStatus === "confirmed" && (
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel Booking"}
              </button>
            )}

            <Link
              href="/my-bookings"
              className="border border-black px-4 py-2 rounded-lg"
            >
              Back to My Bookings
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-2xl p-5">
              <h2 className="text-xl font-semibold mb-4">Booking Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Customer Name</p>
                  <p className="font-medium">{booking.fullName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{booking.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{booking.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created At</p>
                  <p className="font-medium">{formatDate(booking.createdAt, mounted)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check-in Date</p>
                  <p className="font-medium">{formatDate(booking.checkInDate, mounted)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check-out Date</p>
                  <p className="font-medium">{formatDate(booking.checkOutDate, mounted)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check-in Time</p>
                  <p className="font-medium">{booking.checkInTime || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check-out Time</p>
                  <p className="font-medium">{booking.checkOutTime || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Actual Check-in</p>
                  <p className="font-medium">{formatDate(booking.actualCheckInAt, mounted)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Actual Check-out</p>
                  <p className="font-medium">{formatDate(booking.actualCheckOutAt, mounted)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Booking Status</p>
                  <p className="font-medium capitalize">{booking.bookingStatus}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment Status</p>
                  <p className="font-medium capitalize">{booking.paymentStatus}</p>
                </div>
              </div>

              {booking.specialRequest && (
                <div className="mt-5">
                  <p className="text-gray-500 text-sm">Special Request</p>
                  <p className="font-medium">{booking.specialRequest}</p>
                </div>
              )}

              {booking.note && (
                <div className="mt-3">
                  <p className="text-gray-500 text-sm">Note</p>
                  <p className="font-medium">{booking.note}</p>
                </div>
              )}
            </div>

            <div className="bg-white shadow rounded-2xl p-5">
              <h2 className="text-xl font-semibold mb-4">Booked Rooms</h2>

              {rooms.length === 0 ? (
                <p className="text-gray-500">No rooms in this booking.</p>
              ) : (
                <div className="space-y-4">
                  {rooms.map((room) => (
                    <div key={room.bookingRoomID} className="border rounded-xl p-4">
                      <div className="flex flex-col md:flex-row md:justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">
                            {room.roomNumber} - {room.roomType}
                          </h3>
                          <p className="text-sm text-gray-600">Room ID: {room.roomID}</p>
                        </div>
                        <div className="text-sm md:text-right">
                          <p>Price/Night: ${formatMoney(room.pricePerNight)}</p>
                          <p>Nights: {room.nights}</p>
                          <p className="font-semibold">
                            Line Total: ${formatMoney(room.lineTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white shadow rounded-2xl p-5">
              <h2 className="text-xl font-semibold mb-4">Premium Services</h2>

              {services.length === 0 ? (
                <p className="text-gray-500">No premium services selected.</p>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => (
                    <div
                      key={service.bookingServiceID}
                      className="border rounded-xl p-4"
                    >
                      <div className="flex flex-col md:flex-row md:justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{service.serviceName}</h3>
                          {service.serviceDescription && (
                            <p className="text-sm text-gray-600 mt-1">
                              {service.serviceDescription}
                            </p>
                          )}
                        </div>
                        <div className="text-sm md:text-right">
                          <p>Unit Price: ${formatMoney(service.unitPrice)}</p>
                          <p className="capitalize">
                            Pricing Type: {service.pricingType.replaceAll("_", " ")}
                          </p>
                          <p className="font-semibold">
                            Line Total: ${formatMoney(service.lineTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white shadow rounded-2xl p-5">
              <h2 className="text-xl font-semibold mb-4">Payments</h2>

              {payments.length === 0 ? (
                <p className="text-gray-500">No payments recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Payment ID</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Method</th>
                        <th className="text-left py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.paymentID} className="border-b">
                          <td className="py-2">{payment.paymentID}</td>
                          <td className="py-2">${formatMoney(payment.amount)}</td>
                          <td className="py-2 capitalize">{payment.paymentMethod}</td>
                          <td className="py-2 capitalize">{payment.paymentStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white shadow rounded-2xl p-5">
              <h2 className="text-xl font-semibold mb-4">Refunds</h2>

              {refunds.length === 0 ? (
                <p className="text-gray-500">No refunds recorded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Refund ID</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Method</th>
                        <th className="text-left py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refunds.map((refund) => (
                        <tr key={refund.refundID} className="border-b">
                          <td className="py-2">{refund.refundID}</td>
                          <td className="py-2">${formatMoney(refund.refundAmount)}</td>
                          <td className="py-2 capitalize">{refund.refundMethod}</td>
                          <td className="py-2 capitalize">{refund.refundStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white shadow rounded-2xl p-5 sticky top-6">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Room Subtotal</span>
                  <span>${formatMoney(booking.roomSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Subtotal</span>
                  <span>${formatMoney(booking.serviceSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount Amount</span>
                  <span>${formatMoney(booking.discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Points Used</span>
                  <span>{booking.pointsUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Points Discount</span>
                  <span>${formatMoney(booking.pointsDiscountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax Amount</span>
                  <span>${formatMoney(booking.taxAmount)}</span>
                </div>

                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span>${formatMoney(booking.totalAmount)}</span>
                </div>

                <div className="flex justify-between text-green-700">
                  <span>Paid Amount</span>
                  <span>${formatMoney(booking.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Refunded Amount</span>
                  <span>${formatMoney(booking.refundedAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Balance Amount</span>
                  <span>${formatMoney(booking.balanceAmount)}</span>
                </div>
              </div>

              {pointTransactions.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Point Transactions</h3>
                  <div className="space-y-2 text-sm">
                    {pointTransactions.map((point) => (
                      <div
                        key={point.pointTransactionID}
                        className="border rounded-lg p-3"
                      >
                        <p className="font-medium capitalize">{point.type}</p>
                        <p>Points: {point.points}</p>
                        <p className="text-gray-600">{point.description || "-"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}