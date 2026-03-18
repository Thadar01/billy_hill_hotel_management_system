"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <h1 className="text-center text-3xl font-bold text-black">
          Welcome
        </h1>
        <p className="mt-2 text-center text-gray-600">
          Please choose how you want to continue.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push("/user-home")}
            className="rounded-xl border border-gray-300 bg-white px-6 py-8 text-lg font-medium text-black hover:bg-gray-50"
          >
            User
          </button>

          <button
            onClick={() => router.push("/staff-dashboard")}
            className="rounded-xl bg-blue-600 px-6 py-8 text-lg font-medium text-white hover:bg-blue-700"
          >
            Staff
          </button>
        </div>
      </div>
    </div>
  );
}