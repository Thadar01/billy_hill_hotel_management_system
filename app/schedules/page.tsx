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
  formatTimeString,
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
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
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
    setSelectedStaffId(staff.staff_id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStaffId(null);
    setEditingSchedule(null);
  };

  if (loading) return <Layout><div className="h-64 flex items-center justify-center text-black">Loading schedules...</div></Layout>;

  return (
    <Layout>
      <div className="flex flex-col gap-6 w-full text-black">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-black">Weekly Schedule</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <input
                type="date"
                value={weekStart}
                onChange={(e) => { setWeekStart(e.target.value); setLoading(true); }}
                className="px-4 py-2 border border-gray-300 bg-white rounded text-sm text-black"
              />
            </div>
            {isManager && (
              <button
                onClick={() => router.push("/schedules/create")}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium"
              >
                Add Schedule
              </button>
            )}
          </div>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-4 rounded border border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Filter by Shift:</span>
          {shiftTypes.map((shift) => (
            <button
              key={shift}
              onClick={() => setFilterShift(shift)}
              className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${filterShift === shift
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
            >
              {shift.charAt(0).toUpperCase() + shift.slice(1)}
            </button>
          ))}
        </div>

        {/* Schedule Matrix */}
        <div className="bg-white border border-gray-300 rounded overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10">Staff</th>
                  {weekDates.map((date) => (
                    <th key={date} className="px-4 py-3 text-center min-w-[120px]">
                      <div className="text-xs text-gray-500">{formatDateDisplay(date).split(",")[0]}</div>
                      <div className="text-sm font-bold text-black">{formatDateDisplay(date).split(",")[1]}</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Total Breaks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {weekSchedule.length === 0 ? (
                  <tr>
                    <td colSpan={weekDates.length + 2} className="px-6 py-20 text-center">
                      <p className="text-gray-300 font-black uppercase tracking-widest text-xs">No active rosters in this temporal window</p>
                    </td>
                  </tr>
                ) : (
                  weekSchedule.map((staff) => {
                    const hasMatchingShift = Object.values(staff.shifts).some(
                      (shift) => shift && (filterShift === "all" || (shift.shift_type || '') === filterShift)
                    );

                    if ((filterShift !== "all" && !hasMatchingShift)) return null;

                    return (
                      <tr
                        key={staff.staff_id}
                        onClick={() => handleStaffClick(staff)}
                        className="group hover:bg-gray-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-4 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200">
                          <div className="font-semibold text-black text-sm whitespace-nowrap">{staff.staff_name}</div>
                        </td>
                        {weekDates.map((date) => {
                          const shift = staff.shifts[date];
                          let colorClasses = "bg-white border-gray-300";
                          if (shift?.shift_type) {
                            colorClasses =
                              shift.shift_type === "morning" ? "bg-blue-50 text-blue-700 border-gray-300" :
                                shift.shift_type === "evening" ? "bg-yellow-50 text-yellow-700 border-gray-300" :
                                  shift.shift_type === "night" ? "bg-purple-50 text-purple-700 border-gray-300" : "bg-white border-gray-300";
                          }

                          return (
                            <td key={date} className="p-2.5 align-top border-r border-transparent">
                              {shift ? (
                                <div className={`h-full min-h-[60px] rounded border p-2 text-xs transition-all ${colorClasses}`}>
                                  <div className="font-bold uppercase text-[9px] text-gray-500 mb-0.5">{shift.shift_type}</div>
                                  <div className="font-medium mb-1 mt-1">
                                    {formatShiftTime(shift.start_time, shift.end_time)}
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className={`inline-block w-fit px-1 rounded text-[9px] font-bold uppercase ${shift.status === 'scheduled' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                      }`}>
                                      {shift.status}
                                    </span>
                                    {shift.actual_check_in && (
                                      <span className="inline-block w-fit px-1 rounded text-[9px] font-bold uppercase bg-green-100 text-green-600">
                                        {shift.actual_check_out ? 'Completed' : 'Checked In'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full min-h-[60px] rounded border border-transparent flex items-center justify-center opacity-20">
                                  <span className="text-xs">—</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-4 text-center">
                          <div className="text-xs text-gray-400">
                            {Object.values(staff.shifts).some((s) => s && s.break_minutes) ? (
                              <div className="flex flex-col gap-0.5">
                                {Object.entries(staff.shifts).map(([date, shift]) => shift?.break_minutes ? (
                                  <div key={date} className="flex justify-between gap-2 text-[9px] border-b border-gray-100 pb-0.5">
                                    <span className="opacity-50">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    <span className="text-black font-bold">{shift.break_minutes}m</span>
                                  </div>
                                ) : null)}
                              </div>
                            ) : "—"}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>        {/* Staff Detail Modal - Simplified */}
        {(() => {
          const selectedStaff = weekSchedule.find(s => s.staff_id === selectedStaffId);
          if (!showModal || !selectedStaff) return null;

          return (
            <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-black">{selectedStaff.staff_name}</h2>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Weekly Schedule</p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-1 hover:bg-gray-100 rounded transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weekDates.map((date) => {
                      const shift = selectedStaff.shifts[date];
                      const isEditing = editingSchedule?.date === date;
                      const bgClass = shift?.shift_type === 'morning' ? 'bg-blue-50 border-blue-100' :
                        shift?.shift_type === 'evening' ? 'bg-yellow-50 border-yellow-100' :
                          shift?.shift_type === 'night' ? 'bg-purple-50 border-purple-100' :
                            'bg-white border-gray-200';

                      return (
                        <div key={date} className={`rounded-lg p-4 border transition-all ${bgClass}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-sm font-bold text-black">{formatDateLong(date)}</h3>
                            </div>
                            {shift && <span className="px-2 py-0.5 bg-white rounded-full text-[10px] font-bold uppercase border border-gray-100 shadow-sm">{shift.shift_type}</span>}
                          </div>

                          {shift ? (
                            isEditing ? (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Status Override</label>
                                  <div className="flex gap-2">
                                    {['scheduled', 'cancelled'].map((status) => (
                                      <button
                                        key={status}
                                        onClick={() => handleStatusUpdate(shift.id!, status)}
                                        disabled={updating}
                                        className={`flex-1 py-2 rounded text-xs font-bold uppercase border transition-all ${shift.status === status
                                          ? 'bg-black text-white border-black'
                                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                          }`}
                                      >
                                        {status}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {isManager && (
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={() => handleEditSchedule(shift.id!)}
                                      className="flex-1 py-2.5 bg-blue-600 text-white rounded font-bold text-xs uppercase"
                                    >
                                      Edit Details
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSchedule(shift.id!)}
                                      className="px-3 py-2.5 bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-white p-3 rounded border border-white/50 shadow-sm">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Shift Time</p>
                                    <p className="text-sm font-bold text-black">{formatShiftTime(shift.start_time, shift.end_time)}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded border border-white/50 shadow-sm">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Break</p>
                                    <p className="text-sm font-bold text-black">{shift.break_minutes || 0} Minutes</p>
                                  </div>
                                </div>

                                {/* Attendance Info */}
                                {(shift.actual_check_in || shift.actual_check_out) && (
                                  <div className="flex flex-col gap-1 mt-2">
                                    {shift.actual_check_in && (
                                      <p className="text-[9px] text-green-600 font-bold uppercase">
                                        In: {formatTimeString(shift.actual_check_in)}
                                      </p>
                                    )}
                                    {shift.actual_check_out && (
                                      <p className="text-[9px] text-blue-600 font-bold uppercase">
                                        Out: {formatTimeString(shift.actual_check_out)}
                                      </p>
                                    )}
                                  </div>
                                )}

                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => handleViewDetail(shift.id!)}
                                    className="px-4 py-2 bg-black text-white rounded text-[10px] font-bold uppercase transition-all"
                                  >
                                    View
                                  </button>
                                  {!shift.actual_check_in && isStaff && (
                                    <button
                                      onClick={() => handleAttendanceAction(shift.id!, "checkin")}
                                      className="px-4 py-2 bg-green-600 text-white rounded text-[10px] font-bold uppercase transition-all hover:bg-green-700"
                                    >
                                      Check In
                                    </button>
                                  )}
                                  {shift.actual_check_in && !shift.actual_check_out && isStaff && (
                                    <button
                                      onClick={() => handleAttendanceAction(shift.id!, "checkout")}
                                      className="px-4 py-2 bg-blue-600 text-white rounded text-[10px] font-bold uppercase transition-all hover:bg-orange-700"
                                    >
                                      Check Out
                                    </button>
                                  )}
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
                                      className="flex-1 py-2 bg-white border border-gray-300 text-gray-600 text-[10px] font-bold uppercase rounded hover:bg-gray-50 transition-all"
                                    >
                                      Quick Edit
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="py-4 text-center opacity-30">
                              <p className="text-xs font-medium italic">No shift assigned</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 bg-gray-100 text-black rounded font-bold text-xs uppercase hover:bg-gray-200 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </Layout>
  );
}