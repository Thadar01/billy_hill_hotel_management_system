"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/app/components/Layout";
import { useAuthStore } from "@/store/useAuthStore";

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
  customerName: string;
  customerEmail: string;
}

function formatMoney(value: number | string) {
  return Number(value || 0).toFixed(2);
}

function formatDate(value?: string | null, mounted?: boolean) {
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

export default function AdminRefundsPage() {
  interface Role {
    role_id: number;
    role: string;
  }
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [filtered, setFiltered] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingRefundID, setUpdatingRefundID] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const { user } = useAuthStore();

  const roleName = roles.find((r) => r.role_id === user?.role_id)?.role ?? "Unknown";
  const normalizedRole = roleName.toLowerCase();
  const isFinance = ["finance staff"].includes(normalizedRole);


  useEffect(() => {
    setMounted(true);
    fetchRefunds();
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
    if (statusFilter === "all") {
      setFiltered(refunds);
    } else {
      setFiltered(refunds.filter((r) => r.refundStatus === statusFilter));
    }
  }, [refunds, statusFilter]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/refunds");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch refunds");
      setRefunds(data.refunds || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch refunds");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    refundID: number,
    nextStatus: "accepted" | "rejected"
  ) => {
    try {
      const confirmed = window.confirm(
        `Are you sure you want to ${nextStatus} this refund?`
      );
      if (!confirmed) return;

      setUpdatingRefundID(refundID);

      const res = await fetch(`/api/refunds/${refundID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundStatus: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update refund");

      alert(data.message || "Refund updated successfully");
      await fetchRefunds();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to update refund");
    } finally {
      setUpdatingRefundID(null);
    }
  };

  return (
    <Layout>
      <div className="p-6 text-black">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Refunds Management</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Review and manage refund requests for the Finance Team
          </p>
        </div>

        {/* FILTER (RESPONSIVE FIXED) */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-sm font-medium whitespace-nowrap">
              Filter Status:
            </span>

            <div className="flex gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
              {["all", "pending", "accepted", "rejected"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm transition-colors flex-shrink-0 ${statusFilter === s
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STATES */}
        {loading && (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            Loading refunds...
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            No refunds found.
          </div>
        )}

        {/* TABLE (RESPONSIVE FIXED) */}
        {!loading && !error && filtered.length > 0 && (
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3">Refund ID</th>
                    <th className="text-left px-4 py-3">Booking</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Method</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((refund) => (
                    <tr
                      key={refund.refundID}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-blue-600 hover:underline">
                        <Link href={`/admin/refunds/${refund.refundID}`}>
                          #{refund.refundID}
                        </Link>
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-700">
                        {refund.bookingID}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium">{refund.customerName}</div>
                        <div className="text-gray-500 text-xs">
                          {refund.customerEmail}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-red-600">
                        MMK {formatMoney(refund.refundAmount)}
                      </td>

                      <td className="px-4 py-3 capitalize">
                        {refund.refundMethod}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(
                            refund.refundStatus
                          )}`}
                        >
                          {refund.refundStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDate(refund.createdAt, mounted)}
                      </td>

                      {/* ACTIONS (RESPONSIVE FIXED) */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2 min-w-[180px]">
                          <Link
                            href={`/admin/refunds/${refund.refundID}`}
                            className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                          >
                            Details
                          </Link>

                          {refund.refundStatus === "pending" && isFinance && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleUpdateStatus(
                                    refund.refundID,
                                    "accepted"
                                  );
                                }}
                                disabled={
                                  updatingRefundID === refund.refundID
                                }
                                className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                Accept
                              </button>

                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleUpdateStatus(
                                    refund.refundID,
                                    "rejected"
                                  );
                                }}
                                disabled={
                                  updatingRefundID === refund.refundID
                                }
                                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}