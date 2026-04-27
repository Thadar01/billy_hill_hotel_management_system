"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 text-sm text-gray-600 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h3 className="text-lg font-bold text-black">Billy Hill Hotel</h3>
          <p className="mt-3 leading-6">
            Experience comfort, elegance, and premium hospitality for every stay.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-black">Quick Links</h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/user-home" className="hover:text-blue-600">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about-us" className="hover:text-blue-600">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-blue-600">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/q-and-a" className="hover:text-blue-600">
                Q&amp;A
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-black">Contact</h4>
          <div className="mt-3 space-y-2">
            <p>Billy Hill Hotel, Yangon</p>
            <p>Email: contact@billyhillhotel.com</p>
            <p>Phone: +95 9 123 456 789</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-4 text-center text-xs text-gray-500">
        © 2026 BillyHill Hotel. All rights reserved.
      </div>
    </footer>
  );
}