"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/app/components/Layout";
import { ArrowLeft, TrendingUp, BarChart3, Calendar, Hotel } from "lucide-react";

interface DailyStat {
  date: string;
  bookedRooms: number;
  occupancyRate: number;
}

interface ReportData {
  totalRooms: number;
  averageOccupancy: number;
  dailyStats: DailyStat[];
  peakPeriods: DailyStat[];
}

export default function BookingOccupancyReport() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchReport();
  }, [days]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/occupancy?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch report data");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 text-black">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Link
              href="/admin/bookings"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Booking & Occupancy</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Insights into room demand and peak periods
              </p>
            </div>
          </div>

          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full sm:w-auto border rounded-lg px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
            {error}
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Hotel className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Total Rooms
                  </h3>
                </div>
                <p className="text-3xl font-bold">{data.totalRooms}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Occupancy
                  </h3>
                </div>
                <p className="text-3xl font-bold">{data.averageOccupancy}%</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Peak Occupancy
                  </h3>
                </div>
                <p className="text-3xl font-bold">
                  {Math.max(...data.dailyStats.map((s) => s.occupancyRate))}%
                </p>
              </div>
            </div>

            {/* Occupancy Chart (CSS-based) */}
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Occupancy Trend (Last {days} Days)
              </h3>
              <div className="overflow-x-auto pt-8 pb-2">
                <div
                  className="h-64 flex items-end gap-1 md:gap-2 border-b-2 border-gray-100"
                  style={{ minWidth: `${days * 12}px` }}
                >
                  {data.dailyStats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-full flex flex-col justify-end group relative"
                    >
                      <div
                        className="w-full bg-blue-500 hover:bg-blue-600 rounded-t-sm transition-all"
                        style={{
                          height: `${Math.max(stat.occupancyRate, 1)}%`,
                          minHeight: '4px'
                        }}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                          {stat.date}: {stat.occupancyRate}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex justify-between text-[10px] md:text-xs text-gray-400 border-t pt-4">
                <span>{data.dailyStats[0]?.date}</span>
                <span>{data.dailyStats[Math.floor(data.dailyStats.length / 2)]?.date}</span>
                <span>{data.dailyStats[data.dailyStats.length - 1]?.date}</span>
              </div>
            </div>

            {/* Peak Periods Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-700">
                  <Calendar className="w-5 h-5" />
                  Peak Periods
                </h3>
                <div className="space-y-4">
                  {data.peakPeriods.map((period, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold">{new Date(period.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        <p className="text-xs text-gray-500">{period.bookedRooms} Rooms Occupied</p>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {period.occupancyRate}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4">Manager Insights</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    <span>Based on the last {days} days, the average occupancy is {data.averageOccupancy}%.</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    <span>Peak periods identified on {data.peakPeriods[0]?.date} indicate high demand. Consider adjusting pricing for these dates.</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    <span>Optimize room allocation by prioritizing high-occupancy types during peak periods.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
