"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Layout from "@/app/components/Layout";

interface Booking {
  bookingID: string;
  customerID: string;
  fullName: string;
  email: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  actualCheckInAt: string;
  actualCheckOutAt: string;
  bookingStatus: string;
  paymentStatus: string;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  balanceAmount: number;
  pointsUsed: number;
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
  lineTotal: number;
}

interface BookingService {
  bookingServiceID: number;
  premiumServiceId: number;
  serviceName: string;
  pricingType: "unit" | "person" | "unit_person";
  quantity: number;
  personCount: number | null;
  unitPrice: number;
  lineTotal: number;
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
  refundStatus: "pending" | "approved" | "rejected";
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

function formatDateTime(value?: string | null, mounted?: boolean) {
  if (!value) return "-";
  if (!mounted) return "...";
  return new Date(value).toLocaleString();
}

export default function AdminBookingDetailPage() {
  const params = useParams();
  const bookingID = params.bookingID as string;

  const [data, setData] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Refund States
  const [selectedPaymentID, setSelectedPaymentID] = useState<number | "">("");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundMethod, setRefundMethod] = useState<
    "cash" | "kbzpay" | "wavepay" | "bank_transfer" | "card"
  >("cash");
  const [refundStatus, setRefundStatus] = useState<
    "pending" | "accepted" | "rejected"
  >("pending");
  const [refundReason, setRefundReason] = useState("");
  const [refundRef, setRefundRef] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    setMounted(true);
    if (bookingID) {
      fetchDetail();
    }
  }, [bookingID]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/bookings/${bookingID}`);
      const text = await res.text();

      let parsed: BookingDetailResponse | { error?: string } | null = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(`Invalid response: ${text}`);
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
      setError(err instanceof Error ? err.message : "Failed to fetch booking detail");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRefund = async () => {
    try {
      if (!selectedPaymentID || !refundAmount || !refundMethod || !refundStatus) {
        setCreateError("Payment ID, Amount, Method, and Status are required");
        return;
      }
      setSubmittingRefund(true);
      setCreateError("");

      const res = await fetch(`/api/bookings/${bookingID}/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentID: Number(selectedPaymentID),
          refundAmount: Number(refundAmount),
          refundMethod,
          refundStatus,
          refundReason,
          refundRef,
          note: refundNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create refund");
      }

      alert("Refund created successfully");

      // Reset form
      setSelectedPaymentID("");
      setRefundAmount("");
      setRefundReason("");
      setRefundRef("");
      setRefundNote("");

      await fetchDetail();
    } catch (err) {
      console.error(err);
      setCreateError(err instanceof Error ? err.message : "Failed to create refund");
    } finally {
      setSubmittingRefund(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const confirmed = window.confirm("Check in this booking?");
      if (!confirmed) return;

      setIsProcessing(true);

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
      await fetchDetail();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to check in booking");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      const confirmed = window.confirm("Check out this booking?");
      if (!confirmed) return;

      setIsProcessing(true);

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
      await fetchDetail();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to check out booking");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">Loading booking detail...</div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="p-6">
          <p className="text-red-500 mb-4">{error || "Booking not found"}</p>
          <Link href="/admin/bookings" className="border border-black px-4 py-2 rounded-lg">
            Back to Bookings
          </Link>
        </div>
      </Layout>
    );
  }

  const { booking, rooms, services, payments, refunds, pointTransactions } = data;

  return (
    <Layout>
      <div className="p-6 text-black space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Booking #{booking.bookingID}</h1>
            <p className="text-gray-600 mt-1">
              {booking.fullName} • {booking.email}
            </p>
          </div>

          <div className="flex gap-3">
            {booking.bookingStatus === "confirmed" && (
              <button
                onClick={handleCheckIn}
                disabled={isProcessing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Check In"}
              </button>
            )}

            {booking.bookingStatus === "checked_in" && (
              <button
                onClick={handleCheckOut}
                disabled={isProcessing}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Check Out"}
              </button>
            )}

            <Link href="/admin/bookings" className="border border-black px-4 py-2 rounded-lg">
              Back
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">Booking Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Booking Status</p>
                  <p>{booking.bookingStatus}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment Status</p>
                  <p>{booking.paymentStatus}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check-in</p>
                  <p>{booking.checkInDate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check-out</p>
                  <p>{booking.checkOutDate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check-in Time</p>
                  <p>{booking.checkInTime || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check-out Time</p>
                  <p>{booking.checkOutTime || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Actual Check-in</p>
                  <p>{booking.actualCheckInAt || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Actual Check-out</p>
                  <p>{booking.actualCheckOutAt || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p>{booking.phone}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">Payments</h2>
              {payments.length === 0 ? (
                <p className="text-gray-500">No payments found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">ID</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Method</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Paid At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.paymentID} className="border-b">
                          <td className="py-2">{payment.paymentID}</td>
                          <td className="py-2">${formatMoney(payment.amount)}</td>
                          <td className="py-2">{payment.paymentMethod}</td>
                          <td className="py-2">{payment.paymentType}</td>
                          <td className="py-2">{payment.paymentStatus}</td>
                          <td className="py-2">{formatDateTime(payment.paidAt, mounted)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">Refunds</h2>
              {refunds.length === 0 ? (
                <p className="text-gray-500">No refunds found.</p>
              ) : (
                <div className="space-y-4">
                  {refunds.map((refund) => (
                    <div key={refund.refundID} className="border rounded-xl p-4">
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-gray-500">Refund ID:</span> {refund.refundID}
                        </p>
                        <p>
                          <span className="text-gray-500">Amount:</span> ${formatMoney(refund.refundAmount)}
                        </p>
                        <p>
                          <span className="text-gray-500">Status:</span>{" "}
                          <span className={`font-semibold ${
                            refund.refundStatus === "approved" ? "text-green-600" :
                            refund.refundStatus === "rejected" ? "text-red-600" :
                            "text-yellow-600"
                          }`}>
                            {refund.refundStatus}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-500">Date:</span> {formatDateTime(refund.createdAt, mounted)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">Rooms</h2>
              <div className="space-y-3">
                {rooms.map((room) => (
                  <div key={room.bookingRoomID} className="border rounded-xl p-4 text-sm">
                    <p className="font-medium">
                      {room.roomNumber} - {room.roomType}
                    </p>
                    <p>
                      Adults: {room.adults} | Children: {room.children} | Nights: {room.nights}
                    </p>
                    <p>Line Total: ${formatMoney(room.lineTotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">Services</h2>
              {services.length === 0 ? (
                <p className="text-gray-500">No services selected.</p>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <div key={service.bookingServiceID} className="border rounded-xl p-4 text-sm">
                      <p className="font-medium">{service.serviceName}</p>
                      <p>Pricing: {service.pricingType}</p>
                      <p>Quantity: {service.quantity}</p>
                      <p>Person Count: {service.personCount ?? "-"}</p>
                      <p>Line Total: ${formatMoney(service.lineTotal)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {pointTransactions.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-5">
                <h2 className="text-xl font-semibold mb-4">Point Transactions</h2>
                <div className="space-y-3">
                  {pointTransactions.map((point) => (
                    <div key={point.pointTransactionID} className="border rounded-xl p-4 text-sm">
                      <p className="font-medium capitalize">{point.type}</p>
                      <p>Points: {point.points}</p>
                      <p>{point.description || "-"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Total Amount</span>
                  <span>${formatMoney(booking.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid Amount</span>
                  <span>${formatMoney(booking.paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Refunded Amount</span>
                  <span>${formatMoney(booking.refundedAmount)}</span>
                </div>
                <div className="flex justify-between text-blue-600 font-medium">
                  <span>Points Used</span>
                  <span>{booking.pointsUsed}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Balance Amount</span>
                  <span>${formatMoney(booking.balanceAmount)}</span>
                </div>
              </div>
            </div>

            {booking.bookingStatus === "cancelled" && payments.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-5">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                  Create Refund
                </h2>
                {createError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                    {createError}
                  </div>
                )}
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block mb-1 font-medium">Payment ID *</label>
                    <select
                      value={selectedPaymentID}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numVal = val ? Number(val) : "";
                        setSelectedPaymentID(numVal);
                        if (numVal !== "") {
                          const payment = payments.find((p) => p.paymentID === numVal);
                          if (payment) {
                            setRefundAmount((payment.amount * 0.5).toFixed(2));
                          }
                        } else {
                          setRefundAmount("");
                        }
                      }}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="">Select a payment</option>
                      {payments.map((p) => (
                        <option key={p.paymentID} value={p.paymentID}>
                          ID: {p.paymentID} - ${formatMoney(p.amount)} ({p.paymentMethod})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Refund Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Refund Method *</label>
                    <select
                      value={refundMethod}
                      onChange={(e) =>
                        setRefundMethod(
                          e.target.value as
                            | "cash"
                            | "kbzpay"
                            | "wavepay"
                            | "bank_transfer"
                            | "card"
                        )
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="cash">Cash</option>
                      <option value="kbzpay">KBZPay</option>
                      <option value="wavepay">WavePay</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Card</option>
                    </select>
                  </div>

                  {/* Refund status defaults to pending and shouldn't be mutable here */}

                  <div>
                    <label className="block mb-1 font-medium">Reason</label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Refund Ref</label>
                    <input
                      type="text"
                      value={refundRef}
                      onChange={(e) => setRefundRef(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Note</label>
                    <textarea
                      value={refundNote}
                      onChange={(e) => setRefundNote(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      rows={2}
                    />
                  </div>

                  <button
                    onClick={handleCreateRefund}
                    disabled={submittingRefund}
                    className="w-full bg-black text-white hover:bg-gray-800 transition-colors rounded-lg py-3 font-medium disabled:opacity-50"
                  >
                    {submittingRefund ? "Saving..." : "Create Refund"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}