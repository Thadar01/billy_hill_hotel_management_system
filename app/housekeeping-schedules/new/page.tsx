"use client";

import Layout from "@/app/components/Layout";
import HousekeepingScheduleForm from "../components/HouseKeepingScheduleForm";

export default function CreateHousekeepingSchedulePage() {
  return (
    <Layout>
      <div className="text-black">
        <h1 className="mb-6 text-3xl font-bold">Create Housekeeping Schedule</h1>
        <HousekeepingScheduleForm />
      </div>
    </Layout>
  );
}