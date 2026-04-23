"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Users, Bed, Bath, PawPrint, Check, X, Wrench, Sparkles } from "lucide-react";

interface ActiveDiscount {
  discountID: number;
  discountName: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}
interface Room {
  roomID: string;
  roomNumber: string;
  roomType: string;
  description: string;
  price: number;
  finalPrice: number;
  roomStatus: string;
  floor: number;
  roomSize: number;
  bed: number;
  person: number;
  bathroom: number;
  isPetAllowed: boolean;
  isBalcony: boolean;
  images: string[];
  activeDiscount: ActiveDiscount | null;
}

interface UserRoomCardProps {
  room: Room;
  checkIn?: string;
  checkOut?: string;
}

export default function UserRoomCard({ room, checkIn, checkOut }: UserRoomCardProps) {


  const hasDiscount =
    room.activeDiscount && Number(room.finalPrice) < Number(room.price);

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-lg transition-shadow hover:shadow-xl">
      <div className="relative h-48 bg-gray-200">
        {room.images && room.images.length > 0 ? (
          <Image
            src={room.images[0]}
            alt={room.roomType}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No Image
          </div>
        )}


      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Room {room.roomNumber}</h3>
            <p className="text-sm text-gray-600">{room.roomType}</p>
          </div>
          <div className="text-right">
            {hasDiscount ? (
              <>
                <p className="text-sm text-gray-400 line-through">
                  MMK {room.price}/night
                </p>
                <p className="text-xl font-bold text-red-600">
                  MMK {room.finalPrice}/night
                </p>
              </>
            ) : (
              <p className="text-xl font-bold text-blue-600">
                MMK {room.price}/night
              </p>
            )}
          </div>        </div>
        {hasDiscount && room.activeDiscount && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-red-700">
                  {room.activeDiscount.discountName}
                </p>
                <p className="text-xs text-red-600">
                  {room.activeDiscount.discountType === "percentage"
                    ? `${room.activeDiscount.discountValue}% off`
                    : `MMK ${room.activeDiscount.discountValue} off`}
                </p>
                {room.activeDiscount.description && (
                  <p className="mt-1 text-xs text-red-500">
                    {room.activeDiscount.description}
                  </p>
                )}
              </div>

              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                Discount Active
              </span>
            </div>
          </div>
        )}

        <p className="mb-3 line-clamp-2 text-sm text-gray-600">{room.description}</p>

        <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Users size={16} />
            <span>{room.person} Guests</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Bed size={16} />
            <span>{room.bed} Bed</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Bath size={16} />
            <span>{room.bathroom} Bath</span>
          </div>

          {room.isPetAllowed && (
            <div className="flex items-center gap-1 text-gray-600">
              <PawPrint size={16} />
              <span>Pets Allowed</span>
            </div>
          )}


          {room.isBalcony && (
            <div className="flex items-center gap-1 text-gray-600">
              <PawPrint size={16} />
              <span>Balcony Allow</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/user-rooms/${room.roomID}${checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ""}`}
            className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <Eye size={16} />
            View Details
          </Link>

          <Link
            href={`/booking?roomID=${room.roomID}${checkIn && checkOut ? `&checkIn=${checkIn}&checkOut=${checkOut}` : ""}`}
            className="inline-block bg-black text-white px-4 py-2 rounded-lg"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}