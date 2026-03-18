"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import RoomCard from "../rooms/components/RoomCard";
import UserLayout from "../components/UserLayout";
import UserRoomCard from "../rooms/components/UserRoomCard";

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

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
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
    <UserLayout>
      <div className="container mx-auto px-4 py-8 text-black">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Rooms</h1>
       
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <UserRoomCard
              key={room.roomID} 
              room={room} 
            />
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No rooms found. Click to create one.</p>
          </div>
        )}
      </div>
    </UserLayout>
  );
}