"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, CheckCircle2 } from "lucide-react";

interface FeedbackFormProps {
  customerID?: string | null;
  bookingID?: string | null;
  onSuccess?: () => void;
  onClose?: () => void;
}

const CATEGORIES = [
  "General",
  "Cleanliness",
  "Staff Service",
  "Room Comfort",
  "Facilities",
  "Dining",
];

export default function FeedbackForm({ customerID, bookingID, onSuccess, onClose }: FeedbackFormProps) {
  const [ratings, setRatings] = useState<Record<string, number>>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {})
  );
  const [hoverRatings, setHoverRatings] = useState<Record<string, number>>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {})
  );
  const [comments, setComments] = useState<Record<string, string>>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: "" }), {})
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load existing feedback for this booking
  useEffect(() => {
    if (!bookingID) return;
    const loadExisting = async () => {
      try {
        const res = await fetch(`/api/feedbacks?bookingID=${bookingID}`);
        if (!res.ok) return;
        const data = await res.json();
        const feedbacks = data.feedbacks || [];
        if (feedbacks.length > 0) {
          setIsEditing(true);
          const newRatings: Record<string, number> = { ...CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {}) };
          const newComments: Record<string, string> = { ...CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: "" }), {}) };
          for (const fb of feedbacks) {
            if (CATEGORIES.includes(fb.category)) {
              newRatings[fb.category] = fb.rating;
              newComments[fb.category] = fb.comment || "";
            }
          }
          setRatings(newRatings);
          setComments(newComments);
        }
      } catch (err) {
        console.error("Failed to load existing feedback:", err);
      }
    };
    loadExisting();
  }, [bookingID]);

  const setRating = (category: string, value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const setHoverRating = (category: string, value: number) => {
    setHoverRatings(prev => ({ ...prev, [category]: value }));
  };

  const setComment = (category: string, value: string) => {
    setComments(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if at least one rating is provided
    const hasAnyRating = Object.values(ratings).some(r => r > 0);
    if (!hasAnyRating) {
      setError("Please provide at least one rating.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Prepare batch data (only send categories that have a rating)
      const batchData = CATEGORIES.filter(cat => ratings[cat] > 0).map(cat => ({
        customerID,
        bookingID,
        rating: ratings[cat],
        category: cat,
        comment: comments[cat] || null,
      }));

      const response = await fetch("/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle2 className="text-green-600 w-10 h-10" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-black mb-2">Thank You!</h3>
        <p className="text-gray-600 mb-6">
          Your detailed feedback helps us provide a better experience for everyone.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-blue-600 font-semibold hover:underline"
        >
          Submit another feedback
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
      {/* Header - Fixed */}
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-blue-600" size={24} />
          <h2 className="text-2xl font-bold text-black">Rate Your Stay</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <span className="text-2xl">&times;</span>
          </button>
        )}
      </div>

      {/* Content - Scrollable */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <div key={cat} className="space-y-4 pb-6 border-b border-gray-50 last:border-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-gray-900">{cat}</h3>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(cat, star)}
                    onMouseEnter={() => setHoverRating(cat, star)}
                    onMouseLeave={() => setHoverRating(cat, 0)}
                    className="focus:outline-none transition-transform hover:scale-110 p-1 cursor-pointer inline-flex items-center justify-center"
                  >
                    <Star
                      size={24}
                      fill={star <= (hoverRatings[cat] || ratings[cat]) ? "#fbbf24" : "transparent"}
                      className={`${star <= (hoverRatings[cat] || ratings[cat])
                        ? "text-yellow-400"
                        : "text-gray-300"
                        } transition-colors pointer-events-none`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={comments[cat]}
              onChange={(e) => setComment(cat, e.target.value)}
              placeholder={`Additional comments about ${cat.toLowerCase()}...`}
              rows={2}
              className="w-full p-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black resize-none text-sm"
            />
          </div>
        ))}
      </form>

      {/* Footer - Fixed */}
      <div className="p-6 border-t border-gray-50 bg-gray-50/30">
        {error && (
          <p className="text-red-600 text-sm font-medium mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
        >
          {submitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Send size={18} />
              {isEditing ? "Update Feedback" : "Submit All Feedback"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
