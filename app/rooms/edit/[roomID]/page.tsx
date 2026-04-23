"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoomForm, { RoomFormData } from "../../components/RoomForm";
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
  isBalcony:boolean;
  images: string[];
}

export default function EditRoomPage() {
  const params = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<Room | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoom();
  }, []);

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${params.roomID}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setRoom(data);
    } catch (error) {
      console.error("Error fetching room:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      const response = await fetch(`/api/rooms/${params.roomID}`, {
        method: "PUT",
        body: formData, // Send FormData directly, no headers needed
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update room");
      }
      
      router.push(`/rooms/${params.roomID}`);
      router.refresh();
    } catch (error) {
      throw error;
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 text-black">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => router.back()}
            className="text-black text-xl font-bold hover:text-gray-700 transition-colors"
            title="Back"
          >
            &#8592;
          </button>
          <h1 className="text-3xl font-semibold text-black">Edit Room</h1>
        </div>
        <RoomForm initialData={room} onSubmit={handleSubmit} />
      </div>
    </Layout>
  );
}