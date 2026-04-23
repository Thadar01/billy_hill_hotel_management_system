"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/app/components/Layout";
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  ShoppingBag,
  Calendar,
  Layers,
  BarChart2,
  Trophy,
  Activity
} from "lucide-react";

interface ServiceSummary {
  premiumServiceId: number;
  serviceName: string;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
}

interface ServiceTrend {
  date: string;
  count: number;
  revenue: number;
}

interface ReportData {
  summary: ServiceSummary[];
  trends: ServiceTrend[];
  totalServiceRevenue: number;
  totalServiceOrders: number;
}

export default function ServicePerformanceReport() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchReport();
  }, [days]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/services?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch service report");
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-MM', { style: 'currency', currency: 'MMK', currencyDisplay: 'code' }).format(val).replace('MMK', 'MMK ');

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto text-black">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <Link href="/staff-dashboard" className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors w-fit mb-4">
              <ArrowLeft size={18} />
              <span className="text-sm font-semibold">Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Service Performance</h1>
            <p className="text-gray-500">Track premium service usage, popularity, and revenue impact.</p>
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

        {loading ? (
          <div className="p-20 text-center text-gray-500 italic">Analyzing service consumption...</div>
        ) : !data ? (
          <div className="p-20 text-center text-red-500">Error loading report data.</div>
        ) : (
          <>
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Service Revenue</p>
                  <p className="text-3xl font-black text-blue-600">{formatCurrency(data.totalServiceRevenue)}</p>
                </div>
                <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl">
                  <TrendingUp size={24} />
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Service Orders</p>
                  <p className="text-3xl font-black text-purple-600">{data.totalServiceOrders}</p>
                </div>
                <div className="p-4 bg-purple-50 text-purple-500 rounded-2xl">
                  <ShoppingBag size={24} />
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Avg. Ticket Size</p>
                  <p className="text-3xl font-black text-green-600">
                    {formatCurrency(data.totalServiceOrders > 0 ? data.totalServiceRevenue / data.totalServiceOrders : 0)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 text-green-500 rounded-2xl">
                  <Activity size={24} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Popularity Ranking */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-8">
                  <Trophy className="text-amber-500" />
                  <h3 className="text-xl font-bold">Service Popularity</h3>
                </div>
                <div className="space-y-6">
                  {data.summary.map((s, idx) => {
                    const maxOrders = Math.max(...data.summary.map(item => item.totalOrders), 1);
                    const percentage = (s.totalOrders / maxOrders) * 100;
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="font-bold text-gray-900">{s.serviceName}</p>
                            <p className="text-xs text-gray-400">{s.totalOrders} bookings</p>
                          </div>
                          <p className="font-black text-blue-600">{formatCurrency(s.totalRevenue)}</p>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>


            </div>

          </>
        )}
      </div>
    </Layout>
  );
}
