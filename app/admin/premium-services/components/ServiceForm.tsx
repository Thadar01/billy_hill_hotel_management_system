"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

interface ServiceFormData {
  serviceName: string;
  description: string;
  price: number | string;
}

interface ServiceFormProps {
  initialData?: ServiceFormData & { premiumServiceId?: number };
  onSubmit: (data: ServiceFormData) => Promise<void>;
}

export default function ServiceForm({ initialData, onSubmit }: ServiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    serviceName: initialData?.serviceName || "",
    description: initialData?.description || "",
    price: initialData?.price || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate
    if (!formData.serviceName.trim()) {
      setError("Service name is required");
      setLoading(false);
      return;
    }
    if (!formData.price || parseFloat(formData.price as string) <= 0) {
      setError("Valid price is required");
      setLoading(false);
      return;
    }

    try {
      await onSubmit({
        serviceName: formData.serviceName.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price as string),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto text-black">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">
          {initialData ? "Edit Service" : "Add New Service"}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Name *
            </label>
            <input
              type="text"
              name="serviceName"
              required
              value={formData.serviceName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Spa Treatment"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (MMK) *
            </label>
            <input
              type="number"
              name="price"
              required
              min="0"
              step="1"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the service, benefits, duration, etc."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            <Save size={20} />
            {loading ? "Saving..." : initialData ? "Update Service" : "Create Service"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}