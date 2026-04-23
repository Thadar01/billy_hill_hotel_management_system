"use client";

import Layout from "@/app/components/Layout";
import { useRouter } from "next/navigation";
import HousekeepingScheduleForm from "../components/HouseKeepingScheduleForm";

export default function CreateHousekeepingSchedulePage() {
  const router = useRouter();
  return (
    <Layout>
      <div className="max-w-4xl mx-auto text-black">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => router.back()}
            className="text-black text-xl font-bold hover:text-gray-700 transition-colors"
            title="Back"
          >
            &#8592;
          </button>
          <h1 className="text-3xl font-bold">Create Housekeeping Schedule</h1>
        </div>
        <HousekeepingScheduleForm />
      </div>
    </Layout>
  );
}