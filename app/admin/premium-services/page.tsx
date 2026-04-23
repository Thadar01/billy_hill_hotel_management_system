"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, DollarSign } from "lucide-react";
import Layout from "@/app/components/Layout";
import { useAuthStore } from "@/store/useAuthStore";

interface PremiumService {
  premiumServiceId: number;
  serviceName: string;
  description: string;
  price: number;
}

export default function PremiumServicesPage() {
  interface Role {
    role_id: number;
    role: string;
  }
  const [services, setServices] = useState<PremiumService[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [filteredServices, setFilteredServices] = useState<PremiumService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuthStore();

  const roleName = roles.find((r) => r.role_id === user?.role_id)?.role ?? "Unknown";
  const normalizedRole = roleName.toLowerCase();
  const isManager = ["general manager"].includes(normalizedRole);
  useEffect(() => {
    fetchServices();
  }, []);
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch("/api/roles");
        const data = await res.json();
        setRoles(data.roles || []);
      } catch (err) {
        console.error("Failed to fetch roles", err);
      }
    };
    fetchRoles();
  }, []);
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(service =>
        service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredServices(filtered);
    }
  }, [searchTerm, services]);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/premium-services");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setServices(data);
      setFilteredServices(data);
    } catch (err) {
      setError("Failed to load premium services");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await fetch(`/api/premium-services/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      setServices(services.filter(service => service.premiumServiceId !== id));
    } catch (err) {
      alert("Failed to delete service");
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 text-black">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Premium Services</h1>
          <div className="flex gap-4">
            <Link
              href="/admin/reports/services"
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm text-sm font-semibold"
            >
              Analyze Performance
            </Link>
            {isManager && <Link
              href="/admin/premium-services/add"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add New Service
            </Link>}
          </div>

        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search services by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              {searchTerm ? "No services match your search" : "No premium services found"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.premiumServiceId}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold">{service.serviceName}</h3>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <DollarSign size={14} />
                      {service.price}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {service.description || "No description available"}
                  </p>
                  {isManager && <div className="flex gap-2 mt-4">
                    <Link
                      href={`/admin/premium-services/edit/${service.premiumServiceId}`}
                      className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-200 transition-colors"
                    >
                      <Edit size={16} />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(service.premiumServiceId)}
                      className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>}


                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}