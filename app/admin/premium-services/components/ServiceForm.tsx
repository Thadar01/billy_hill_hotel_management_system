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
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [formData, setFormData] = useState({
    serviceName: initialData?.serviceName || "",
    description: initialData?.description || "",
    price: initialData?.price ? Math.floor(Number(initialData.price)) : "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    // Validate
    if (!formData.serviceName.trim() || !formData.price || parseFloat(formData.price as string) <= 0) {
      alert("Please Fill all the required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSubmit({
        serviceName: formData.serviceName.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price as string),
      });
      router.push("/admin/premium-services");
    } catch (err: any) {
      setError(err.message || "Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto text-black">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="text-gray-600" size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            {initialData ? "Edit Premium Service" : "Add New Premium Service"}
          </h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2">
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Service Name */}
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && !formData.serviceName.trim() ? "text-red-500" : "text-gray-500 text-sm"}`}>
              Service Name <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="text"
              name="serviceName"
              value={formData.serviceName}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !formData.serviceName.trim() ? "border-red-500 bg-red-50" : "border-gray-200"}`}
              placeholder="e.g., Airport Transfer"
            />
          </div>

          {/* Price */}
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && (!formData.price || parseFloat(formData.price as string) <= 0) ? "text-red-500" : "text-gray-500 text-sm"}`}>
              Price (MMK) <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="number"
              name="price"
              min="0"
              step="1"
              value={formData.price}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && (!formData.price || parseFloat(formData.price as string) <= 0) ? "border-red-500 bg-red-50" : "border-gray-200"}`}
              placeholder="0"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold uppercase tracking-wider mb-2 text-gray-500 text-sm">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black"
              placeholder="Briefly describe the service..."
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg transition-all flex items-center justify-center gap-2"
          >
            
            {loading ? "Saving..." : initialData ? "Update Service" : "Create Service"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}