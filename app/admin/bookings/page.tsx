"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/app/components/Layout";
import { useAuthStore } from "@/store/useAuthStore";

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
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  balanceAmount: number;
  pointsUsed: number;
  createdAt: string;
}

function formatMoney(value: number | string) {
  return Number(value || 0).toFixed(2);
}

function formatDate(value?: string | null, mounted?: boolean) {
  if (!value) return "-";
  if (!mounted) return "...";
  return new Date(value).toLocaleDateString();
}

function badgeClass(status: string) {
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

export default function AdminBookingsPage() {
  interface Role {
    role_id: number;
    role: string;
  }

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [processingID, setProcessingID] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const { user } = useAuthStore();

  const roleName = roles.find((r) => r.role_id === user?.role_id)?.role ?? "Unknown";
  const normalizedRole = roleName.toLowerCase();
  const isManager = ["receptionist"].includes(normalizedRole);

  useEffect(() => {
    setMounted(true);
    fetchBookings();
  }, []);
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch("/api/roles");
        const data = await res.json();
        setRoles(data.roles || []);
      } catch (err) {
        console.error("Failed to fetch roles", err);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    let result = [...bookings];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.bookingID.toLowerCase().includes(q) ||
          b.fullName.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q) ||
          b.phone.toLowerCase().includes(q)
      );
    }

    if (bookingStatusFilter !== "all") {
      result = result.filter((b) => b.bookingStatus === bookingStatusFilter);
    }

    if (paymentStatusFilter !== "all") {
      result = result.filter((b) => b.paymentStatus === paymentStatusFilter);
    }

    setFiltered(result);
  }, [bookings, search, bookingStatusFilter, paymentStatusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/bookings");
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

  const handleCheckIn = async (bookingID: string) => {
    try {
      const confirmed = window.confirm("Check in this booking?");
      if (!confirmed) return;

      setProcessingID(bookingID);

      const res = await fetch(`/api/bookings/${bookingID}/check-in`, {
        method: "PATCH",
      });

      const text = await res.text();

      let data: { error?: string; message?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Invalid server response: ${text}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to check in booking");
      }

      alert(data.message || "Checked in successfully");
      await fetchBookings();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to check in booking");
    } finally {
      setProcessingID(null);
    }
  };

  const handleCheckOut = async (bookingID: string) => {
    try {
      const confirmed = window.confirm("Check out this booking?");
      if (!confirmed) return;

      setProcessingID(bookingID);

      const res = await fetch(`/api/bookings/${bookingID}/check-out`, {
        method: "PATCH",
      });

      const text = await res.text();

      let data: { error?: string; message?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Invalid server response: ${text}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to check out booking");
      }

      alert(data.message || "Checked out successfully");
      await fetchBookings();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to check out booking");
    } finally {
      setProcessingID(null);
    }
  };

  return (
    <Layout>
      <div className="p-6 text-black">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-gray-600 mt-1">Manage bookings and refunds</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Search by booking ID, name, email, phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />

            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">All Booking Status</option>
              <option value="confirmed">confirmed</option>
              <option value="checked_in">checked_in</option>
              <option value="checked_out">checked_out</option>
              <option value="cancelled">cancelled</option>
              <option value="no_show">no_show</option>
            </select>

            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">All Payment Status</option>
              <option value="unpaid">unpaid</option>
              <option value="partially_paid">partially_paid</option>
              <option value="paid">paid</option>
              <option value="partially_refunded">partially_refunded</option>
              <option value="refunded">refunded</option>
            </select>
          </div>
        </div>

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

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            No bookings found.
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3">Booking ID</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">Stay</th>
                  <th className="text-left px-4 py-3">Booking</th>
                  <th className="text-left px-4 py-3">Payment</th>
                  <th className="text-left px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Paid</th>
                  <th className="text-left px-4 py-3 text-blue-600">Points</th>
                  <th className="text-left px-4 py-3">Balance</th>
                  <th className="text-left px-4 py-3 text-red-600">Refund Status</th>
                  <th className="text-left px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((booking) => (
                  <tr key={booking.bookingID} className="border-b">
                    <td className="px-4 py-3 font-medium">{booking.bookingID}</td>

                    <td className="px-4 py-3">
                      <div>{booking.fullName}</div>
                      <div className="text-gray-500">{booking.email}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div>
                        {formatDate(booking.checkInDate, mounted)} - {formatDate(booking.checkOutDate, mounted)}
                      </div>
                      {(booking.checkInTime || booking.checkOutTime) && (
                        <div className="text-gray-500 text-xs">
                          {booking.checkInTime || "-"} / {booking.checkOutTime || "-"}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${badgeClass(
                          booking.bookingStatus
                        )}`}
                      >
                        {booking.bookingStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${badgeClass(
                          booking.paymentStatus
                        )}`}
                      >
                        {booking.paymentStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3">${formatMoney(booking.totalAmount)}</td>
                    <td className="px-4 py-3">${formatMoney(booking.paidAmount)}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{booking.pointsUsed}</td>
                    <td className="px-4 py-3">${formatMoney(booking.balanceAmount)}</td>
                    <td className="px-4 py-3">
                      {Number(booking.refundedAmount) > 0 ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 font-medium whitespace-nowrap">
                          Refunded
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">No Refunds</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {booking.bookingStatus === "confirmed" && (
                          <button
                            onClick={() => handleCheckIn(booking.bookingID)}
                            disabled={processingID === booking.bookingID}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                          >
                            {processingID === booking.bookingID ? "Processing..." : "Check In"}
                          </button>
                        )}

                        {booking.bookingStatus === "checked_in" && isManager && (
                          <button
                            onClick={() => handleCheckOut(booking.bookingID)}
                            disabled={processingID === booking.bookingID}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                          >
                            {processingID === booking.bookingID ? "Processing..." : "Check Out"}
                          </button>
                        )}

                        <Link
                          href={`/admin/bookings/${booking.bookingID}`}
                          className="bg-black text-white px-3 py-2 rounded-lg inline-block"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}