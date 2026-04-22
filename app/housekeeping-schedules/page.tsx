"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Layout from "@/app/components/Layout";
import { useAuthStore } from "@/store/useAuthStore";

interface HousekeepingSchedule {
  housekeeping_id: number;
  room_id: string;
  roomNumber?: string;
  staff_id: string;
  staff_name?: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  cleaning_type: string;
  status: string;
  remarks: string | null;
}

export default function HousekeepingSchedulesPage() {
  interface Role {
    role_id: number;
    role: string;
  }
  const [schedules, setSchedules] = useState<HousekeepingSchedule[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roles, setRoles] = useState<Role[]>([]);
  const { user } = useAuthStore();

  const roleName = roles.find((r) => r.role_id === user?.role_id)?.role ?? "Unknown";
  const normalizedRole = roleName.toLowerCase();
  const isManager = ["staff manager"].includes(normalizedRole);
  const loadSchedules = async () => {
    try {
      const res = await fetch("/api/housekeeping-schedules", { cache: "no-store" });
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error("Failed to load housekeeping schedules:", error);
    } finally {
      setPageLoading(false);
    }
  };
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch("/api/roles");
        const data = await res.json();
        setRoles(data.roles || []);
      } catch (err) {
        console.error("Failed to fetch roles", err);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this housekeeping schedule?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/housekeeping-schedules/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete schedule");
        return;
      }

      await loadSchedules();
    } catch (error) {
      console.error("Failed to delete housekeeping schedule:", error);
      alert("Something went wrong");
    }
  };

  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const matchesStatus = statusFilter === "all" || schedule.status === statusFilter;
      const searchValue = search.toLowerCase();

      const matchesSearch =
        schedule.room_id.toLowerCase().includes(searchValue) ||
        (schedule.roomNumber || "").toLowerCase().includes(searchValue) ||
        schedule.staff_id.toLowerCase().includes(searchValue) ||
        (schedule.staff_name || "").toLowerCase().includes(searchValue) ||
        schedule.cleaning_type.toLowerCase().includes(searchValue) ||
        (schedule.remarks || "").toLowerCase().includes(searchValue);

      return matchesStatus && matchesSearch;
    });
  }, [schedules, search, statusFilter]);

  const statusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const schedule = schedules.find((item) => item.housekeeping_id === id);
      if (!schedule) return;

      const response = await fetch(`/api/housekeeping-schedules/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_id: schedule.room_id,
          staff_id: schedule.staff_id,
          schedule_date: schedule.schedule_date,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          cleaning_type: schedule.cleaning_type,
          status: newStatus,
          remarks: schedule.remarks || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to update status");
        return;
      }

      setSchedules((prev) =>
        prev.map((item) =>
          item.housekeeping_id === id ? { ...item, status: newStatus } : item
        )
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Something went wrong");
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div className="p-8 text-black">Loading housekeeping schedules...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 text-black">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Housekeeping Schedules</h1>
            <p className="text-sm text-gray-500">
              Manage room cleaning assignments, staff allocation, and task progress.
            </p>
          </div>
          {isManager && <Link
            href="/housekeeping-schedules/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Create Schedule
          </Link>}

        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Schedule List</h2>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search room, staff, type..."
                className="rounded-lg border border-gray-300 p-2"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 p-2"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 text-sm font-semibold">Room</th>
                  <th className="px-4 py-3 text-sm font-semibold">Staff</th>
                  <th className="px-4 py-3 text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-sm font-semibold">Time</th>
                  <th className="px-4 py-3 text-sm font-semibold">Cleaning Type</th>
                  <th className="px-4 py-3 text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold">Remarks</th>
                  {isManager && <th className="px-4 py-3 text-sm font-semibold">Action</th>
                  }
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                      No housekeeping schedules found.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <tr key={schedule.housekeeping_id} className="border-b last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="font-medium">{schedule.roomNumber || schedule.room_id}</div>
                        <div className="text-xs text-gray-500">{schedule.room_id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{schedule.staff_name || schedule.staff_id}</div>
                        <div className="text-xs text-gray-500">{schedule.staff_id}</div>
                      </td>
                      <td className="px-4 py-3">{schedule.schedule_date}</td>
                      <td className="px-4 py-3">
                        {schedule.start_time} - {schedule.end_time}
                      </td>
                      <td className="px-4 py-3">{schedule.cleaning_type}</td>
                      <td className="px-4 py-3">
                        <select
                          value={schedule.status}
                          onChange={(e) => handleStatusChange(schedule.housekeeping_id, e.target.value)}
                          className={`min-w-[130px] rounded-full px-3 py-1 text-xs font-medium cursor-pointer ${statusClass(schedule.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {schedule.remarks || "-"}
                      </td>
                      {isManager && <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/housekeeping-schedules/${schedule.housekeeping_id}/edit`}
                            className="rounded-lg bg-amber-500 px-3 py-1 text-sm text-white hover:bg-amber-600"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(schedule.housekeeping_id)}
                            className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>}

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}