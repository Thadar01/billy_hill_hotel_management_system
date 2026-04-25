"use client";

import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuthStore } from "@/store/useAuthStore";

interface Payroll {
    payroll_id: number;
    staff_name: string;
    role?: string;
    period_start: string;
    period_end: string;
    gross_pay: number;
    status: "draft" | "approved" | "paid";
    paid_at: string | null;
}


export default function PayrollPage() {
    interface Role {
        role_id: number;
        role: string;
    }
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [periodStart, setPeriodStart] = useState("");
    const [periodEnd, setPeriodEnd] = useState("");
    const [loadingType, setLoadingType] = useState<"staff" | "management" | null>(null);
    const loading = loadingType !== null;
    const [roles, setRoles] = useState<Role[]>([]);
    const { user } = useAuthStore();
    const roleName = roles.find((r) => r.role_id === user?.role_id)?.role ?? "Unknown";
    const normalizedRole = roleName.toLowerCase();
    const isFinance = ["finance staff"].includes(normalizedRole);
    const isManager = ["general manager"].includes(normalizedRole);


    const loadPayrolls = async () => {
        try {
            const res = await fetch("/api/payroll", {
                cache: "no-store",
            });
            const data = await res.json();
            setPayrolls(data.payrolls || []);
        } catch (error) {
            console.error("Failed to fetch payrolls:", error);
        }
    };

    useEffect(() => {
        loadPayrolls();
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

    const generatePayroll = async (isFixed: boolean = false) => {
        let start = periodStart;
        let end = periodEnd;

        // If it's fixed payroll and no dates selected, default to current month
        if (isFixed && (!start || !end)) {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            // Format as YYYY-MM-DD for the API
            start = firstDay.toISOString().split("T")[0];
            end = lastDay.toISOString().split("T")[0];
        }

        if (!start || !end) {
            alert("Select period first");
            return;
        }

        setLoadingType(isFixed ? "management" : "staff");

        try {
            const response = await fetch("/api/payroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    period_start: start,
                    period_end: end,
                    is_fixed: isFixed
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to generate payroll");
                return;
            }

            await loadPayrolls();
        } catch (error) {
            console.error("Generate payroll error:", error);
            alert("Something went wrong");
        } finally {
            setLoadingType(null);
        }
    };

    const approvePayroll = async (id: number) => {
        try {
            const response = await fetch(`/api/payroll/${id}/approve`, {
                method: "PUT",
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to approve payroll");
                return;
            }

            await loadPayrolls();
        } catch (error) {
            console.error("Approve payroll error:", error);
            alert("Something went wrong");
        }
    };

    const payPayroll = async (id: number) => {
        try {
            const response = await fetch(`/api/payroll/${id}/pay`, {
                method: "PUT",
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to pay payroll");
                return;
            }

            await loadPayrolls();
        } catch (error) {
            console.error("Pay payroll error:", error);
            alert("Something went wrong");
        }
    };

    return (
        <Layout>
            <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full text-black">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-3xl font-semibold">Payroll</h1>
                </div>

                {/* Controls */}
                <div className="bg-gray-50 border border-gray-200 rounded p-4 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-1 block">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={periodStart}
                                onChange={(e) => setPeriodStart(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 bg-white rounded text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-1 block">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={periodEnd}
                                onChange={(e) => setPeriodEnd(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 bg-white rounded text-sm"
                            />
                        </div>
                        {isManager && (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={() => generatePayroll(false)}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loadingType === "staff" ? "Generating Staff..." : "Generate Staff Payroll"}
                                </button>
                                <button
                                    onClick={() => generatePayroll(true)}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                                >
                                    {loadingType === "management" ? "Generating Management..." : "Generate Management Payroll"}
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                {/* Empty State */}
                {payrolls.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        No payroll records
                    </div>
                ) : (
                    <div className="bg-white border border-gray-300 rounded overflow-x-auto shadow-sm">

                        {/* TABLE ONLY */}
                        <table className="min-w-[700px] w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="px-6 py-3 text-sm font-semibold">Staff</th>
                                    <th className="px-6 py-3 text-sm font-semibold">Period</th>
                                    <th className="px-6 py-3 text-sm font-semibold">Gross Pay</th>
                                    <th className="px-6 py-3 text-sm font-semibold text-center">Status</th>
                                    <th className="px-6 py-3 text-sm font-semibold text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {payrolls.map((p) => (
                                    <tr key={p.payroll_id} className="hover:bg-gray-50">

                                        <td className="px-6 py-4">
                                            <div className="font-semibold">{p.staff_name}</div>
                                            <div className="text-xs text-gray-600 font-medium">
                                                {p.role || "Unknown Role"}
                                            </div>
                                            <div className="text-[10px] text-gray-400">
                                                ID: {p.payroll_id}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm">
                                            {new Date(p.period_start).toLocaleDateString()} →{" "}
                                            {new Date(p.period_end).toLocaleDateString()}
                                        </td>

                                        <td className="px-6 py-4 font-bold">
                                            MMK {p.gross_pay.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                            })}
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-semibold ${p.status === "paid"
                                                    ? "bg-green-100 text-green-700"
                                                    : p.status === "approved"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-gray-100 text-gray-600"
                                                    }`}
                                            >
                                                {p.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">

                                                {p.status === "draft" && (
                                                    <button
                                                        onClick={() => approvePayroll(p.payroll_id)}
                                                        className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>
                                                )}

                                                {p.status === "approved" && isFinance && (
                                                    <button
                                                        onClick={() => payPayroll(p.payroll_id)}
                                                        className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        Pay
                                                    </button>
                                                )}

                                                {p.status === "paid" && (
                                                    <a
                                                        href={`/payroll/${p.payroll_id}`}
                                                        className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        View
                                                    </a>
                                                )}

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