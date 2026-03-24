"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";

interface Discount {
  discountID: number;
  discountName: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  roomIDs: string[];
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  const loadDiscounts = async () => {
    try {
      const res = await fetch("/api/discounts", { cache: "no-store" });
      const data = await res.json();
      setDiscounts(data.discounts || []);
    } catch (error) {
      console.error("Failed to load discounts:", error);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadDiscounts();
  }, []);

  const handleDelete = async (discountID: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this discount?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/discounts/${discountID}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete discount");
        return;
      }

      alert("Discount deleted successfully");
      await loadDiscounts();
    } catch (error) {
      console.error("Failed to delete discount:", error);
      alert("Something went wrong");
    }
  };

  const filteredDiscounts = useMemo(() => {
    const q = search.toLowerCase();

    return discounts.filter((discount) => {
      return (
        discount.discountName.toLowerCase().includes(q) ||
        discount.discountType.toLowerCase().includes(q) ||
        (discount.description || "").toLowerCase().includes(q) ||
        discount.roomIDs.some((roomID) => roomID.toLowerCase().includes(q))
      );
    });
  }, [discounts, search]);

  if (pageLoading) {
    return (
      <Layout>
        <div className="p-8 text-black">Loading discounts...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 text-black">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Discount Management</h1>
            <p className="text-sm text-gray-500">
              Manage discounts and assign one discount to multiple rooms.
            </p>
          </div>

          <Link
            href="/discounts/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Create Discount
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Discount List</h2>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search discounts..."
              className="rounded-lg border border-gray-300 p-2"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-sm font-semibold">Value</th>
                  <th className="px-4 py-3 text-sm font-semibold">Date Range</th>
                  <th className="px-4 py-3 text-sm font-semibold">Rooms</th>
                  <th className="px-4 py-3 text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                      No discounts found.
                    </td>
                  </tr>
                ) : (
                  filteredDiscounts.map((discount) => (
                    <tr key={discount.discountID} className="border-b last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="font-medium">{discount.discountName}</div>
                        <div className="text-xs text-gray-500">
                          {discount.description || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3 capitalize">{discount.discountType}</td>

                      <td className="px-4 py-3">
                        {discount.discountType === "percentage"
                          ? `${discount.discountValue}%`
                          : `$${discount.discountValue}`}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        <div>{mounted ? new Date(discount.startDate).toLocaleString() : "..."}</div>
                        <div className="text-gray-500">
                          to {mounted ? new Date(discount.endDate).toLocaleString() : "..."}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {discount.roomIDs.length === 0 ? (
                            <span className="text-sm text-gray-500">-</span>
                          ) : (
                            discount.roomIDs.map((roomID) => (
                              <span
                                key={roomID}
                                className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                              >
                                {roomID}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            discount.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {discount.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/discounts/${discount.discountID}/edit`}
                            className="rounded-lg bg-amber-500 px-3 py-1 text-sm text-white hover:bg-amber-600"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(discount.discountID)}
                            className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}