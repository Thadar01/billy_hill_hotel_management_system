"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserLayout from "../components/UserLayout";

interface Room {
  roomID: string;
  roomNumber: string;
  roomType: string;
  description: string;
  price: number;
  roomStatus: string;
  floor: number;
  roomSize: number;
  bed: number;
  person: number;
  bathroom: number;
  isPetAllowed: boolean;
  images?: string[];
}

export default function UserHomePage() {
  const router = useRouter();
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await fetch("/api/rooms?admin=true", { cache: "no-store" });
        const data = await res.json();

        const rooms = Array.isArray(data) ? data : [];

        // take final 3 rooms from database result
        setFeaturedRooms(rooms.slice(-3));
      } catch (error) {
        console.error("Failed to load rooms:", error);
      } finally {
        setLoadingRooms(false);
      }
    };

    loadRooms();
  }, []);

  return (
    <UserLayout>
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              Welcome to Billy Hill Hotel
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Book Your Perfect Stay With Comfort and Luxury
            </h1>
            <p className="mt-5 max-w-xl text-lg text-gray-200">
              Discover elegant rooms, premium services, and a relaxing experience
              designed for both business and leisure travelers.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => router.push("/user-rooms")}
                className="rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700"
              >
                Explore Rooms
              </button>
              <button
                onClick={() => router.push("/user-services")}
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-base font-semibold text-white hover:bg-white/20"
              >
                View Services
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 text-black shadow-2xl">
              <h2 className="text-2xl font-bold">Quick Booking</h2>
              <p className="mt-1 text-sm text-gray-500">
                Find your ideal room in a few clicks.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Check In</label>
                  <input
                    type="date"
                    min={today}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Check Out</label>
                  <input
                    type="date"
                    min={checkIn || today}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>


                <button
                  onClick={() => router.push(`/user-rooms?checkIn=${checkIn}&checkOut=${checkOut}`)}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Search Rooms
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-black">Why Stay With Us</h2>
          <p className="mt-3 text-gray-600">
            Experience hospitality, convenience, and premium comfort.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-black">Luxury Rooms</h3>
            <p className="mt-3 text-gray-600">
              Spacious, modern, and beautifully designed rooms for a relaxing stay.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-black">Best Services</h3>
            <p className="mt-3 text-gray-600">
              Enjoy housekeeping, premium dining, and exclusive guest services.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-black">Easy Booking</h3>
            <p className="mt-3 text-gray-600">
              Search, compare, and reserve your room quickly and easily.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-black">Featured Rooms</h2>
              <p className="mt-2 text-gray-600">
                Choose from our latest room selections.
              </p>
            </div>

            <button
              onClick={() => router.push("/user-rooms")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
            >
              View All Rooms
            </button>
          </div>

          {loadingRooms ? (
            <div className="text-gray-500">Loading rooms...</div>
          ) : featuredRooms.length === 0 ? (
            <div className="text-gray-500">No rooms found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {featuredRooms.map((room) => (
                <div
                  key={room.roomID}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-zinc-50 shadow-sm"
                >
                  {room.images && room.images.length > 0 ? (
                    <img
                      src={room.images[0]}
                      alt={room.roomType}
                      className="h-52 w-full object-cover"
                    />
                  ) : (
                    <div className="h-52 bg-gray-300" />
                  )}

                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-black">
                      {room.roomType}
                    </h3>



                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>{room.person} Guests</span>
                      <span>•</span>
                      <span>{room.bed} Bed</span>
                      <span>•</span>
                      <span>{room.bathroom} Bath</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">
                        MMK {room.price.toLocaleString()}/night
                      </span>
                      <button
                        onClick={() => router.push("/user-rooms")}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-blue-600 px-8 py-12 text-center text-white">
          <h2 className="text-3xl font-bold">Ready for your next stay?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-blue-100">
            Book now and enjoy comfort, convenience, and memorable hospitality.
          </p>
          <button
            onClick={() => router.push("/user-rooms")}
            className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-blue-600 hover:bg-gray-100"
          >
            Reserve a Room
          </button>
        </div>
      </section>
    </UserLayout>
  );
}