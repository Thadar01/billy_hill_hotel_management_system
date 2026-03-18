"use client";

import UserLayout from "../components/UserLayout";

export default function PrivacyPolicyPage() {
  return (
    <UserLayout>
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-black">Privacy Policy</h1>
          <p className="mt-4 text-gray-600">
            Your privacy matters to us. This page explains how RoyalStay Hotel
            collects, uses, and protects your personal information.
          </p>

          <div className="mt-10 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-black">
                Information We Collect
              </h2>
              <p className="mt-3 leading-7 text-gray-600">
                We may collect personal details such as your name, contact
                information, booking details, and payment-related information
                when you use our services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-black">
                How We Use Information
              </h2>
              <p className="mt-3 leading-7 text-gray-600">
                We use your information to process bookings, improve guest
                experiences, respond to inquiries, and provide hotel-related
                services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-black">
                Data Protection
              </h2>
              <p className="mt-3 leading-7 text-gray-600">
                We take reasonable security measures to protect your data from
                unauthorized access, disclosure, or misuse.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-black">Your Rights</h2>
              <p className="mt-3 leading-7 text-gray-600">
                You may request access to your personal information or ask us to
                update or remove it where applicable.
              </p>
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}