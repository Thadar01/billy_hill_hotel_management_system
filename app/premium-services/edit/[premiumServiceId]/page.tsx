"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";
import ServiceForm from "../../components/ServiceForm";

interface Service {
  premiumServiceId: number;
  serviceName: string;
  description: string;
  price: number;
}

// Define the type that matches ServiceFormData
interface ServiceFormData {
  serviceName: string;
  description: string;
  price: number | string;
}

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchService();
  }, []);

  const fetchService = async () => {
    try {
      const response = await fetch(`/api/premium-services/${params.premiumServiceId}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setService(data);
    } catch (err) {
      setError("Failed to load service");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ServiceFormData) => {
    try {
      // Convert price to number before sending to API
      const payload = {
        serviceName: data.serviceName,
        description: data.description,
        price: typeof data.price === 'string' ? parseFloat(data.price) : data.price
      };

      const response = await fetch(`/api/premium-services/${params.premiumServiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update service");
      }

      router.push("/premium-services");
      router.refresh();
    } catch (error) {
      throw error;
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!service) return <div className="text-center">Service not found</div>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <ServiceForm initialData={service} onSubmit={handleSubmit} />
      </div>
    </Layout>
  );
}