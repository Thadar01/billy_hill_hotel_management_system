// app/schedules/view/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";

interface ScheduleData {
  id: number;
  staff_id: string;
  staff_name: string;
  schedule_date: string;
  planned_start_time: string;
  planned_end_time: string;
  break_minutes: number;
  shift_type: "morning" | "evening" | "night" | null;
  schedule_status: "scheduled" | "cancelled";
  actual_check_in: string | null;
  actual_check_out: string | null;
  attendance_status: string;
  overtime_minutes: number;
  late_minutes: number;
  worked_hours: number;
}

interface ApiResponse {
  schedule: ScheduleData;
}

interface ErrorResponse {
  error: string;
}

export default function ViewSchedulePage() {
  const router = useRouter();
  const params = useParams(); // gets { id: string } from route
  const scheduleId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);

  useEffect(() => {
    if (!scheduleId) return;

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/schedules/${scheduleId}`);
        if (!res.ok) {
          const errData: ErrorResponse = await res.json();
          throw new Error(errData.error || "Failed to fetch schedule");
        }
        const data: ApiResponse = await res.json();
        setSchedule(data.schedule);
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) setError(err.message);
        else setError("Failed to load schedule data");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [scheduleId]);

  const formatTimeDisplay = (time: string | null) => {
    if (!time) return "--:--";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading)
    return (
      <Layout>
        <div className="flex justify-center items-center h-64 text-black">
          Loading schedule...
        </div>
      </Layout>
    );

  if (error || !schedule)
    return (
      <Layout>
        <div className="flex justify-center items-center h-64 text-red-600">
          {error || "Schedule not found"}
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl text-black">Schedule Details</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Schedule Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Schedule Information</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3 text-gray-700">
              <p><span className="font-medium text-gray-800">Staff Name:</span> {schedule.staff_name}</p>
              <p><span className="font-medium text-gray-800">Date:</span> {schedule.schedule_date.split("T")[0]}</p>
              <p><span className="font-medium text-gray-800">Shift Type:</span> {schedule.shift_type || "N/A"}</p>
              <p><span className="font-medium text-gray-800">Status:</span> {schedule.schedule_status}</p>
              <p><span className="font-medium text-gray-800">Planned Start:</span> {formatTimeDisplay(schedule.planned_start_time)}</p>
              <p><span className="font-medium text-gray-800">Planned End:</span> {formatTimeDisplay(schedule.planned_end_time)}</p>
              <p><span className="font-medium text-gray-800">Break Minutes:</span> {schedule.break_minutes}</p>
            </div>
          </div>

          {/* Attendance Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Attendance Details</h2>
            <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-gray-700">
              <p><span className="font-medium text-gray-800">Attendance Status:</span> {schedule.attendance_status || 'pending'}</p>
              <p><span className="font-medium text-gray-800">Actual Check In:</span> {formatTimeDisplay(schedule.actual_check_in)}</p>
              <p><span className="font-medium text-gray-800">Actual Check Out:</span> {formatTimeDisplay(schedule.actual_check_out)}</p>
              <p><span className="font-medium text-gray-800">Worked Hours:</span> {schedule.worked_hours}h</p>
              <p><span className="font-medium text-gray-800">Late Minutes:</span> {schedule.late_minutes} min</p>
              <p><span className="font-medium text-gray-800">Overtime Minutes:</span> {schedule.overtime_minutes} min</p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}