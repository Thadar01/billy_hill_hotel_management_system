"use client";

import UserLayout from "../components/UserLayout";

const faqs = [
  {
    question: "How can I book a room?",
    answer:
      "You can browse available rooms on the Rooms page and proceed with the booking process from there.",
  },
  {
    question: "What time is check-in and check-out?",
    answer:
      "Check-in and check-out times depend on hotel policy. Please confirm at the time of booking.",
  },
  {
    question: "Are pets allowed?",
    answer:
      "Some rooms allow pets. Please check the room details to see whether pets are permitted.",
  },
  {
    question: "Can I cancel my booking?",
    answer:
      "Cancellation availability depends on the booking terms and conditions for your selected room.",
  },
  {
    question: "How can I contact the hotel?",
    answer:
      "You can reach us through the contact information provided on the About Us page.",
  },
];

export default function QAndAPage() {
  return (
    <UserLayout>
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-black">Q&amp;A</h1>
          <p className="mt-4 text-gray-600">
            Find answers to common questions about booking, services, and your stay.
          </p>

          <div className="mt-10 space-y-4">
            {faqs.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-200 bg-zinc-50 p-6"
              >
                <h2 className="text-lg font-semibold text-black">
                  {item.question}
                </h2>
                <p className="mt-3 leading-7 text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </UserLayout>
  );
}