"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Users, Bed, Bath, PawPrint, Check, X, Wrench, Sparkles } from "lucide-react";

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
  images: string[];
}

interface UserRoomCardProps {
  room: Room;
}

export default function UserRoomCard({ room }: UserRoomCardProps) {
  const statusConfig = {
    available: {
      color: "bg-green-100 text-green-800",
      icon: Check,
      label: "Available",
    },
    occupied: {
      color: "bg-red-100 text-red-800",
      icon: X,
      label: "Occupied",
    },
    maintenance: {
      color: "bg-yellow-100 text-yellow-800",
      icon: Wrench,
      label: "Maintenance",
    },
    cleaning: {
      color: "bg-blue-100 text-blue-800",
      icon: Sparkles,
      label: "Cleaning",
    },
  };

  const config =
    statusConfig[room.roomStatus as keyof typeof statusConfig] || statusConfig.available;

  const Icon = config.icon;

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

        <div className="absolute top-2 right-2 z-10">
          <span
            className={`${config.color} flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm`}
          >
            <Icon size={14} />
            {config.label}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Room {room.roomNumber}</h3>
            <p className="text-sm text-gray-600">{room.roomType}</p>
          </div>
          <p className="text-xl font-bold text-blue-600">${room.price}/night</p>
        </div>

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
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/user-rooms/${room.roomID}`}
            className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <Eye size={16} />
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}