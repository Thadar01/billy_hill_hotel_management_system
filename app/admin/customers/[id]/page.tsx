"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Layout from "@/app/components/Layout";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Star,
  ShoppingBag,
  MessageSquare,
  BadgeCheck,
  CreditCard,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Customer {
  customerID: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  points: number;
}

interface Booking {
  bookingID: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  createdAt: string;
}

interface Feedback {
  feedbackId: number;
  rating: number;
  category: string;
  comment: string;
  createdAt: string;
  roomNumbers?: string;
}

interface Preference {
  id: number;
  preferenceKey: string;
  preferenceValue: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-4 h-4"
          fill={star <= rating ? "#fbbf24" : "transparent"}
          stroke={star <= rating ? "#fbbf24" : "#d1d5db"}
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
          />
        </svg>
      ))}
    </div>
  );
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch customer data");

      setCustomer(data.customer);
      setBookings(data.bookings || []);
      setFeedbacks(data.feedbacks || []);
      setPreferences(data.preferences || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "accepted":
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) return <Layout><div className="p-8 text-center text-black">Loading guest profile...</div></Layout>;
  if (error || !customer) return <Layout><div className="p-8 text-center text-red-500">{error || "Customer not found"}</div></Layout>;

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto text-black">
        {/* Breadcrumb / Back */}
        <Link href="/admin/customers" className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors w-fit">
          <ArrowLeft size={18} />
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{customer.fullName}</h1>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <BadgeCheck size={14} />
                    Loyal Guest
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-gray-500 text-sm">
                <div className="flex items-center gap-2"><Mail size={16} /> {customer.email}</div>
                <div className="flex items-center gap-2"><Phone size={16} /> {customer.phone}</div>
                <div className="flex items-center gap-2"><Calendar size={16} /> Joined {new Date(customer.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 min-w-[180px] text-center">
              <div className="flex justify-center mb-1">
                <Star className="text-amber-500 fill-amber-500" size={24} />
              </div>
              <div className="text-3xl font-black text-amber-600">{customer.points}</div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">Points Balance</div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
              <ShoppingBag size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{bookings.length}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Bookings</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
              <CreditCard size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">MMK {bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0).toLocaleString()}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Spent</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
              <MessageSquare size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{feedbacks.length}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Feedbacks Given</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking History */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="text-blue-600" />
              Booking History
            </h2>

            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center text-gray-400 italic">
                  No booking history found for this guest.
                </div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.bookingID} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="font-bold text-lg mb-1">#{booking.bookingID}</div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {booking.checkInDate}</span>
                        <span>→</span>
                        <span>{booking.checkOutDate}</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="font-bold text-blue-600 text-lg">MMK {Number(booking.totalAmount).toLocaleString()}</div>
                      <div className="flex gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge(booking.bookingStatus)}`}>
                          {booking.bookingStatus}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge(booking.paymentStatus)}`}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


          {/* Right Column: Feedbacks & Preferences */}
          <div className="space-y-8">
            {/* Preferences Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="text-blue-600" />
                Guest Preferences
              </h2>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                {preferences.length === 0 ? (
                  <p className="text-gray-400 italic text-center py-4">No specific preferences recorded.</p>
                ) : (
                  <div className="space-y-4">
                    {preferences.map((pref) => (
                      <div key={pref.id} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">{pref.preferenceKey}</span>
                        <span className="text-sm font-semibold text-gray-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">{pref.preferenceValue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Feedback Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="text-blue-600" />
                Recent Feedbacks
              </h2>

              <div className="space-y-4 text-black">
                {feedbacks.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center text-gray-400 italic">
                    No feedbacks from this guest.
                  </div>
                ) : (
                  feedbacks.map((f) => (
                    <div key={f.feedbackId} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <StarDisplay rating={f.rating} />
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit uppercase tracking-widest mt-1 inline-block border border-blue-100">
                            {f.category || "N/A"}
                          </span>
                          {f.roomNumbers && (
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-1 ml-1">
                              <span>Room: {f.roomNumbers}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(f.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 italic">"{f.comment}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
