"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserLayout from "../components/UserLayout";
import { useCustomerAuthStore } from "@/store/useCustomerAuthStore";
import { useRouter } from "next/navigation";

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

function formatMoney(value: number | string) {
  return Number(value || 0).toLocaleString();
}

function formatDate(value?: string | null, mounted?: boolean) {
  if (!value) return "-";
  if (!mounted) return "...";
  return new Date(value).toLocaleDateString();
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "confirmed":
    case "paid":
    case "approved":
      return "bg-green-100 text-green-700";
    case "pending":
    case "partially_paid":
      return "bg-yellow-100 text-yellow-700";
    case "cancelled":
    case "refunded":
    case "rejected":
      return "bg-red-100 text-red-700";
    case "checked_in":
    case "checked_out":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { customer } = useCustomerAuthStore();

  const [cancellingID, setCancellingID] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!customer?.customerID) {
      setLoading(false);
      return;
    }

    fetchBookings(customer.customerID);
  }, [customer?.customerID]);

  const fetchBookings = async (customerID: string) => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/bookings?customerID=${encodeURIComponent(customerID)}`
      );
      const text = await res.text();

      let data: { bookings?: Booking[]; error?: string } = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Invalid response: ${text}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch bookings");
      }

      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingID: string) => {
    try {
      if (!customer?.customerID) {
        alert("Please log in first");
        return;
      }

      const confirmed = window.confirm(
        "Are you sure you want to cancel this booking?\n\nNOTE: Our cancellation policy only allows a 50% refund of your paid amount."
      );

      if (!confirmed) return;

      setCancellingID(bookingID);

      const res = await fetch(`/api/bookings/${bookingID}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerID: customer.customerID }),
      });

      const text = await res.text();

      let data: { error?: string; message?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Invalid server response: ${text}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel booking");
      }

      await fetchBookings(customer.customerID);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to cancel booking");
    } finally {
      setCancellingID(null);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 text-black">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Bookings</h1>
            <p className="text-gray-600 mt-1">
              View your booking history and details
            </p>
          </div>

          <Link
            href="/user-rooms"
            className="border border-black px-4 py-2 rounded-lg"
          >
            Book New Room
          </Link>
        </div>

        {!customer?.customerID && !loading && (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-500 mb-4">Please log in to view your bookings.</p>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            Loading bookings...
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && customer?.customerID && bookings.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No bookings found yet.</p>
            <Link
              href="/user-rooms"
              className="inline-block bg-black text-white px-4 py-2 rounded-lg"
            >
              Book Now
            </Link>
          </div>
        )}

        {!loading && !error && customer?.customerID && bookings.length > 0 && (
          <div className="grid grid-cols-1 gap-5">
            {bookings.map((booking) => (
              <div
                key={booking.bookingID}
                className="bg-white rounded-2xl shadow p-5 border"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Booking #{booking.bookingID}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Created: {formatDate(booking.createdAt, mounted)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Stay: {formatDate(booking.checkInDate, mounted)} -{" "}
                      {formatDate(booking.checkOutDate, mounted)}
                    </p>
                    {(booking.checkInTime || booking.checkOutTime) && (
                      <p className="text-sm text-gray-600">
                        Time: {booking.checkInTime || "-"} / {booking.checkOutTime || "-"}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                        booking.bookingStatus
                      )}`}
                    >
                      Booking: {booking.bookingStatus}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                        booking.paymentStatus
                      )}`}
                    >
                      Payment: {booking.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-sm">
                  <div>
                    <p className="text-gray-500">Room Subtotal</p>
                    <p className="font-medium">
                      MMK {formatMoney(booking.roomSubtotal)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Service Subtotal</p>
                    <p className="font-medium">
                      MMK {formatMoney(booking.serviceSubtotal)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Points Used</p>
                    <p className="font-medium text-blue-600">
                      {booking.pointsUsed}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Amount</p>
                    <p className="font-medium">
                      MMK {formatMoney(booking.totalAmount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Balance Amount</p>
                    <p className="font-medium">
                      MMK {formatMoney(booking.balanceAmount)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  {booking.bookingStatus === "confirmed" && (
                    <button
                      onClick={() => handleCancelBooking(booking.bookingID)}
                      disabled={cancellingID === booking.bookingID}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {cancellingID === booking.bookingID
                        ? "Cancelling..."
                        : "Cancel"}
                    </button>
                  )}

                  {booking.bookingStatus === "checked_out" && (
                    <Link
                      href={`/feedback/${booking.bookingID}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Leave Feedback
                    </Link>
                  )}

                  <Link
                    href={`/my-bookings/${booking.bookingID}`}
                    className="bg-black text-white px-4 py-2 rounded-lg"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </UserLayout>
  );
}