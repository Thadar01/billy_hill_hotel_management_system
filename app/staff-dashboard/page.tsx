"use client";

import Layout from "../components/Layout";
import { useAuthStore } from "@/store/useAuthStore";

export default function StaffDashboardPage() {
  const { user } = useAuthStore();

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold text-black">
          Welcome, {user?.staff_name}
        </h1>
        <p className="text-lg text-gray-600">Email: {user?.staff_gmail}</p>
        <p className="text-sm text-gray-500">Role ID: {user?.role_id}</p>
      </div>
    </Layout>
  );
}