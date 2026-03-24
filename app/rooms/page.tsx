"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import RoomCard from "./components/RoomCard";
import Layout from "../components/Layout";

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

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms?admin=true");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roomID: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      const response = await fetch(`/api/rooms/${roomID}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      setRooms(rooms.filter((room) => room.roomID !== roomID));
    } catch (err) {
      alert("Failed to delete room");
    }
  };

  const handleStatusChange = (roomID: string, newStatus: string) => {
    setRooms(prevRooms => 
      prevRooms.map(room => 
        room.roomID === roomID 
          ? { ...room, roomStatus: newStatus }
          : room
      )
    );
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 text-black">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Rooms Management</h1>
          <Link
            href="/rooms/add"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add New Room
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard 
              key={room.roomID} 
              room={room} 
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No rooms found. Click to create one.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}