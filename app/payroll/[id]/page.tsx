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

  // ✅ Date formatter
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  return (
    <Layout>
      {/* PRINT STYLE */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {!payroll ? (
        <div className="p-6">Loading...</div>
      ) : (
        <div className="p-6 text-black">

          {/* RECEIPT AREA */}
          <div
            id="print-area"
            className="max-w-xl mx-auto bg-white border border-gray-300 p-6 rounded shadow-sm"
          >
            <h1 className="text-2xl font-bold mb-6 text-center">
              Payroll Receipt
            </h1>

            <div className="space-y-2 text-sm">
              <p><strong>Staff:</strong> {payroll.staff_name}</p>
              <p><strong>Staff ID:</strong> {payroll.staff_id}</p>

              <p>
                <strong>Period:</strong>{" "}
                {formatDate(payroll.period_start)} →{" "}
                {formatDate(payroll.period_end)}
              </p>

              <hr className="my-3" />

              <p><strong>Worked Hours:</strong> {payroll.total_worked_hours}</p>
              <p><strong>Overtime (min):</strong> {payroll.total_overtime_minutes}</p>
              <p><strong>Late (min):</strong> {payroll.total_late_minutes}</p>

              <hr className="my-3" />

              <p>
                <strong>Base Pay:</strong>{" "}
                ${payroll.base_pay.toLocaleString()}
              </p>

              <p>
                <strong>Overtime Pay:</strong>{" "}
                ${payroll.overtime_pay.toLocaleString()}
              </p>

              <p>
                <strong>Late Deduction:</strong>{" "}
                -${payroll.late_deduction.toLocaleString()}
              </p>

              <hr className="my-3" />

              <p className="text-lg font-bold">
                Gross Pay: $
                {payroll.gross_pay.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>

              <p className="mt-2">
                <strong>Status:</strong>{" "}
                <span className="text-green-600 capitalize">
                  {payroll.status}
                </span>
              </p>

              <p>
                <strong>Paid At:</strong> {formatDate(payroll.paid_at)}
              </p>
            </div>
          </div>

          {/* PRINT BUTTON (hidden when printing) */}


        </div>
      )}
    </Layout>
  );
}