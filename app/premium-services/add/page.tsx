"use client";

import { useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";
import ServiceForm from "../components/ServiceForm";

// Define the type that matches ServiceFormData
interface ServiceFormData {
  serviceName: string;
  description: string;
  price: number | string; // Match the type from ServiceForm
}

export default function AddServicePage() {
  const router = useRouter();

  const handleSubmit = async (data: ServiceFormData) => {
    try {
      // Convert price to number before sending to API
      const payload = {
        serviceName: data.serviceName,
        description: data.description,
        price: typeof data.price === 'string' ? parseFloat(data.price) : data.price
      };

      const response = await fetch("/api/premium-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create service");
      }

      router.push("/premium-services");
      router.refresh();
    } catch (error) {
      throw error;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <ServiceForm onSubmit={handleSubmit} />
      </div>
    </Layout>
  );
}