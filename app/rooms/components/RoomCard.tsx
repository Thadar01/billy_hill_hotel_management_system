"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  Eye,
  Users,
  Bed,
  Bath,
  Maximize,
  PawPrint,
  Check,
  X,
  Clock,
  Wrench,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

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

interface RoomCardProps {
  room: Room;
  onDelete: (roomID: string) => void;
  onStatusChange?: (roomID: string, newStatus: string) => void;
}

export default function RoomCard({
  room,
  onDelete,
  onStatusChange,
}: RoomCardProps) {
  interface Role {
    role_id: number;
    role: string;
  }
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const { user } = useAuthStore();

  const roleName = roles.find((r) => r.role_id === user?.role_id)?.role ?? "Unknown";
  const normalizedRole = roleName.toLowerCase();
  const isStaff = ["staff manager", "housekeeping", "receptionist"].includes(normalizedRole);


  const statusConfig = {
    available: {
      color: "bg-green-100 text-green-800",
      icon: Check,
      label: "Available",
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      hoverColor: "hover:bg-green-200",
    },
    occupied: {
      color: "bg-red-100 text-red-800",
      icon: X,
      label: "Occupied",
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      hoverColor: "hover:bg-red-200",
    },
    maintenance: {
      color: "bg-yellow-100 text-yellow-800",
      icon: Wrench,
      label: "Maintenance",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      hoverColor: "hover:bg-yellow-200",
    },
    cleaning: {
      color: "bg-blue-100 text-blue-800",
      icon: Sparkles,
      label: "Cleaning",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      hoverColor: "hover:bg-blue-200",
    },
    "check-out": {
      color: "bg-purple-100 text-purple-800",
      icon: Clock,
      label: "Checked Out",
      bgColor: "bg-purple-100",
      textColor: "text-purple-800",
      hoverColor: "hover:bg-purple-200",
    },
  };

  const config =
    statusConfig[room.roomStatus as keyof typeof statusConfig] ||
    statusConfig.available;
  const Icon = config.icon;

  const hasDiscount =
    room.activeDiscount && Number(room.finalPrice) < Number(room.price);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === room.roomStatus) {
      setShowDropdown(false);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/rooms/${room.roomID}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      if (onStatusChange) {
        onStatusChange(room.roomID, newStatus);
      }
      setShowDropdown(false);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update room status");
    } finally {
      setIsUpdating(false);
    }
  };
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


  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-white shadow-lg transition-shadow hover:shadow-xl">
      {/* Image Gallery */}
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


        {/* Status Badge with Dropdown */}
        {/* Status Badge / Dropdown */}
        <div className="absolute top-2 right-2 z-10">
          <div className="relative">

            {/* 👇 ONLY MANAGER CAN SEE DROPDOWN */}
            {isStaff ? (
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isUpdating}
                className={`${config.color} flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-opacity hover:opacity-80`}
              >
                <Icon size={14} />
                {config.label}

                {isUpdating ? (
                  <Clock size={14} className="ml-1 animate-spin" />
                ) : (
                  <ChevronDown size={14} className="ml-1" />
                )}
              </button>
            ) : (
              // 👇 NON-MANAGER: JUST STATUS (NO CLICK)
              <div
                className={`${config.color} flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm`}
              >
                <Icon size={14} />
                {config.label}
              </div>
            )}

            {/* 👇 DROPDOWN ONLY FOR MANAGER */}
            {isStaff && showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 z-30 mt-2 w-48 rounded-lg border bg-white py-1 shadow-xl">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm ${key === room.roomStatus
                        ? config.bgColor + " " + config.textColor
                        : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <config.icon size={16} className={config.textColor} />
                      <span className="flex-1">{config.label}</span>
                      {key === room.roomStatus && (
                        <Check size={16} className="text-green-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Room Details */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Room {room.roomNumber}</h3>
            <p className="text-sm text-gray-600">{room.roomType}</p>
          </div>

          <div className="text-right">
            {hasDiscount ? (
              <>
                <p className="text-sm text-gray-400 line-through">
                  MMK {Math.floor(Number(room.price))}/night
                </p>
                <p className="text-xl font-bold text-red-600">
                  MMK {Math.floor(Number(room.finalPrice))}/night
                </p>
              </>
            ) : (
              <p className="text-xl font-bold text-blue-600">
                MMK {Math.floor(Number(room.price))}/night
              </p>
            )}
          </div>
        </div>

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

        <p className="mb-3 line-clamp-2 text-sm text-gray-600">
          {room.description}
        </p>

        {/* Amenities */}
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
          <div className="flex items-center gap-1 text-gray-600">
            <Maximize size={16} />
            <span>{room.roomSize} m²</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <span>Floor {room.floor}</span>
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
              <span>Is Balcony</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-4">
          <Link
            href={`/rooms/${room.roomID}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-200"
          >
            <Eye size={16} />
            View
          </Link>
          <Link
            href={`/rooms/edit/${room.roomID}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-blue-700 transition-colors hover:bg-blue-200"
          >
            <Pencil size={16} />
            Edit
          </Link>
          <button
            onClick={() => onDelete(room.roomID)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-red-700 transition-colors hover:bg-red-200"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}