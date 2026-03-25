"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCustomerAuthStore } from "@/store/useCustomerAuthStore";

export default function UserNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { customer, isAuthenticated, logout, hasHydrated } = useCustomerAuthStore();

  const navClass = (path: string) =>
    pathname === path
      ? "font-semibold text-blue-600"
      : "text-gray-700 hover:text-blue-600";

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    logout();
    alert("Logged out successfully.");
    router.push("/user-home");
  };

  if (!hasHydrated) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/user-home" className="text-2xl font-bold text-black">
          Billy Hill Hotel
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/user-home" className={navClass("/user-home")}>
            Home
          </Link>
          <Link href="/user-rooms" className={navClass("/user-rooms")}>
            Rooms
          </Link>
          <Link href="/my-bookings" className={navClass("/my-bookings")}>
            History
          </Link>
          <Link href="/user-services" className={navClass("/user-services")}>
            Services
          </Link>
          <Link href="/about-us" className={navClass("/about-us")}>
            About Us
          </Link>
          <Link href="/privacy-policy" className={navClass("/privacy-policy")}>
            Privacy Policy
          </Link>
          <Link href="/q-and-a" className={navClass("/q-and-a")}>
            Q&amp;A
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
          >
            Back
          </button>

          {isAuthenticated && customer ? (
            <>
              <button
                onClick={() => router.push("/user-profile")}
                className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                <div className="font-medium text-black">{customer.fullName}</div>

              </button>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/user-login")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign In
            </button>
          )}

          <button
            onClick={() => router.push("/user-rooms")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Book Now
          </button>
        </div>
      </div>
    </header>
  );
}