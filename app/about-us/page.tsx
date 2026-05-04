"use client";

import Image from "next/image";
import UserLayout from "../components/UserLayout";

export default function AboutUsPage() {
  return (
    <UserLayout>
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-black">About Us</h1>
            <p className="mt-4 text-lg text-gray-600">
              Welcome to Billy Hill Hotel, a place where comfort, care, and
              hospitality come together for every guest.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl shadow-sm">
              <div className="relative h-[350px] w-full bg-gray-200">
                <Image
                  src="/images/hotel-about2.jpg"
                  alt="Billy Hill Hotel building"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-3xl border border-gray-200 bg-zinc-50 p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Since 2013
              </p>
              <h2 className="mt-3 text-3xl font-bold text-black">
                Serving Guests With Care Since 2013
              </h2>
              <p className="mt-4 leading-7 text-gray-600">
                Billy Hill Hotel has proudly welcomed guests since 2013. Over the
                years, we have focused on creating a relaxing and memorable stay
                for travelers, families, and business guests.
              </p>
              <p className="mt-4 leading-7 text-gray-600">
                Our hotel combines modern comfort, quality service, and a warm
                atmosphere to ensure every visit feels special.
              </p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-black">Our Staff Welcome You</h2>
              <p className="mt-4 leading-7 text-gray-600">
                Our team is at the heart of everything we do. From reception and
                housekeeping to room service and guest support, our staff works
                together to give every guest a pleasant and smooth experience.
              </p>
              <p className="mt-4 leading-7 text-gray-600">
                We believe hospitality begins with kindness, fast service, and
                attention to detail. Every member of our team is committed to
                making guests feel safe, respected, and comfortable.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl shadow-sm">
              <div className="relative h-[320px] w-full bg-gray-200">
                <Image
                  src="/images/staff-welcome.jpeg"
                  alt="Hotel staff welcoming guests"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-16 rounded-3xl border border-gray-200 bg-zinc-50 p-8">
            <h2 className="text-3xl font-bold text-black">How Our Staff Works</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-black">Front Desk</h3>
                <p className="mt-3 leading-7 text-gray-600">
                  Our front desk team handles check-in, check-out, reservations,
                  and guest inquiries with friendly and professional support.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-black">Housekeeping</h3>
                <p className="mt-3 leading-7 text-gray-600">
                  Our housekeeping staff keeps rooms clean, fresh, and ready for
                  guests, ensuring comfort and hygiene at all times.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-black">Guest Service</h3>
                <p className="mt-3 leading-7 text-gray-600">
                  Our service team responds to guest needs, supports special
                  requests, and helps create a welcoming hotel experience.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-black">Our Mission</h2>
              <p className="mt-4 leading-7 text-gray-600">
                To provide quality accommodation, excellent service, and a warm
                hospitality experience that guests can trust every time they stay
                with us.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-black">Our Vision</h2>
              <p className="mt-4 leading-7 text-gray-600">
                To be a trusted and welcoming hotel known for comfort,
                professionalism, and memorable guest experiences.
              </p>
            </div>
          </div>

          <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-black">Contact Us</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <h3 className="font-medium text-black">Address</h3>
                <p className="mt-2 text-gray-600">
                  Billy Hill Hotel, Yangon, Myanmar
                </p>
              </div>

              <div>
                <h3 className="font-medium text-black">Email</h3>
                <p className="mt-2 text-gray-600">contact@Billy Hillhotel.com</p>
              </div>

              <div>
                <h3 className="font-medium text-black">Phone</h3>
                <p className="mt-2 text-gray-600">+95 9 123 456 789</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}