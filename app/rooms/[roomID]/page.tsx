"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Users,
  Bed,
  Bath,
  Maximize,
  PawPrint,
  MapPin,
} from "lucide-react";
import Layout from "@/app/components/Layout";

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

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchRoom();
  }, []);

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${params.roomID}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setRoom(data);
    } catch (err) {
      setError("Failed to load room details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      const response = await fetch(`/api/rooms/${params.roomID}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      router.push("/rooms");
    } catch (err) {
      alert("Failed to delete room");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error || !room) {
    return <div className="text-center text-red-500">{error || "Room not found"}</div>;
  }

  const hasDiscount =
    room.activeDiscount && Number(room.finalPrice) < Number(room.price);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 text-black">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to Rooms
        </button>

        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-2">
            <div className="relative h-96 overflow-hidden rounded-lg bg-gray-200">
              {room.images && room.images.length > 0 ? (
                <Image
                  src={room.images[selectedImage]}
                  alt={room.roomType}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}

            </div>

            {room.images && room.images.length > 1 && (
              <div className="grid h-24 grid-cols-4 gap-2">
                {room.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative overflow-hidden rounded-lg border-2 ${
                      selectedImage === index ? "border-blue-600" : "border-transparent"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Room view ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="mb-2 text-3xl font-bold">Room {room.roomNumber}</h1>
                <p className="text-lg text-gray-600">{room.roomType}</p>
              </div>

              <div className="text-right">
                {hasDiscount ? (
                  <>
                    <p className="text-lg text-gray-400 line-through">${room.price}</p>
                    <p className="text-3xl font-bold text-red-600">${room.finalPrice}</p>
                    <p className="text-gray-500">per night</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-blue-600">${room.price}</p>
                    <p className="text-gray-500">per night</p>
                  </>
                )}
              </div>
            </div>

            {hasDiscount && room.activeDiscount && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-red-700">
                      {room.activeDiscount.discountName}
                    </p>
                    <p className="text-sm text-red-600">
                      {room.activeDiscount.discountType === "percentage"
                        ? `${room.activeDiscount.discountValue}% off`
                        : `$${room.activeDiscount.discountValue} off`}
                    </p>
                    {room.activeDiscount.description && (
                      <p className="mt-1 text-sm text-red-500">
                        {room.activeDiscount.description}
                      </p>
                    )}
                  </div>

                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                    Discount Active
                  </span>
                </div>
              </div>
            )}

            <div className="mb-6">
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  room.roomStatus === "available"
                    ? "bg-green-100 text-green-800"
                    : room.roomStatus === "maintenance"
                    ? "bg-yellow-100 text-yellow-800"
                    : room.roomStatus === "cleaning"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {room.roomStatus}
              </span>
            </div>

            <p className="mb-6 text-gray-700">{room.description}</p>

            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <Users className="mb-2 text-blue-600" size={24} />
                <p className="text-sm text-gray-600">Capacity</p>
                <p className="font-semibold">{room.person} Guests</p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <Bed className="mb-2 text-blue-600" size={24} />
                <p className="text-sm text-gray-600">Beds</p>
                <p className="font-semibold">{room.bed}</p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <Bath className="mb-2 text-blue-600" size={24} />
                <p className="text-sm text-gray-600">Bathrooms</p>
                <p className="font-semibold">{room.bathroom}</p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <Maximize className="mb-2 text-blue-600" size={24} />
                <p className="text-sm text-gray-600">Room Size</p>
                <p className="font-semibold">{room.roomSize} m²</p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <MapPin className="mb-2 text-blue-600" size={24} />
                <p className="text-sm text-gray-600">Floor</p>
                <p className="font-semibold">{room.floor}</p>
              </div>

              {room.isPetAllowed && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <PawPrint className="mb-2 text-blue-600" size={24} />
                  <p className="text-sm text-gray-600">Pets</p>
                  <p className="font-semibold">Allowed</p>
                </div>
              )}
              {room.isBalcony && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <PawPrint className="mb-2 text-blue-600" size={24} />
                  <p className="text-sm text-gray-600">Balcony</p>
                  <p className="font-semibold">Available</p>
                </div>
              )}
              {room.isBalcony && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <PawPrint className="mb-2 text-blue-600" size={24} />
                  <p className="text-sm text-gray-600">Smoking</p>
                  <p className="font-semibold">Available</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Link
                href={`/rooms/edit/${room.roomID}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
              >
                <Pencil size={20} />
                Edit Room
              </Link>
              <button
                onClick={handleDelete}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-white hover:bg-red-700"
              >
                <Trash2 size={20} />
                Delete Room
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}