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
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => router.push("/my-bookings")}
              className="text-black text-xl font-bold hover:text-gray-700 transition-colors"
              title="Back"
            >
              &#8592;
            </button>
            <h1 className="text-3xl font-bold">Leave Feedback</h1>
          </div>
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
