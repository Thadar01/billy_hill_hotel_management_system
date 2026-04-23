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
      <div className="max-w-4xl mx-auto px-4 py-8 text-black">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => router.push("/rooms")}
            className="text-black text-xl font-bold hover:text-gray-700 transition-colors"
            title="Back"
          >
            &#8592;
          </button>
          <h1 className="text-3xl font-semibold text-black">Add New Room</h1>
        </div>
        <RoomForm onSubmit={handleSubmit} />
      </div>
    </Layout>
  );
}