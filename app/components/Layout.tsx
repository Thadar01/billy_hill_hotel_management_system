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
  const { user, isAuthenticated, logout } = useAuthStore();

  const [roles, setRoles] = useState<Role[]>([]);

  // 🔐 Protect page
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // 🔹 Fetch roles once
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

  if (!user) return null; // prevent flash

  // 🔹 Map role_id → role name
  const roleName =
    roles.find((r) => r.role_id === user.role_id)?.role ?? "Unknown";

  // helper to style active link
  const navClass = (path: string) =>
    pathname === path
      ? "px-4 py-2 rounded bg-blue-100 text-blue-700 font-medium"
      : "px-4 py-2 rounded hover:bg-gray-100 text-black";

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen">
        {/* User info */}
        <div className="flex flex-col items-center justify-center h-28 border-b border-gray-200 px-4 text-center">
          <h1 className="text-xl font-bold text-black">
            {user.staff_name}
          </h1>
          <p className="text-sm text-gray-500">
            {roleName}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto">
          <Link href="/" className={navClass("/")}>
            Main Dashboard
          </Link>
          <Link href="/staff" className={navClass("/staff")}>
            Staffs
          </Link>
          <Link href="/roles" className={navClass("/roles")}>
            Roles
          </Link>
          <Link href="/rooms" className={navClass("/rooms")}>
            Rooms
          </Link>

          <button
            onClick={logout}
            className="mt-auto px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
