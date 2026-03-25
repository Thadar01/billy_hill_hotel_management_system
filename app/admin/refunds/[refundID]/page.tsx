"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Layout from "@/app/components/Layout";

interface RefundDetail {
  refundID: number;
  bookingID: string;
  paymentID: number;
  refundAmount: number;
  refundMethod: string;
  refundStatus: "pending" | "accepted" | "rejected";
  refundReason: string | null;
  refundRef: string | null;
  note: string | null;
  refundedAt: string | null;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

function formatMoney(value: number | string) {
  return Number(value || 0).toFixed(2);
}

function formatDateTime(value?: string | null, mounted?: boolean) {
  if (!value) return "-";
  if (!mounted) return "...";
  return new Date(value).toLocaleString();
}

function statusBadgeClass(status: string) {
  switch (status.toLowerCase()) {
    case "accepted":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AdminRefundDetailPage() {
  const { refundID } = useParams();
  const [refund, setRefund] = useState<RefundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchRefund();
  }, [refundID]);

  const fetchRefund = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/refunds/${refundID}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch refund detail");
      setRefund(data.refund);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch refund detail");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (nextStatus: "accepted" | "rejected") => {
    try {
      const confirmed = window.confirm(`Are you sure you want to ${nextStatus} this refund?`);
      if (!confirmed) return;

      setUpdating(true);
      const res = await fetch(`/api/refunds/${refundID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundStatus: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update refund");

      alert(data.message || "Refund updated successfully");
      await fetchRefund();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to update refund");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <Layout><div className="p-6">Loading refund detail...</div></Layout>;
  }

  if (error || !refund) {
    return (
      <Layout>
        <div className="p-6">
          <p className="text-red-500 mb-4">{error || "Refund not found"}</p>
          <Link href="/admin/refunds" className="border border-black px-4 py-2 rounded-lg">
            Back to Refunds
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 text-black space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Refund #{refund.refundID}</h1>
            <p className="text-gray-600 mt-1">
              Associated with Booking <Link href={`/admin/bookings/${refund.bookingID}`} className="text-blue-600 hover:underline font-medium">#{refund.bookingID}</Link>
            </p>
          </div>

          <div className="flex gap-3">
            {refund.refundStatus === "pending" && (
              <>
                <button
                  onClick={() => handleUpdateStatus("accepted")}
                  disabled={updating}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Approve Refund
                </button>
                <button
                  onClick={() => handleUpdateStatus("rejected")}
                  disabled={updating}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Reject Refund
                </button>
              </>
            )}
            <Link href="/admin/refunds" className="border border-black px-4 py-2 rounded-lg font-medium">
              Back
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Refund Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 font-medium">Refund Amount</p>
                <p className="text-lg font-bold text-red-600">${formatMoney(refund.refundAmount)}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Refund Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${statusBadgeClass(refund.refundStatus)}`}>
                  {refund.refundStatus.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Refund Method</p>
                <p className="capitalize">{refund.refundMethod}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Payment Reference</p>
                <p>{refund.refundRef || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Created At</p>
                <p>{formatDateTime(refund.createdAt, mounted)}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Processed At</p>
                <p>{formatDateTime(refund.refundedAt, mounted)}</p>
              </div>
            </div>
            <div className="text-sm">
              <p className="text-gray-500 font-medium">Reason</p>
              <p className="bg-gray-50 p-3 rounded-lg mt-1 italic">{refund.refundReason || "No reason provided"}</p>
            </div>
            {refund.note && (
              <div className="text-sm">
                <p className="text-gray-500 font-medium">Admin Note</p>
                <p className="bg-gray-50 p-3 rounded-lg mt-1">{refund.note}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Customer & Booking</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 font-medium">Customer Name</p>
                  <p className="text-base font-semibold">{refund.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 font-medium">Email</p>
                  <p>{refund.customerEmail}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Phone Number</p>
                <p>{refund.customerPhone}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-blue-800 font-bold mb-2">Internal Note for Finance</p>
                <p className="text-blue-700 text-xs leading-relaxed">
                  Please verify the payment transaction in the {refund.refundMethod} portal using the reference ID: <strong>{refund.refundRef || "N/A"}</strong> before approving the refund.
                </p>
              </div>
              <Link
                href={`/admin/bookings/${refund.bookingID}`}
                className="block text-center bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                View Full Booking Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
