"use client";

import { Settings, Menu, X, LogOut } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);

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
  const isGM =
    normalizedRole === "general manager" ||
    normalizedRole === "administrator";

  const ROLE_PERMISSIONS: Record<string, string[]> = {
    receptionist: [
      "/rooms",
      "/admin/premium-services",
      "/admin/bookings",
      "/schedules",
      "/admin/feedbacks",
      "/admin/customers",
    ],
    "staff manager": [
      "/schedules",
      "/rooms",
      "/housekeeping-schedules",
      "/admin/feedbacks",
      "/admin/customers",
      "/admin/staff/reports",
      "/admin/reports/services",
    ],
    housekeeping: ["/rooms", "/schedules", "/housekeeping-schedules"],
    "finance manager": [
      "/payroll",
      "/admin/refunds",
      "/admin/bookings",
      "/schedules",
      "/admin/staff/reports",
      "/admin/reports/services",
    ],
    "finance staff": [
      "/payroll",
      "/admin/refunds",
      "/admin/bookings",
      "/schedules",
      "/admin/staff/reports",
      "/admin/reports/services",
    ],
  };

  const navClass = (path: string) =>
    pathname === path
      ? "px-4 py-2 rounded bg-blue-100 text-blue-700 font-medium"
      : "px-4 py-2 rounded hover:bg-gray-100 text-black";

  const renderLink = (href: string, label: string) => {
    if (isGM || href === "/staff-dashboard" || href === "/staff/settings") {
      return (
        <Link href={href} className={navClass(href)}>
          {label}
        </Link>
      );
    }

    const allowedPaths = ROLE_PERMISSIONS[normalizedRole] || [];
    if (allowedPaths.includes(href)) {
      return (
        <Link href={href} className={navClass(href)}>
          {label}
        </Link>
      );
    }
    return null;
  };

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full bg-white z-50">
      {/* 🏷️ Branding & Role Section */}
      <div className="px-6 py-6 border-b border-gray-100 bg-white flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-black tracking-tight mb-1 mt-2">{user.staff_name}</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
              {roleName} Portal
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 mt-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all active:scale-90"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 flex flex-col p-4 gap-1.5 overflow-y-auto bg-white scrollbar-thin">
        <div className="flex flex-col gap-1" onClick={() => onClose?.()}>
          {renderLink("/staff-dashboard", "Main Dashboard")}
          {renderLink("/staff", "Staffs")}
          {renderLink("/schedules", "Schedules")}
          {renderLink("/payroll", "Payroll")}
          {renderLink("/rooms", "Rooms")}
          {renderLink("/admin/bookings", "Booking")}
          {renderLink("/admin/refunds", "Refunds")}
          {renderLink("/admin/premium-services", "Premium Room Services")}
          {renderLink("/discounts", "Discounts")}
          {renderLink("/housekeeping-schedules", "Housekeeping Schedules")}
          {renderLink("/admin/feedbacks", "Feedbacks")}
          {renderLink("/admin/customers", "Customers")}
        </div>


      </nav>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans w-full overflow-x-hidden">

      {/* 🚀 Unified Sidebar Drawer (Accessible on all screen sizes via toggle) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          {/* Sidebar */}
          <aside className="relative flex w-72 max-w-[85vw] flex-col bg-white h-screen shadow-2xl animate-in slide-in-from-left duration-300 z-50">
            <SidebarContent onClose={() => setIsOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-screen w-full">
        {/* 📱 Global Navigation Bar (Common for all screen sizes) */}
        <header className="flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 sticky top-0 z-30 w-full shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors active:scale-90"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col justify-center gap-1 mt-0.5">
              <span className="font-bold text-lg text-black leading-none">{user.staff_name}</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none">{roleName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs font-bold text-gray-400 uppercase tracking-widest mr-3">
              Hotel Admin
            </span>
            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
              <Link
                href="/staff/settings"
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title="Profile Settings"
              >
                <Settings size={20} className="text-gray-500 hover:text-black transition-colors" />
              </Link>
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* 📄 Main Content area */}
        <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden w-full">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
