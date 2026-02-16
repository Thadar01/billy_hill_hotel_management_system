/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";
import { format, addDays, parseISO } from 'date-fns';

interface Schedule {
  schedule_id: number;
  staff_id: string;
  staff_name: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  shift_type: "morning" | "evening" | "night" | null;
  status: "scheduled" | "off" | "leave" | "in progress" | "finish";
}

interface WeekSchedule {
  staff_id: string;
  staff_name: string;
  shifts: {
    [date: string]: {
      schedule_id?: number;
      start_time: string;
      end_time: string;
      break_minutes: number;
      shift_type: string | null;
      status: string | null;
    } | null;
  };
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [weekStart, setWeekStart] = useState("2026-02-13");
  const [loading, setLoading] = useState(true);
  const [filterShift, setFilterShift] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
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

  useEffect(() => {
    let isMounted = true;
    const fetchSchedules = async () => {
      try {
        console.log("Fetching schedules for week:", weekStart);
        const res = await fetch(`/api/schedules?week=${weekStart}`);
        const data = await res.json();
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
      } catch (err) {
        console.error(err);
        if (isMounted) setLoading(false);
      }
    };
    fetchSchedules();
    return () => { isMounted = false; };
  }, [weekStart]);

  const getWeekDates = (startDate: string): string[] => {
    const dates: string[] = [];
    const start = parseISO(startDate);

    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i);
      dates.push(format(date, 'yyyy-MM-dd'));
    }

    return dates;
  };

  // Extract YYYY-MM-DD from ISO date string
  const formatDateKey = (dateStr: string): string => {
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    return dateStr;
  };

  const formatDateDisplay = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${days[date.getUTCDay()]} ${month}/${day}`;
  };

  const formatDateLong = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return `${days[date.getUTCDay()]}, ${months[date.getUTCMonth()]} ${day}, ${year}`;
  };

  const weekDates = getWeekDates(weekStart);

  console.log("Processed schedules:", schedules);

  // Group schedules by staff
  const staffMap = new Map<string, WeekSchedule>();
  schedules.forEach((s) => {
    if (!staffMap.has(s.staff_id)) {
      staffMap.set(s.staff_id, { staff_id: s.staff_id, staff_name: s.staff_name, shifts: {} });
    }

    const dateKey = formatDateKey(s.schedule_date);

    staffMap.get(s.staff_id)!.shifts[dateKey] = {
      schedule_id: s.schedule_id,
      start_time: s.start_time,
      end_time: s.end_time,
      break_minutes: s.break_minutes,
      shift_type: s.shift_type,
      status: s.status
    };
  });

  const weekSchedule = Array.from(staffMap.values()).sort((a, b) => a.staff_name.localeCompare(b.staff_name));

  const shiftTypes = ["all", "morning", "evening", "night"];
  const statusTypes = ["all", "scheduled", "off", "leave", "in progress", "finish"];

  // Convert 24-hour time to 12-hour format with AM/PM
  const convertTo12HourFormat = (timeStr: string): string => {
    if (!timeStr) return "--:--";
    
    try {
      const parts = timeStr.split(':');
      if (parts.length < 2) return timeStr;
      
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      
      if (isNaN(hours)) return timeStr;
      
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      
      return `${hours}:${minutes} ${ampm}`;
    } catch (error) {
      console.error("Error converting to 12-hour format:", error);
      return timeStr;
    }
  };

  const formatTimeString = (timeStr: any): string => {
    if (!timeStr) return "--:--";

    try {
      if (typeof timeStr === 'string') {
        if (timeStr.includes(':')) {
          return convertTo12HourFormat(timeStr);
        }

        if (timeStr.includes('T')) {
          const date = new Date(timeStr);
          if (!isNaN(date.getTime())) {
            const hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const hour12 = hours % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
          }
        }

        return timeStr;
      }

      if (timeStr instanceof Date) {
        const hours = timeStr.getHours();
        const minutes = timeStr.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
      }

      return String(timeStr);
    } catch (error) {
      console.error("Error formatting time:", error);
      return "--:--";
    }
  };

  const formatShiftTime = (start: any, end: any) => {
    const startStr = formatTimeString(start);
    const endStr = formatTimeString(end);
    return `${startStr} - ${endStr}`;
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    switch(status) {
      case 'scheduled':
        return <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Scheduled</span>;
      case 'off':
        return <span className="text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">Off</span>;
      case 'leave':
        return <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Leave</span>;
      case 'in progress':
        return <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">In Progress</span>;
      case 'finish':
        return <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">Finish</span>;
      default:
        return null;
    }
  };

  // Handle status update
  const handleStatusUpdate = async (scheduleId: number, newStatus: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh the schedules
        const res = await fetch(`/api/schedules?week=${weekStart}`);
        const data = await res.json();
        setSchedules(data.schedules || []);
        setEditingSchedule(null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
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
        const data = await res.json();
        setSchedules(data.schedules || []);
        setEditingSchedule(null);
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
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
          <button
            onClick={() => router.push("/schedules/create")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            + Create Schedule
          </button>
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
        
        <div className="flex gap-2 items-center">
          <span className="font-medium text-black">Filter by status:</span>
          {statusTypes.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded capitalize ${filterStatus === status
                  ? status === 'all' 
                    ? "bg-gray-800 text-white" 
                    : status === 'scheduled' ? "bg-blue-600 text-white"
                    : status === 'off' ? "bg-gray-600 text-white"
                    : status === 'leave' ? "bg-yellow-600 text-white"
                    : status === 'in progress' ? "bg-green-600 text-white"
                    : status === 'finish' ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-white"
                  : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
            >
              {status === 'in progress' ? 'In Progress' : status === 'finish' ? 'Finish' : status}
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
                  (shift) => shift && (filterShift === "all" || shift.shift_type === filterShift)
                );
                const hasMatchingStatus = Object.values(staff.shifts).some(
                  (shift) => shift && (filterStatus === "all" || shift.status === filterStatus)
                );
                
                if ((filterShift !== "all" && !hasMatchingShift) || 
                    (filterStatus !== "all" && !hasMatchingStatus)) return null;

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
        <div className="flex gap-4">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Scheduled</span>
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Off</span>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Leave</span>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">In Progress</span>
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Finish</span>
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
                                    {['scheduled', 'off', 'leave', 'in progress', 'finish'].map((status) => (
                                      <button
                                        key={status}
                                        onClick={() => handleStatusUpdate(shift.schedule_id!, status)}
                                        disabled={updating}
                                        className={`px-3 py-1 rounded text-sm capitalize ${
                                          shift.status === status
                                            ? status === 'scheduled' ? 'bg-blue-600 text-white'
                                              : status === 'off' ? 'bg-gray-600 text-white'
                                              : status === 'leave' ? 'bg-yellow-600 text-white'
                                              : status === 'in progress' ? 'bg-green-600 text-white'
                                              : status === 'finish' ? 'bg-purple-600 text-white'
                                              : 'bg-gray-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                      >
                                        {status === 'in progress' ? 'In Progress' : status}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditSchedule(shift.schedule_id!)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                  >
                                    Edit Full Schedule
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSchedule(shift.schedule_id!)}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setEditingSchedule(null)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <div className="mt-2 space-y-1">
                                <p className="text-black">
                                  <span className="font-medium">Time:</span> {formatShiftTime(shift.start_time, shift.end_time)}
                                </p>
                                <p className="text-black">
                                  <span className="font-medium">Shift Type:</span>{' '}
                                  <span className={`capitalize px-2 py-1 rounded text-sm ${
                                    shift.shift_type === 'morning' ? 'bg-blue-100 text-blue-800' :
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
                                <p className="text-black">
                                  <span className="font-medium">Break:</span> {shift.break_minutes} minutes
                                </p>
                                <button
                                  onClick={() => setEditingSchedule({
                                    date,
                                    schedule_id: shift.schedule_id!,
                                    start_time: shift.start_time,
                                    end_time: shift.end_time,
                                    break_minutes: shift.break_minutes,
                                    status: shift.status || ''
                                  })}
                                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                                >
                                  Manage Schedule/Leave →
                                </button>
                              </div>
                            )
                          ) : (
                            <p className="text-gray-500 mt-2">No shift scheduled</p>
                          )}
                        </div>
                        
                        {shift && !isEditing && (
                          <div className="text-sm text-gray-500">
                            ID: {shift.schedule_id}
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