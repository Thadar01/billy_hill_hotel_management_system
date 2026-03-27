"use client";
import { JSX, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "../components/Layout";

import {
  getWeekDates,
  formatDateKey,
  formatDateDisplay,
  formatDateLong,
  formatShiftTime,
} from "./utils";
import {
  Schedule,
  Shift,
  WeekSchedule,

} from "./type";



interface ApiResponse {
  schedules: Schedule[];
}

interface ErrorResponse {
  error: string;
}

export default function SchedulesPage() {
  interface Role {
    role_id: number;
    role: string;
  }

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];

  const [weekStart, setWeekStart] = useState(formattedToday);

  const [loading, setLoading] = useState(true);
  const [filterShift, setFilterShift] = useState<string>("all");
  const [selectedStaff, setSelectedStaff] = useState<WeekSchedule | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<{
    date: string;
    schedule_id: number;
    start_time: string;
    end_time: string;
    break_minutes: number;
    status: string;
  } | null>(null);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();

  const roleName = roles.find((r) => r.role_id === user?.role_id)?.role ?? "Unknown";
  const normalizedRole = roleName.toLowerCase();
  const isManager = ["staff manager"].includes(normalizedRole);
  const isStaff = ["housekeeping", "receptionist"].includes(normalizedRole);


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
    let isMounted = true;
    const fetchSchedules = async () => {
      try {
        console.log("Fetching schedules for week:", weekStart);
        const res = await fetch(`/api/schedules?week=${weekStart}`);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data: ApiResponse = await res.json();
        console.log("Raw API response:", data);

        if (data.schedules && data.schedules.length > 0) {
          console.log("First 3 schedule dates:", data.schedules.slice(0, 3).map((s: Schedule) => ({
            date: s.schedule_date,
            staff: s.staff_name
          })));
        }

        if (isMounted) {
          setSchedules(data.schedules || []);
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error("Error fetching schedules:", err);
        if (isMounted) setLoading(false);
      }
    };
    fetchSchedules();
    return () => { isMounted = false; };
  }, [weekStart]);



  // Extract YYYY-MM-DD from ISO date string

  const weekDates = getWeekDates(weekStart);

  console.log("Processed schedules:", schedules);

  // Group schedules by staff
  const staffMap = new Map<string, WeekSchedule>();
  schedules.forEach((s) => {
    if (!staffMap.has(s.staff_id)) {
      staffMap.set(s.staff_id, { staff_id: s.staff_id, staff_name: s.staff_name, shifts: {} });
    }

    const dateKey = formatDateKey(s.schedule_date);
    const staffSchedule = staffMap.get(s.staff_id);

    if (staffSchedule) {
      staffSchedule.shifts[dateKey] = {
        id: s.id,
        start_time: s.planned_start_time,
        end_time: s.planned_end_time,
        break_minutes: s.break_minutes,
        shift_type: s.shift_type,
        status: s.schedule_status,
        actual_check_in: s.actual_check_in,
        actual_check_out: s.actual_check_out,
        attendance_status: s.attendance_status
      };
    }
  });

  const weekSchedule = Array.from(staffMap.values()).sort((a, b) => a.staff_name.localeCompare(b.staff_name));

  const shiftTypes = ["all", "morning", "evening", "night"];



  const getStatusBadge = (status: string | null): JSX.Element | null => {
    if (!status) return null;

    switch (status) {
      case 'scheduled':
        return <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Scheduled</span>;
      case 'cancelled':
        return <span className="text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">Cancelled</span>;

      default:
        return <span className="text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">{status}</span>;
    }
  };

  const getAttendanceIndicator = (shift: Shift | null): JSX.Element | null => {
    if (!shift) return null;

    if (shift.actual_check_in && !shift.actual_check_out) {
      return <span className="text-xs text-green-600 block">✓ Checked in</span>;
    }
    if (shift.actual_check_in && shift.actual_check_out) {
      return <span className="text-xs text-blue-600 block">✓ Completed</span>;
    }
    return null;
  };

  // Handle status update
  const handleStatusUpdate = async (scheduleId: number, newStatus: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'status',
          attendance_status: newStatus
        }),
      });

      if (response.ok) {
        // Refresh the schedules
        const res = await fetch(`/api/schedules?week=${weekStart}`);
        const data: ApiResponse = await res.json();
        setSchedules(data.schedules || []);
        setEditingSchedule(null);
      } else {
        const errorData: ErrorResponse = await response.json();
        alert(errorData.error || "Failed to update status");
      }
    } catch (error: unknown) {
      console.error('Error updating status:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unknown error occurred");
      }
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete schedule
  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the schedules
        const res = await fetch(`/api/schedules?week=${weekStart}`);
        const data: ApiResponse = await res.json();
        setSchedules(data.schedules || []);
        setEditingSchedule(null);
      } else {
        const errorData: ErrorResponse = await response.json();
        alert(errorData.error || "Failed to delete schedule");
      }
    } catch (error: unknown) {
      console.error('Error deleting schedule:', error);
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  const handleViewDetail = (scheduleId: number) => {
    router.push(`/schedules/${scheduleId}/view`);
  };

  const handleAttendanceAction = async (
    scheduleId: number,
    action: "checkin" | "checkout"
  ) => {
    try {
      const now = new Date().toISOString(); // current time

      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          time: now,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to update attendance");
        return;
      }

      // Refresh schedules after update
      const res = await fetch(`/api/schedules?week=${weekStart}`);
      const data: ApiResponse = await res.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error("Attendance error:", error);
      alert("Something went wrong");
    }
  };


  // Handle edit whole schedule
  const handleEditSchedule = (scheduleId: number) => {
    router.push(`/schedules/edit/${scheduleId}`);
  };

  const handleStaffClick = (staff: WeekSchedule) => {
    setSelectedStaff(staff);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStaff(null);
    setEditingSchedule(null);
  };

  if (loading) return <Layout><div className="h-64 flex items-center justify-center text-black">Loading schedules...</div></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl text-black">Weekly Schedule</h1>
        <div className="flex gap-2">
          <input
            type="date"
            value={weekStart}
            onChange={(e) => { setWeekStart(e.target.value); setLoading(true); }}
            className="border px-3 py-2 rounded text-black"
          />
          {isManager && (
            <button
              onClick={() => router.push("/schedules/create")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
            >
              + Create Schedule
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2 items-center">
          <span className="font-medium text-black">Filter by shift:</span>
          {shiftTypes.map((shift) => (
            <button
              key={shift}
              onClick={() => setFilterShift(shift)}
              className={`px-3 py-1 rounded capitalize ${filterShift === shift
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
            >
              {shift}
            </button>
          ))}
        </div>


      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left text-black">Staff Name</th>
              {weekDates.map((date) => (
                <th key={date} className="border p-2 text-center text-black min-w-[120px]">
                  {formatDateDisplay(date)}
                </th>
              ))}
              <th className="border p-2 text-center text-black">Break Time</th>
            </tr>
          </thead>
          <tbody>
            {weekSchedule.length === 0 ? (
              <tr><td colSpan={9} className="border p-4 text-center text-gray-500">No schedules found</td></tr>
            ) : (
              weekSchedule.map((staff) => {
                const hasMatchingShift = Object.values(staff.shifts).some(
                  (shift) => shift && (filterShift === "all" || (shift.shift_type || '') === filterShift)
                );

                if ((filterShift !== "all" && !hasMatchingShift)) return null;

                return (
                  <tr
                    key={staff.staff_id}
                    className="hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => handleStaffClick(staff)}
                  >
                    <td className="border p-2 font-medium text-black whitespace-nowrap">
                      {staff.staff_name}
                    </td>
                    {weekDates.map((date) => {
                      const shift = staff.shifts[date];
                      let bgColor = "bg-white";
                      if (shift?.shift_type) {
                        bgColor = shift.shift_type === "morning" ? "bg-blue-200" :
                          shift.shift_type === "evening" ? "bg-orange-200" :
                            shift.shift_type === "night" ? "bg-purple-200" : "bg-white";
                      }

                      return (
                        <td key={date} className={`border p-2 text-center ${bgColor} text-black`}>
                          {shift ? (
                            <div className="text-sm">
                              <div className="font-sm text-[10px]">
                                {formatShiftTime(shift.start_time, shift.end_time)}
                              </div>
                              {shift.shift_type && (
                                <div className="text-xs text-gray-600 capitalize">{shift.shift_type}</div>
                              )}
                              <div className="mt-1">
                                {getStatusBadge(shift.status)}
                              </div>
                              {getAttendanceIndicator(shift)}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="border p-2 text-center text-black">
                      {Object.values(staff.shifts).some((s) => s && s.break_minutes) ? (
                        <div className="text-xs">
                          {Object.entries(staff.shifts).map(([date, shift]) => {
                            if (!shift) return null;
                            const dayBreak = shift.break_minutes;
                            return dayBreak ? (
                              <div key={date} className="mb-1">
                                <span className="font-medium">
                                  {(() => {
                                    const [y, m, d] = date.split('-').map(Number);
                                    const dateObj = new Date(Date.UTC(y, m - 1, d));
                                    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                                    return days[dateObj.getUTCDay()];
                                  })()}:
                                </span> {dayBreak} min
                              </div>
                            ) : null;
                          })}
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2 text-sm text-black">
        <div className="flex gap-4">
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-blue-300 border"></div>Morning</div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-orange-300 border"></div>Evening</div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-purple-300 border"></div>Night</div>
        </div>
        <div className="flex gap-4 flex-wrap">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Scheduled</span>
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Cancelled</span>

        </div>
      </div>

      {/* Staff Detail Modal */}
      {showModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-2xl font-bold text-black">{selectedStaff.staff_name} - Weekly Schedule</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                {weekDates.map((date) => {
                  const shift = selectedStaff.shifts[date];
                  const isEditing = editingSchedule?.date === date;

                  return (
                    <div key={date} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-black">
                            {formatDateLong(date)}
                          </h3>

                          {shift ? (
                            isEditing ? (
                              // Edit mode for status
                              <div className="mt-3 space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                                  <div className="flex flex-wrap gap-2">
                                    {['scheduled', 'cancelled'].map((status) => (
                                      <button
                                        key={status}
                                        onClick={() => handleStatusUpdate(shift.id!, status)}
                                        disabled={updating}
                                        className={`px-3 py-1 rounded text-sm capitalize ${shift.status === status
                                          ? status === 'scheduled' ? 'bg-blue-600 text-white'
                                            : status === 'cancelled' ? 'bg-gray-600 text-white'
                                              : status === 'present' ? 'bg-green-600 text-white'
                                                : status === 'late' ? 'bg-yellow-600 text-white'
                                                  : status === 'absent' ? 'bg-red-600 text-white'
                                                    : 'bg-gray-600 text-white'
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                          }`}
                                      >
                                        {status}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {isManager && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditSchedule(shift.id!)}
                                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                                    >
                                      Edit Full Schedule
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSchedule(shift.id!)}
                                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      onClick={() => setEditingSchedule(null)}
                                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              // View mode
                              <div className="mt-2 space-y-1">
                                <p className="text-black">
                                  <span className="font-medium">Time:</span> {formatShiftTime(shift.start_time, shift.end_time)}
                                </p>
                                <p className="text-black">
                                  <span className="font-medium">Shift Type:</span>{' '}
                                  <span className={`capitalize px-2 py-1 rounded text-sm ${shift.shift_type === 'morning' ? 'bg-blue-100 text-blue-800' :
                                    shift.shift_type === 'evening' ? 'bg-orange-100 text-orange-800' :
                                      shift.shift_type === 'night' ? 'bg-purple-100 text-purple-800' : ''
                                    }`}>
                                    {shift.shift_type || 'Not specified'}
                                  </span>
                                </p>
                                <p className="text-black">
                                  <span className="font-medium">Status:</span>{' '}
                                  {getStatusBadge(shift.status)}
                                </p>
                                {/* <p className="text-black">
                                  <span className="font-medium">Attendance:</span>{' '}
                                  {getAttendanceIndicator(shift)}
                                  {shift.actual_check_in && (
                                    <span className="text-xs text-gray-600 block">
                                      In: {formatTimeString(shift.actual_check_in)}
                                    </span>
                                  )}
                                  {shift.actual_check_out && (
                                    <span className="text-xs text-gray-600 block">
                                      Out: {formatTimeString(shift.actual_check_out)}
                                    </span>
                                  )}
                                </p> */}


                                <div className="flex gap-2 mt-2">
                                  {isStaff && !shift.actual_check_in && (
                                    <button
                                      onClick={() => handleAttendanceAction(shift.id!, "checkin")}
                                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 font-medium"
                                    >
                                      Check In
                                    </button>
                                  )}

                                  {isStaff && shift.actual_check_in && !shift.actual_check_out && (
                                    <button
                                      onClick={() => handleAttendanceAction(shift.id!, "checkout")}
                                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 font-medium"
                                    >
                                      Check Out
                                    </button>
                                  )}
                                </div>

                                <p className="text-black">
                                  <span className="font-medium">Break:</span> {shift.break_minutes} minutes
                                </p>
                                <button
                                  onClick={() => handleViewDetail(shift.id!)}
                                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                                >
                                  View Details
                                </button>
                                {isManager && (
                                  <button
                                    onClick={() => setEditingSchedule({
                                      date,
                                      schedule_id: shift.id!,
                                      start_time: shift.start_time,
                                      end_time: shift.end_time,
                                      break_minutes: shift.break_minutes,
                                      status: shift.status || ''
                                    })}
                                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium border-b border-transparent hover:border-blue-600 inline-block transition-all"
                                  >
                                    Manage Schedule/Leave →
                                  </button>
                                )}
                              </div>
                            )
                          ) : (
                            <p className="text-gray-500 mt-2">No shift scheduled</p>
                          )}
                        </div>

                        {shift && !isEditing && (
                          <div className="text-sm text-gray-500">
                            ID: {shift.id}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end p-4 border-t">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}