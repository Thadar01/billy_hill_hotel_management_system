"use client";

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

  const navClass = (path: string) =>
    pathname === path
      ? "px-4 py-2 rounded bg-blue-100 text-blue-700 font-medium"
      : "px-4 py-2 rounded hover:bg-gray-100 text-black";

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen">
        <div className="flex flex-col items-center justify-center h-28 border-b border-gray-200 px-4 text-center">
          <h1 className="text-xl font-bold text-black">{user.staff_name}</h1>
          <p className="text-sm text-gray-500">{roleName}</p>
        </div>

        <nav className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto">
          <Link href="/" className={navClass("/")}>Main Dashboard</Link>
          <Link href="/staff" className={navClass("/staff")}>Staffs</Link>
          <Link href="/roles" className={navClass("/roles")}>Roles</Link>
          <Link href="/schedules" className={navClass("/schedules")}>Schedules</Link>
          <Link href="/payroll" className={navClass("/payroll")}>Payroll</Link>
          <Link href="/rooms" className={navClass("/rooms")}>Rooms</Link>
           <Link href="/admin/bookings" className={navClass("/admin/bookings")}>
              Booking
            </Link>
          <Link href="/premium-services" className={navClass("/premium-services")}>
         
            Premium Room Services
          </Link>
             <Link href="/discounts" className={navClass("/discounts")}>
              Discounts
            </Link>
          <Link href="/housekeeping-schedules" className={navClass("/housekeeping-schedules")}>
            Housekeeping Schedules
          </Link>

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