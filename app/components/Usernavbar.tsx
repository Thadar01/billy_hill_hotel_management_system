"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useCustomerAuthStore } from "@/store/useCustomerAuthStore";
import { Menu } from "lucide-react";

export default function UserNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { customer, isAuthenticated, logout, hasHydrated } =
    useCustomerAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);

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
    setMobileOpen(false);
  };

  if (!hasHydrated) return null;

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* LOGO */}
        <Link
          href="/user-home"
          className="text-xl sm:text-2xl font-bold text-black"
        >
          Billy Hill Hotel
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-6">
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
          <Link
            href="/privacy-policy"
            className={navClass("/privacy-policy")}
          >
            Privacy
          </Link>
          <Link href="/feedback" className={navClass("/feedback")}>
            Reviews
          </Link>
          <Link href="/q-and-a" className={navClass("/q-and-a")}>
            Q&A
          </Link>
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 text-black"
          >
            Back
          </button>

          {isAuthenticated && customer ? (
            <>
              <button
                onClick={() => router.push("/user-profile")}
                className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm hover:bg-gray-100"
              >
                <div className="font-medium text-black">
                  {customer.fullName}
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/user-login")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Sign In
            </button>
          )}

          <button
            onClick={() => router.push("/user-rooms")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Book Now
          </button>
        </div>

        {/* MOBILE BUTTON */}
        <button
          className="md:hidden p-2 z-50 text-black"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <Menu size={28} />
        </button>
      </div>

      {/* MOBILE MENU */}
      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full bg-white text-black border-t shadow-lg px-4 py-5 flex flex-col gap-4 z-50">

          <Link onClick={closeMenu} href="/user-home" className={navClass("/user-home")}>
            Home
          </Link>

          <Link onClick={closeMenu} href="/user-rooms" className={navClass("/user-rooms")}>
            Rooms
          </Link>

          <Link onClick={closeMenu} href="/my-bookings" className={navClass("/my-bookings")}>
            History
          </Link>

          <Link onClick={closeMenu} href="/user-services" className={navClass("/user-services")}>
            Services
          </Link>

          <Link onClick={closeMenu} href="/about-us" className={navClass("/about-us")}>
            About Us
          </Link>

          <Link onClick={closeMenu} href="/privacy-policy" className={navClass("/privacy-policy")}>
            Privacy
          </Link>

          <Link onClick={closeMenu} href="/feedback" className={navClass("/feedback")}>
            Reviews
          </Link>

          <Link onClick={closeMenu} href="/q-and-a" className={navClass("/q-and-a")}>
            Q&A
          </Link>

          <div className="pt-3 border-t flex flex-col gap-2">
            <button
              onClick={() => {
                router.push("/");
                closeMenu();
              }}
              className="rounded-lg px-4 py-2 text-sm text-black border-2 border-black"
            >
              Back
            </button>

            {isAuthenticated && customer ? (
              <>
                <button
                  onClick={() => {
                    router.push("/user-profile");
                    closeMenu();
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
                >
                  {customer.fullName}
                </button>

                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  router.push("/user-login");
                  closeMenu();
                }}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white"
              >
                Sign In
              </button>
            )}

            <button
              onClick={() => {
                router.push("/user-rooms");
                closeMenu();
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
            >
              Book Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
}