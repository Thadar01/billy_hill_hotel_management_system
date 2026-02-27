"use client";

import { useRouter } from "next/navigation";
import RoomForm from "../components/RoomForm";
import Layout from "@/app/components/Layout";

export default function AddRoomPage() {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        body: formData, // Send FormData directly, no headers needed
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create room");
      }
      
      router.push("/rooms");
      router.refresh();
    } catch (error) {
      throw error;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 text-black">
        <h1 className="text-2xl font-bold mb-6">Add New Room</h1>
        <RoomForm onSubmit={handleSubmit} />
      </div>
    </Layout>
  );
}