"use client";

import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { Star, MessageSquare, ChevronDown, ChevronRight } from "lucide-react";

interface FeedbackItem {
  feedbackId: number;
  customerID: string | null;
  bookingID: string | null;
  rating: number;
  category: string;
  comment: string | null;
  createdAt: string;
  customerName: string | null;
  roomNumber: string | null;
  roomType: string | null;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/feedbacks")
      .then((r) => r.json())
      .then((data) => {
        setFeedbacks(Array.isArray(data.feedbacks) ? data.feedbacks : []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Group by roomType
  const grouped = feedbacks.reduce<Record<string, FeedbackItem[]>>((acc, fb) => {
    const key = fb.roomType ? fb.roomType : "General / No Room";
    if (!acc[key]) acc[key] = [];
    acc[key].push(fb);
    return acc;
  }, {});

  const groups = Object.keys(grouped).sort();

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const calculateAverage = (items: FeedbackItem[]) => {
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => sum + item.rating, 0);
    return (total / items.length).toFixed(1);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-black flex items-center gap-3">
              <MessageSquare className="text-blue-600" />
              Customer Feedbacks
            </h1>
            <p className="text-gray-500 mt-1">Manage and review guest experiences categorized by room type.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-white border rounded-xl p-8 text-center">
            <p className="text-gray-500">No feedbacks found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const isOpen = expandedGroups[group] !== false; // Default to true
              const items = grouped[group];
              const avg = calculateAverage(items);

              return (
                <div key={group} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 border-b hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isOpen ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                      <span className="font-semibold text-lg text-black">{group}</span>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        {items.length} reviews
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <StarDisplay rating={Math.round(Number(avg))} />
                       <span className="text-sm font-bold text-black">{avg} / 5.0</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="divide-y">
                      {items.map((fb) => (
                        <div key={fb.feedbackId} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                  <span className="font-semibold text-black">{fb.customerName || "Anonymous Guest"}</span>
                                  <span className="text-xs text-gray-400">• Booking {fb.bookingID}</span>
                                  {fb.roomNumber && <span className="text-xs text-gray-400">• Room {fb.roomNumber}</span>}
                               </div>
                               <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit">
                                 {fb.category}
                               </span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                               <StarDisplay rating={fb.rating} />
                               <span className="text-xs text-gray-500">
                                 {new Date(fb.createdAt).toLocaleDateString()}
                               </span>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm mt-2 leading-relaxed italic">
                            "{fb.comment || "No comment provided."}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
