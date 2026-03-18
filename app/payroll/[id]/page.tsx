"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Layout from "../../components/Layout";

interface PayrollDetail {
  payroll_id: number;
  staff_name: string;
  staff_id: string;
  period_start: string;
  period_end: string;
  total_worked_hours: number;
  total_overtime_minutes: number;
  total_late_minutes: number;
  base_pay: number;
  overtime_pay: number;
  late_deduction: number;
  gross_pay: number;
  status: "draft" | "approved" | "paid";
  paid_at: string | null;
}

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [payroll, setPayroll] = useState<PayrollDetail | null>(null);

  useEffect(() => {
    const fetchPayroll = async () => {
      const res = await fetch(`/api/payroll/${id}`);
      const data = await res.json();
      setPayroll(data.payroll);
    };

    if (id) fetchPayroll();
  }, [id]);

  return (
    <Layout>
      {!payroll ? (
        <div className="p-6">Loading...</div>
      ) : (
        <div className="p-6 text-black">
          <h1 className="text-2xl font-bold mb-4">Payroll Receipt</h1>

          <div className="border p-4">
            <p><strong>Staff:</strong> {payroll.staff_name}</p>
            <p><strong>Period:</strong> {payroll.period_start} → {payroll.period_end}</p>
            <p><strong>Worked Hours:</strong> {payroll.total_worked_hours}</p>
            <p><strong>Base Pay:</strong> ${payroll.base_pay}</p>
            <p><strong>Overtime:</strong> ${payroll.overtime_pay}</p>
            <p><strong>Late Deduction:</strong> ${payroll.late_deduction}</p>
            <p className="text-lg font-bold mt-2">
              Gross Pay: ${payroll.gross_pay}
            </p>
            <p className="mt-2 text-green-600">
              Status: {payroll.status}
            </p>
            <p>Paid At: {payroll.paid_at}</p>
          </div>

          <button
            onClick={() => window.print()}
            className="mt-4 bg-blue-600 text-white px-4 py-2"
          >
            Print Receipt
          </button>
        </div>
      )}
    </Layout>
  );
}