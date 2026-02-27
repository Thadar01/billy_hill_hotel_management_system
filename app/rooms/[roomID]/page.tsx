"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, Users, Bed, Bath, Maximize, PawPrint, MapPin } from "lucide-react";
import Layout from "@/app/components/Layout";

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

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error || !room) return <div className="text-red-500 text-center">{error || "Room not found"}</div>;

  return (
    <Layout>
          <div className="container mx-auto px-4 py-8 text-black">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Rooms
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Image Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
          <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden">
            {room.images && room.images.length > 0 ? (
              <Image
                src={room.images[selectedImage]}
                alt={room.roomType}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No Image Available
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {room.images && room.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 h-24">
              {room.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative rounded-lg overflow-hidden border-2 ${
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

        {/* Room Details */}
        <div className="p-6 border-t">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Room {room.roomNumber}</h1>
              <p className="text-gray-600 text-lg">{room.roomType}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">${room.price}</p>
              <p className="text-gray-500">per night</p>
            </div>
          </div>

          <div className="mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              room.roomStatus === 'available' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {room.roomStatus}
            </span>
          </div>

          <p className="text-gray-700 mb-6">{room.description}</p>

          {/* Specifications */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <Users className="text-blue-600 mb-2" size={24} />
              <p className="text-sm text-gray-600">Capacity</p>
              <p className="font-semibold">{room.person} Guests</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <Bed className="text-blue-600 mb-2" size={24} />
              <p className="text-sm text-gray-600">Beds</p>
              <p className="font-semibold">{room.bed}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <Bath className="text-blue-600 mb-2" size={24} />
              <p className="text-sm text-gray-600">Bathrooms</p>
              <p className="font-semibold">{room.bathroom}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <Maximize className="text-blue-600 mb-2" size={24} />
              <p className="text-sm text-gray-600">Room Size</p>
              <p className="font-semibold">{room.roomSize} m²</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <MapPin className="text-blue-600 mb-2" size={24} />
              <p className="text-sm text-gray-600">Floor</p>
              <p className="font-semibold">{room.floor}</p>
            </div>
            {room.isPetAllowed && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <PawPrint className="text-blue-600 mb-2" size={24} />
                <p className="text-sm text-gray-600">Pets</p>
                <p className="font-semibold">Allowed</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link
              href={`/rooms/edit/${room.roomID}`}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
            >
              <Pencil size={20} />
              Edit Room
            </Link>
            <button
              onClick={handleDelete}
              className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700"
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