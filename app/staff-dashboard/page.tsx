"use client";

import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuthStore } from "@/store/useAuthStore";
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Users,
  ArrowRight,
  Percent,
  Wallet,
  ArrowDownCircle,
  Calendar
} from "lucide-react";
import Link from "next/link";

interface RevenueStats {
  roomRevenue: number;
  serviceRevenue: number;
  totalRefunds: number;
  totalRevenue: number;
  netProfit: number;
}

interface OccupancyStats {
  totalRooms: number;
  averageOccupancy: number;
}

export default function StaffDashboardPage() {
  const { user } = useAuthStore();
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [revRes, occRes] = await Promise.all([
          fetch(`/api/reports/revenue?days=${days}`),
          fetch(`/api/reports/occupancy?days=${days}`)
        ]);

        if (revRes.ok) setRevenue(await revRes.json());
        if (occRes.ok) setOccupancy(await occRes.json());
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [days]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-MM', { style: 'currency', currency: 'MMK', currencyDisplay: 'code' }).format(val).replace('MMK', 'MMK ');

  return (
    <Layout>
      <div className="flex flex-col gap-8 p-4 md:p-6 text-black">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome back, <span className="font-semibold text-blue-600">{user?.staff_name}</span>. Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border text-gray-700">
              <Calendar className="text-gray-400" size={16} />
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-transparent text-sm font-medium outline-none cursor-pointer"
              >
                <option value={30}>Last 30 Days</option>
                <option value={60}>Last 60 Days</option>
                <option value={90}>Last 90 Days</option>
              </select>
            </div>
            {/* <Link
              href="/admin/bookings/reports"
              className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm text-gray-700"
            >
              <BarChart3 className="w-4 h-4" />
              Occupancy Report
            </Link> */}
          </div>
        </div>

        {/* Revenue & Profitability Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Revenue & Profitability
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
              title="Total Revenue"
              value={formatCurrency(revenue?.totalRevenue || 0)}
              icon={<DollarSign className="w-6 h-6" />}
              color="blue"
              subtitle="Bookings + Services"
            />
            <SummaryCard
              title="Net Profit"
              value={formatCurrency(revenue?.netProfit || 0)}
              icon={<Wallet className="w-6 h-6" />}
              color="green"
              subtitle="After refunds & costs"
            />
            <SummaryCard
              title="Total Refunds"
              value={formatCurrency(revenue?.totalRefunds || 0)}
              icon={<ArrowDownCircle className="w-6 h-6" />}
              color="red"
              subtitle="Reversed payments"
              href="/admin/refunds"
            />
            <SummaryCard
              title="Avg. Occupancy"
              value={`${occupancy?.averageOccupancy || 0}%`}
              icon={<Percent className="w-6 h-6" />}
              color="purple"
              subtitle="Room utilization"
              href="/admin/bookings/reports"
            />
          </div>
        </section>

        {/* Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Breakdown */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-6">Revenue Streams</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Room Bookings</span>
                  <span className="font-semibold">{formatCurrency(revenue?.roomRevenue || 0)}</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: revenue ? `${(revenue.roomRevenue / revenue.totalRevenue) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Premium Services</span>
                  <span className="font-semibold">{formatCurrency(revenue?.serviceRevenue || 0)}</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: revenue ? `${(revenue.serviceRevenue / revenue.totalRevenue) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>


          </div>


        </div>
      </div>
    </Layout>
  );
}

function SummaryCard({ title, value, icon, color, subtitle, href }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  const content = (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-md transition-all duration-300 h-full">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}