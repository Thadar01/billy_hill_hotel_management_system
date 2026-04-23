"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/app/components/Layout";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  Target
} from "lucide-react";

interface DailyStat {
  date: string;
  cost: number;
}

interface EfficiencyData {
  totalPayroll: number;
  totalStaff: number;
  totalBookings: number;
  totalRevenue: number;
  costPerBooking: number;
  revenueToStaffRatio: number;
  dailyStats: DailyStat[];
}

export default function StaffEfficiencyReport() {
  const [data, setData] = useState<EfficiencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchReport();
  }, [days]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/staff-efficiency?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch report data");
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-MM", {
      style: "currency",
      currency: "MMK",
      currencyDisplay: "code"
    })
      .format(val)
      .replace("MMK", "MMK ");

  if (loading) {
    return (
      <Layout>
        <div className="p-20 text-center text-gray-500 italic">
          Calculating efficiency metrics...
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="p-20 text-center text-red-500">
          Error loading report data.
        </div>
      </Layout>
    );
  }

  const revenueRecovery =
    (data.totalRevenue / (data.totalPayroll || 1)) * 100;

  const recoveryWidth = Math.max(5, Math.min(revenueRecovery, 100));

  const maxCost = Math.max(...data.dailyStats.map(d => d.cost), 1);

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto text-black">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <Link
              href="/staff-dashboard"
              className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors w-fit mb-4"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-semibold">Back to Dashboard</span>
            </Link>

            <h1 className="text-3xl font-bold tracking-tight">
              Staff Efficiency & Workforce Cost
            </h1>
            <p className="text-gray-500">
              Analyze labor costs relative to hotel performance and revenue.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-gray-100">
            <Calendar className="text-gray-400" size={18} />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-transparent text-sm font-bold outline-none cursor-pointer"
            >
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit">
              <Users size={24} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-400 uppercase">
                Active Workforce
              </div>
              <div className="text-3xl font-black">{data.totalStaff} Staff</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl w-fit">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-400 uppercase">
                Workforce Cost
              </div>
              <div className="text-2xl font-black">
                {formatCurrency(data.totalPayroll)}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit">
              <Target size={24} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-400 uppercase">
                Labor Cost / Booking
              </div>
              <div className="text-2xl font-black">
                {formatCurrency(data.costPerBooking)}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl w-fit">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-400 uppercase">
                Revenue per Staff
              </div>
              <div className="text-2xl font-black">
                {formatCurrency(data.revenueToStaffRatio)}
              </div>
            </div>
          </div>
        </div>

        {/* Charts + Insight */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-8">
              <BarChart3 className="text-blue-600" />
              Labor Cost Trend
            </h3>

            <div className="h-64 flex items-end gap-2">
              {data.dailyStats.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 italic">
                  No cost data available
                </div>
              ) : (
                data.dailyStats.map((s, i) => {
                  const height = (s.cost / maxCost) * 100;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full h-full flex flex-col justify-end">
                        <div
                          className="w-full bg-blue-100 rounded-t-lg transition-all duration-300"
                          style={{ height: `${height}%` }}
                        />
                      </div>

                      <span className="text-[10px] text-gray-400 rotate-45 origin-left">
                        {s.date.split("-").slice(1).join("/")}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Insight */}
          <div
            style={{ backgroundColor: '#1e3a8a' }}
            className="p-8 rounded-3xl text-white flex flex-col justify-between shadow-xl"
          >
            <div>
              <h3 className="text-2xl font-bold mb-4">Workforce Insight</h3>

              <div className="space-y-6">

                <div className="bg-white/10 p-4 rounded-2xl">
                  <div className="text-xs text-blue-100 uppercase font-bold tracking-wider mb-1">
                    Efficiency Level
                  </div>
                  <div className="text-lg font-bold">
                    {data.revenueToStaffRatio > data.costPerBooking * 10
                      ? "Optimized"
                      : "Growing"}
                  </div>
                </div>

                {/* Revenue Recovery */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-100 font-bold">Revenue Recovery Status</span>
                    <span className="font-black text-white">{revenueRecovery.toFixed(1)}%</span>
                  </div>
 
                  <div style={{ 
                    height: '16px', 
                    width: '100%', 
                    backgroundColor: 'rgba(255,255,255,0.15)', 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.3)',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${recoveryWidth}%`, 
                      backgroundColor: '#ff4444', 
                      borderRadius: '8px',
                      boxShadow: '0 0 15px rgba(255,68,68,0.8)',
                      transition: 'width 1s ease-in-out'
                    }}></div>
                  </div>
                </div>

              </div>
            </div>

            <div className="mt-8 text-sm text-blue-100 italic opacity-80">
              Tip: Aim for revenue recovery above 200% for sustainable operations.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}