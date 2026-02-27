"use client";

import { useEffect, useState } from "react";
import Layout from "../components/Layout";

interface Payroll {
  payroll_id: number;
  staff_name: string;
  period_start: string;
  period_end: string;
  gross_pay: number;
  status: "draft" | "approved" | "paid";
  paid_at: string | null;
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [loading, setLoading] = useState(false);

useEffect(() => {
  const loadPayrolls = async () => {
    try {
      const res = await fetch("/api/payroll");
      const data = await res.json();
      setPayrolls(data.payrolls || []);
    } catch (error) {
      console.error("Failed to fetch payrolls:", error);
    }
  };

  loadPayrolls();
}, []);

  const generatePayroll = async () => {
    if (!periodStart || !periodEnd) {
      alert("Select period first");
      return;
    }

    setLoading(true);

    await fetch("/api/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        period_start: periodStart,
        period_end: periodEnd,
      }),
    });

    setLoading(false);
  };

  const approvePayroll = async (id: number) => {
    await fetch(`/api/payroll/${id}/approve`, {
      method: "PUT",
    });
  };

  const payPayroll = async (id: number) => {
    await fetch(`/api/payroll/${id}/pay`, {
      method: "PUT",
    });
  };

  return (

    <Layout>
             <div className="p-6 text-black">
      <h1 className="text-2xl font-bold mb-4">Payroll Management</h1>

      {/* Generate Section */}
      <div className="flex gap-3 mb-6">
        <input
          type="date"
          value={periodStart}
          onChange={(e) => setPeriodStart(e.target.value)}
          className="border p-2"
        />
        <input
          type="date"
          value={periodEnd}
          onChange={(e) => setPeriodEnd(e.target.value)}
          className="border p-2"
        />
        <button
          onClick={generatePayroll}
          className="bg-blue-600 text-white px-4 py-2"
        >
          {loading ? "Generating..." : "Generate Payroll"}
        </button>
      </div>

      {/* Payroll Table */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Staff</th>
            <th className="p-2 border">Period</th>
            <th className="p-2 border">Gross Pay</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {payrolls.map((p) => (
            <tr key={p.payroll_id}>
              <td className="border p-2">{p.staff_name}</td>
              <td className="border p-2">
                {p.period_start} → {p.period_end}
              </td>
              <td className="border p-2">${p.gross_pay}</td>
              <td className="border p-2">{p.status}</td>
              <td className="border p-2 flex gap-2">
                {p.status === "draft" && (
                  <button
                    onClick={() => approvePayroll(p.payroll_id)}
                    className="bg-yellow-500 text-white px-3 py-1"
                  >
                    Approve
                  </button>
                )}

                {p.status === "approved" && (
                  <button
                    onClick={() => payPayroll(p.payroll_id)}
                    className="bg-green-600 text-white px-3 py-1"
                  >
                    Pay
                  </button>
                )}

                {p.status === "paid" && (
                  <a
                    href={`/payroll/${p.payroll_id}`}
                    className="bg-gray-700 text-white px-3 py-1"
                  >
                    Receipt
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </Layout>
   
  );
}