"use client";

import { useEffect, useState } from "react";
import UserLayout from "../components/UserLayout";
import { Star, MessageSquare } from "lucide-react";

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

export default function FeedbackReviewsPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/feedbacks")
      .then((r) => r.json())
      .then((data) => {
        setFeedbacks(Array.isArray(data.feedbacks) ? data.feedbacks : []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Group by roomType (fall back to "General / No Room")
  const grouped = feedbacks.reduce<Record<string, FeedbackItem[]>>((acc, fb) => {
    const key = fb.roomType ? fb.roomType : "General / No Room";
    if (!acc[key]) acc[key] = [];
    acc[key].push(fb);
    return acc;
  }, {});

  const groups = Object.keys(grouped).sort();

  // Average rating per group
  const avgRating = (items: FeedbackItem[]) => {
    const total = items.reduce((sum, fb) => sum + fb.rating, 0);
    return (total / items.length).toFixed(1);
  };

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto px-4 py-10 text-black">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <MessageSquare className="text-blue-600 w-8 h-8" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">Guest Reviews</h1>
          <p className="text-gray-500 mt-2 text-lg">
            See what our guests say about their experience
          </p>
        </div>

        {loading && (
          <div className="text-center py-20 text-gray-500">Loading reviews...</div>
        )}

        {!loading && feedbacks.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No reviews have been submitted yet. Be the first to share your experience!
          </div>
        )}

        {!loading && groups.length > 0 && (
          <>
            {/* Room type tabs */}
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              <button
                onClick={() => setActiveGroup(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeGroup === null
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({feedbacks.length})
              </button>
              {groups.map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeGroup === g
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {g} ({grouped[g].length}) ★ {avgRating(grouped[g])}
                </button>
              ))}
            </div>

            {/* Review grid */}
            <div className="space-y-10">
              {(activeGroup ? [activeGroup] : groups).map((roomType) => (
                <div key={roomType}>
                  {/* Group Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 border-t border-gray-200" />
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-full">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold text-sm">
                        {roomType}
                      </span>
                      <span className="text-gray-400 text-xs">
                        • {grouped[roomType].length} review{grouped[roomType].length !== 1 ? "s" : ""} • avg {avgRating(grouped[roomType])} / 5
                      </span>
                    </div>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>

                  {/* Cards grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {grouped[roomType].map((fb) => (
                      <div
                        key={fb.feedbackId}
                        className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 flex flex-col gap-3"
                      >
                        {/* Category badge + stars */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                            {fb.category}
                          </span>
                          <div className="flex items-center gap-1">
                            <StarDisplay rating={fb.rating} />
                            <span className="text-xs text-gray-500 ml-1">{fb.rating}/5</span>
                          </div>
                        </div>

                        {/* Comment */}
                        {fb.comment ? (
                          <p className="text-sm text-gray-700 flex-1">"{fb.comment}"</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic flex-1">No comment provided.</p>
                        )}

                        {/* Footer */}
                        <div className="border-t border-gray-50 pt-3 flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {fb.customerName || "Anonymous"}
                            {fb.roomNumber && (
                              <span className="ml-1 text-gray-400">• Room {fb.roomNumber}</span>
                            )}
                          </span>
                          <span>
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </UserLayout>
  );
}
