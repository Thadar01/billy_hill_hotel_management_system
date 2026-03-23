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
  checkInTime:string;
  checkOutTime:string;
  actualCheckInAt:string;
  actualCheckOutAt:string;
  bookingStatus: string;
  paymentStatus: string;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  balanceAmount: number;
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

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function AdminBookingDetailPage() {
  const params = useParams();
  const bookingID = params.bookingID as string;

  const [data, setData] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [updatingRefundID, setUpdatingRefundID] = useState<number | null>(null);

  const [paymentID, setPaymentID] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState<
    "cash" | "kbzpay" | "wavepay" | "bank_transfer" | "card"
  >("cash");
  const [refundStatus, setRefundStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [refundReason, setRefundReason] = useState("");
  const [refundRef, setRefundRef] = useState("");
  const [refundNote, setRefundNote] = useState("");

  useEffect(() => {
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
      if (!paymentID || Number(paymentID) <= 0) {
        alert("Please select a payment");
        return;
      }

      if (Number(refundAmount) <= 0) {
        alert("Refund amount must be greater than 0");
        return;
      }

      setSubmittingRefund(true);

      const res = await fetch(`/api/bookings/${bookingID}/refunds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentID: Number(paymentID),
          refundAmount: Number(refundAmount),
          refundMethod,
          refundStatus,
          refundReason: refundReason || null,
          refundRef: refundRef || null,
          note: refundNote || null,
        }),
      });

      const text = await res.text();

      let result: { error?: string; message?: string } = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Invalid response: ${text}`);
      }

      if (!res.ok) {
        throw new Error(result.error || "Failed to create refund");
      }

      alert(result.message || "Refund created successfully");

      setPaymentID("");
      setRefundAmount(0);
      setRefundMethod("cash");
      setRefundStatus("pending");
      setRefundReason("");
      setRefundRef("");
      setRefundNote("");

      await fetchDetail();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to create refund");
    } finally {
      setSubmittingRefund(false);
    }
  };

  const handleUpdateRefundStatus = async (
    refundID: number,
    nextStatus: "approved" | "rejected"
  ) => {
    try {
      setUpdatingRefundID(refundID);

      const res = await fetch(`/api/refunds/${refundID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refundStatus: nextStatus,
        }),
      });

      const text = await res.text();

      let result: { error?: string; message?: string } = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Invalid response: ${text}`);
      }

      if (!res.ok) {
        throw new Error(result.error || "Failed to update refund");
      }

      await fetchDetail();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to update refund");
    } finally {
      setUpdatingRefundID(null);
    }
  };

  if (loading) {
    return <div className="p-6">Loading booking detail...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <p className="text-red-500 mb-4">{error || "Booking not found"}</p>
        <Link href="/admin/bookings" className="border border-black px-4 py-2 rounded-lg">
          Back to Bookings
        </Link>
      </div>
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

        <Link
          href="/admin/bookings"
          className="border border-black px-4 py-2 rounded-lg"
        >
          Back
        </Link>
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
                <p>{(booking.checkInDate)}</p>
              </div>
              <div>
                <p className="text-gray-500">Check-out</p>
                <p>{(booking.checkOutDate)}</p>
              </div>
              <div>
                <p className="text-gray-500">Check-in Time</p>
                <p>{(booking.checkInTime)}</p>
              </div>
              <div>
                <p className="text-gray-500">Check-out Time</p>
                <p>{(booking.checkOutTime)}</p>
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
                        <td className="py-2">{formatDate(payment.paidAt)}</td>
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
                    <div className="flex flex-col md:flex-row md:justify-between gap-4">
                      <div className="text-sm space-y-1">
                        <p><span className="text-gray-500">Refund ID:</span> {refund.refundID}</p>
                        <p><span className="text-gray-500">Payment ID:</span> {refund.paymentID}</p>
                        <p><span className="text-gray-500">Amount:</span> ${formatMoney(refund.refundAmount)}</p>
                        <p><span className="text-gray-500">Method:</span> {refund.refundMethod}</p>
                        <p><span className="text-gray-500">Status:</span> {refund.refundStatus}</p>
                        <p><span className="text-gray-500">Reason:</span> {refund.refundReason || "-"}</p>
                        <p><span className="text-gray-500">Ref:</span> {refund.refundRef || "-"}</p>
                        <p><span className="text-gray-500">Note:</span> {refund.note || "-"}</p>
                      </div>

                      {refund.refundStatus === "pending" && (
                        <div className="flex gap-2 h-fit">
                          <button
                            onClick={() => handleUpdateRefundStatus(refund.refundID, "approved")}
                            disabled={updatingRefundID === refund.refundID}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateRefundStatus(refund.refundID, "rejected")}
                            disabled={updatingRefundID === refund.refundID}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
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
                  <p className="font-medium">{room.roomNumber} - {room.roomType}</p>
                  <p>Adults: {room.adults} | Children: {room.children} | Nights: {room.nights}</p>
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
              <div className="flex justify-between font-semibold">
                <span>Balance Amount</span>
                <span>${formatMoney(booking.balanceAmount)}</span>
              </div>
            </div>
          </div>

          {booking.bookingStatus === "cancelled" && payments.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">Create Refund</h2>

              <div className="space-y-3">
                <div>
                  <label className="block mb-1 text-sm font-medium">Payment</label>
                  <select
                    value={paymentID}
                    onChange={(e) => setPaymentID(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select payment</option>
                    {payments.map((payment) => (
                      <option key={payment.paymentID} value={payment.paymentID}>
                        #{payment.paymentID} - ${formatMoney(payment.amount)} - {payment.paymentMethod}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Refund Amount</label>
                  <input
                    type="number"
                    min={0}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Refund Method</label>
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

                <div>
                  <label className="block mb-1 text-sm font-medium">Refund Status</label>
                  <select
                    value={refundStatus}
                    onChange={(e) =>
                      setRefundStatus(
                        e.target.value as "pending" | "approved" | "rejected"
                      )
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="pending">pending</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Reason</label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Refund Ref</label>
                  <input
                    type="text"
                    value={refundRef}
                    onChange={(e) => setRefundRef(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Note</label>
                  <textarea
                    value={refundNote}
                    onChange={(e) => setRefundNote(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleCreateRefund}
                  disabled={submittingRefund}
                  className="w-full bg-black text-white rounded-lg py-3 disabled:opacity-50"
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