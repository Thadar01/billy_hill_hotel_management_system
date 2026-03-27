"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import UserLayout from "../../components/UserLayout";
import FeedbackForm from "../../components/FeedbackForm";
import { useCustomerAuthStore } from "@/store/useCustomerAuthStore";
import { ArrowLeft } from "lucide-react";

export default function FeedbackPage({ params }: { params: Promise<{ bookingID: string }> }) {
  const { bookingID } = use(params);
  const router = useRouter();
  const { customer } = useCustomerAuthStore();

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto px-4 py-10 text-black">
        <button
          onClick={() => router.push("/my-bookings")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to My Bookings
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Leave Feedback</h1>
          <p className="text-gray-600 mt-1">Booking #{bookingID}</p>
        </div>

        <FeedbackForm
          customerID={customer?.customerID}
          bookingID={bookingID}
          onSuccess={() => {
            setTimeout(() => router.push("/my-bookings"), 2000);
          }}
        />
      </div>
    </UserLayout>
  );
}
