"use client";

import { useEffect, useState } from "react";
import UserLayout from "../components/UserLayout";
import { Search, Sparkles } from "lucide-react";
interface PremiumService {
  premiumServiceId: number;
  serviceName: string;
  description: string;
  price: number;
}

export default function UserServicesPage() {
  const [services, setServices] = useState<PremiumService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/premium-services");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setServices(data);
    } catch (err) {
      console.error("Failed to load premium services", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service =>
    service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <UserLayout>
      <div className="min-h-screen bg-zinc-50 pb-20">
        {/* Hero Section */}
        <div className="relative h-64 bg-black overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-40">
            <img
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2000"
              alt="Luxury Hotel Service"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Premium Experiences</h1>
            <p className="text-gray-200 text-lg max-w-2xl mx-auto">Enhance your stay with our curated selection of luxury services and amenities.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 relative z-10 pt-10">
          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-16 border border-gray-100 max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for something special..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-black placeholder:text-gray-400 text-lg transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-3">
              {filteredServices.map((service) => (
                <div
                  key={service.premiumServiceId}
                  className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div className="p-8 flex-1 text-center">
                    <h3 className="text-2xl font-bold text-black mb-4 group-hover:text-blue-600 transition-colors">
                      {service.serviceName}
                    </h3>

                    <p className="text-gray-600 leading-relaxed text-sm">
                      {service.description || "Indulge in our exquisite offering designed to make your stay memorable."}
                    </p>
                  </div>

                  <div className="px-8 py-8 border-t border-gray-50 bg-gray-50/50 flex flex-col items-center">
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Investment</span>
                    <span className="text-3xl font-bold text-black font-serif">
                      ${Number(service.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredServices.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <Sparkles className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Matching Services</h3>
              <p className="text-gray-500">We couldn't find any services matching your current search.</p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-6 text-blue-600 font-semibold hover:underline"
              >
                Clear search terms
              </button>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
