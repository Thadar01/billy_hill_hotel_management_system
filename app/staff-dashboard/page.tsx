"use client";

import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuthStore } from "@/store/useAuthStore";
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Users,
  Percent,
  Wallet,
  ArrowDownCircle,
  Calendar,
  ShoppingBag,
  Activity,
  Target,
  Trophy,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RevenueStats {
  roomRevenue: number;
  serviceRevenue: number;
  totalRefunds: number;
  totalRevenue: number;
  netProfit: number;
  dailyStats: { date: string; revenue: number }[];
}

interface OccupancyStats {
  totalRooms: number;
  averageOccupancy: number;
  peakPeriods: { date: string; occupancyRate: number; bookedRooms: number }[];
}

interface ServiceStats {
  totalServiceRevenue: number;
  totalServiceOrders: number;
  summary: { serviceName: string; totalOrders: number; totalRevenue: number }[];
}

interface EfficiencyStats {
  totalPayroll: number;
  totalStaff: number;
  costPerBooking: number;
  revenueToStaffRatio: number;
}

export default function StaffDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyStats | null>(null);
  const [services, setServices] = useState<ServiceStats | null>(null);
  const [efficiency, setEfficiency] = useState<EfficiencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [isGM, setIsGM] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch("/api/roles");
        const data = await res.json();
        const roles = data.roles || [];
        const role = roles.find((r: any) => r.role_id === user?.role_id)?.role;
        const normalized = role?.toLowerCase();
        
        if (normalized === "general manager" || normalized === "administrator") {
          setIsGM(true);
        } else {
          // Redirect to the first permitted route based on role
          const ROLE_HOME: Record<string, string> = {
            receptionist: "/rooms",
            "staff manager": "/schedules",
            housekeeping: "/rooms",
            "finance manager": "/payroll",
            "finance staff": "/payroll"
          };
          
          const target = ROLE_HOME[normalized as string] || "/rooms";
          router.push(target);
        }
      } catch (error) {
        console.error("Role check error:", error);
        router.push("/login");
      }
    }
    if (user) checkRole();
  }, [user, router]);

  useEffect(() => {
    if (isGM !== true) return;
    async function fetchData() {
      try {
        setLoading(true);
        const [revRes, occRes, servRes, effRes] = await Promise.all([
          fetch(`/api/reports/revenue?days=${days}`),
          fetch(`/api/reports/occupancy?days=${days}`),
          fetch(`/api/reports/services?days=${days}`),
          fetch(`/api/reports/staff-efficiency?days=${days}`)
        ]);

        if (revRes.ok) setRevenue(await revRes.json());
        if (occRes.ok) setOccupancy(await occRes.json());
        if (servRes.ok) setServices(await servRes.json());
        if (effRes.ok) setEfficiency(await effRes.json());
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [days, isGM]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-MM', { style: 'currency', currency: 'MMK', currencyDisplay: 'code' }).format(val).replace('MMK', 'MMK ');

  if (isGM === null) {
    return <Layout><div className="p-20 text-center font-bold text-gray-400 uppercase tracking-widest">Verifying Authorization...</div></Layout>;
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8 p-4 md:p-6 text-black">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Executive Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome, <span className="font-semibold text-blue-600">{user?.staff_name}</span>. Strategic insights for the last {days} days.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-gray-100 text-gray-700">
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
        </div>

        {/* Primary Metrics (Revenue & Occupancy) */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
              title="Total Revenue"
              value={formatCurrency(revenue?.totalRevenue || 0)}
              icon={<DollarSign className="w-6 h-6" />}
              color="blue"
              subtitle="All income streams"
            />
            <SummaryCard
              title="Net Profit"
              value={formatCurrency(revenue?.netProfit || 0)}
              icon={<Wallet className="w-6 h-6" />}
              color="green"
              subtitle="After refunds"
            />
            <SummaryCard
              title="Avg. Occupancy"
              value={`${occupancy?.averageOccupancy || 0}%`}
              icon={<Percent className="w-6 h-6" />}
              color="purple"
              subtitle="Room utilization"
              href="/admin/bookings/reports"
            />
            <SummaryCard
              title="Workforce Cost"
              value={formatCurrency(efficiency?.totalPayroll || 0)}
              icon={<Users className="w-6 h-6" />}
              color="amber"
              subtitle="Total payroll"
              href="/admin/staff/reports"
            />
          </div>
        </section>

        {/* Decision-Making Rows */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Efficiency Metrics */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-red-500" />
                Workforce Efficiency
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Labor Cost / Booking</p>
                  <p className="text-2xl font-black text-gray-900">{formatCurrency(efficiency?.costPerBooking || 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Revenue per Staff</p>
                  <p className="text-2xl font-black text-gray-900">{formatCurrency(efficiency?.revenueToStaffRatio || 0)}</p>
                </div>
              </div>
              <Link
                href="/admin/staff/reports"
                className="mt-6 flex items-center justify-center gap-2 text-blue-600 text-sm font-bold hover:underline"
              >
                View Staff Analysis <ArrowRight size={14} />
              </Link>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
                Revenue Breakdown
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-gray-500 uppercase tracking-tighter">Rooms</span>
                    <span className="text-blue-600">{formatCurrency(revenue?.roomRevenue || 0)}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-1000"
                      style={{ width: revenue?.totalRevenue ? `${(revenue.roomRevenue / revenue.totalRevenue) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-gray-500 uppercase tracking-tighter">Services</span>
                    <span className="text-purple-600">{formatCurrency(revenue?.serviceRevenue || 0)}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full transition-all duration-1000"
                      style={{ width: revenue?.totalRevenue ? `${(revenue.serviceRevenue / revenue.totalRevenue) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Popularity & Occupancy Insights */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Top Services
                </h3>
                <div className="space-y-4">
                  {services?.summary.slice(0, 5).map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{s.serviceName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{s.totalOrders} orders</p>
                      </div>
                      <p className="text-sm font-black text-blue-600">{formatCurrency(s.totalRevenue)}</p>
                    </div>
                  ))}
                  {!services?.summary.length && <p className="text-sm text-gray-400 italic">No service data</p>}
                </div>
                <Link
                  href="/admin/reports/services"
                  className="mt-8 flex items-center justify-center gap-2 text-blue-600 text-sm font-bold hover:underline"
                >
                  Full Service Report <ArrowRight size={14} />
                </Link>
             </div>

             <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Peak Occupancy
                </h3>
                <div className="space-y-4">
                  {occupancy?.peakPeriods.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{p.bookedRooms} Rooms</p>
                      </div>
                      <div className="text-lg font-black text-blue-600">
                        {p.occupancyRate}%
                      </div>
                    </div>
                  ))}
                  {!occupancy?.peakPeriods.length && <p className="text-sm text-gray-400 italic">No peak data</p>}
                </div>
                <Link
                  href="/admin/bookings/reports"
                  className="mt-8 flex items-center justify-center gap-2 text-blue-600 text-sm font-bold hover:underline"
                >
                  Occupancy Details <ArrowRight size={14} />
                </Link>
             </div>
          </div>
        </div>

        {/* Revenue Trend Section (Full Width) */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Revenue Trend
          </h3>
          <div className="h-48 flex items-end gap-1 md:gap-2">
            {revenue?.dailyStats.map((stat, idx) => {
              const maxRev = Math.max(...revenue.dailyStats.map(s => s.revenue), 1);
              const height = (stat.revenue / maxRev) * 100;
              return (
                <div key={idx} className="flex-1 group relative h-full flex flex-col justify-end">
                  <div 
                    className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all duration-500"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl font-bold">
                      {stat.date}: {formatCurrency(stat.revenue)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between text-[10px] font-bold text-gray-400 border-t pt-4 uppercase tracking-widest">
            <span>{revenue?.dailyStats[0]?.date}</span>
            <span>{revenue?.dailyStats[Math.floor((revenue?.dailyStats.length || 0) / 2)]?.date}</span>
            <span>{revenue?.dailyStats[(revenue?.dailyStats.length || 0) - 1]?.date}</span>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function ArrowRight({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
  );
}

function SummaryCard({ title, value, icon, color, subtitle, href }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };

  const content = (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-md transition-all duration-300 h-full">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {title}
          </h3>
          <p className="text-[10px] text-gray-400 font-medium">{subtitle}</p>
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}