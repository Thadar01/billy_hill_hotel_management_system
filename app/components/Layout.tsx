"use client";

import { Settings } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";

interface LayoutProps {
  children: ReactNode;
}

interface Role {
  role_id: number;
  role: string;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, hasHydrated } = useAuthStore();

  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || !user) {
      router.push("/login");
    }
  }, [hasHydrated, isAuthenticated, user, router]);

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

    if (hasHydrated && isAuthenticated && user) {
      fetchRoles();
    }
  }, [hasHydrated, isAuthenticated, user]);

  if (!hasHydrated) return null;
  if (!user || !isAuthenticated) return null;

  const roleName =
    roles.find((r) => r.role_id === user.role_id)?.role ?? "Unknown";

  const normalizedRole = roleName.toLowerCase();
  const isGM = normalizedRole === "general manager" || normalizedRole === "administrator";

  const ROLE_PERMISSIONS: Record<string, string[]> = {
    receptionist: ["/rooms", "/admin/premium-services", "/admin/bookings", "/schedules", "/admin/feedbacks"],
    "staff manager": ["/schedules", "/rooms", "/housekeeping-schedules", "/admin/feedbacks"],
    housekeeping: ["/rooms", "/housekeeping-schedules"],
    "finance manager": ["/payroll", "/admin/refunds", "/admin/bookings", "/schedules"],
    "finance staff": ["/payroll", "/admin/refunds", "/admin/bookings", "/schedules"],
  };

  const navClass = (path: string) =>
    pathname === path
      ? "px-4 py-2 rounded bg-blue-100 text-blue-700 font-medium"
      : "px-4 py-2 rounded hover:bg-gray-100 text-black";

  const renderLink = (href: string, label: string) => {
    if (isGM || href === "/" || href === "/staff/settings") return <Link href={href} className={navClass(href)}>{label}</Link>;

    const allowedPaths = ROLE_PERMISSIONS[normalizedRole] || [];
    if (allowedPaths.includes(href)) {
      return <Link href={href} className={navClass(href)}>{label}</Link>;
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen">
        <div className="flex items-center justify-between h-28 border-b border-gray-200 px-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-black">{user.staff_name}</h1>
            <p className="text-sm text-gray-500">{roleName}</p>
          </div>
          <Link
            href="/staff/settings"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition-colors"
            title="Account Settings"
          >
            <Settings size={20} />
          </Link>
        </div>

        <nav className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto">
          {renderLink("/", "Main Dashboard")}
          {renderLink("/staff", "Staffs")}
          {renderLink("/roles", "Roles")}
          {renderLink("/schedules", "Schedules")}
          {renderLink("/payroll", "Payroll")}
          {renderLink("/rooms", "Rooms")}
          {renderLink("/admin/bookings", "Booking")}
          {renderLink("/admin/refunds", "Refunds")}
          {renderLink("/admin/premium-services", "Premium Room Services")}
          {renderLink("/discounts", "Discounts")}
          {renderLink("/housekeeping-schedules", "Housekeeping Schedules")}
          {renderLink("/admin/feedbacks", "Feedbacks")}

          <button
            onClick={logout}
            className="mt-auto px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
          >
            Logout
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}