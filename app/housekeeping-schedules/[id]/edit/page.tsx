"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Layout from "@/app/components/Layout";
import HousekeepingScheduleForm from "../../components/HouseKeepingScheduleForm";

interface HousekeepingSchedule {
  housekeeping_id: number;
  room_id: string;
  staff_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  cleaning_type: string;
  status: string;
  remarks: string | null;
}

export default function EditHousekeepingSchedulePage() {
  const params = useParams();
  const id = params.id as string;

  const [schedule, setSchedule] = useState<HousekeepingSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const res = await fetch(`/api/housekeeping-schedules/${id}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (res.ok) {
          setSchedule(data.schedule);
        } else {
          alert(data.error || "Failed to load schedule");
        }
      } catch (error) {
        console.error("Failed to load housekeeping schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadSchedule();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="p-8 text-black">Loading schedule...</div>
      </Layout>
    );
  }

  if (!schedule) {
    return (
      <Layout>
        <div className="p-8 text-black">Schedule not found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="text-black">
        <h1 className="mb-6 text-3xl font-bold">Edit Housekeeping Schedule</h1>
        <HousekeepingScheduleForm
          editingId={schedule.housekeeping_id}
          initialData={{
            room_id: schedule.room_id,
            staff_id: schedule.staff_id,
            schedule_date: schedule.schedule_date,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            cleaning_type: schedule.cleaning_type,
            status: schedule.status,
            remarks: schedule.remarks || "",
          }}
        />
      </div>
    </Layout>
  );
}