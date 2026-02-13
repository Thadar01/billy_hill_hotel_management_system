/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

interface Schedule {
  schedule_id: number;
  staff_id: string;
  staff_name: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  shift_type: "morning" | "evening" | "night" | null;
  status: "scheduled" | "off" | "leave";
}

interface WeekSchedule {
  staff_id: string;
  staff_name: string;
  shifts: {
    [date: string]: {
      start_time: string;
      end_time: string;
      break_minutes: number;
      shift_type: string | null;
    } | null;
  };
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [weekStart, setWeekStart] = useState("2026-02-13");
  const [loading, setLoading] = useState(true);
  const [filterShift, setFilterShift] = useState<string>("all");
  const [selectedStaff, setSelectedStaff] = useState<WeekSchedule | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const fetchSchedules = async () => {
      try {
        console.log("Fetching schedules for week:", weekStart);
        const res = await fetch(`/api/schedules?week=${weekStart}`);
        const data = await res.json();
        console.log("Raw API response:", data);
        
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
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
    }
    return dates;
  };

  // Extract YYYY-MM-DD from ISO date string
  const formatDateKey = (dateStr: string): string => {
    // Handle ISO string like "2026-02-12T17:30:00.000Z"
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    return dateStr;
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${days[date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatDateLong = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Safe time formatting function
  const formatTimeString = (timeStr: any): string => {
    if (!timeStr) return "--:--";
    
    // If it's already a string in HH:MM or HH:MM:SS format
    if (typeof timeStr === 'string') {
      // Handle MySQL TIME format which might come as "HH:MM:SS"
      if (timeStr.length >= 5) {
        return timeStr.substring(0, 5); // Return HH:MM
      }
      return timeStr;
    }
    
    // If it's a Date object or something else, convert to string
    return String(timeStr);
  };

  // Show start → end
  const formatShiftTime = (start: any, end: any) => {
    const startStr = formatTimeString(start);
    const endStr = formatTimeString(end);
    
    if (startStr === "--:--" || endStr === "--:--") {
      return `${startStr} - ${endStr}`;
    }
    
    return `${startStr} - ${endStr}`;
  };

  const weekDates = getWeekDates(weekStart);

  // Log the schedules to see what we have
  console.log("Processed schedules:", schedules);

  // Group schedules by staff
  const staffMap = new Map<string, WeekSchedule>();
  schedules.forEach((s) => {
    if (!staffMap.has(s.staff_id)) {
      staffMap.set(s.staff_id, { staff_id: s.staff_id, staff_name: s.staff_name, shifts: {} });
    }
    
    // Convert the ISO date to YYYY-MM-DD for matching
    const dateKey = formatDateKey(s.schedule_date);
    
    staffMap.get(s.staff_id)!.shifts[dateKey] = {
      start_time: s.start_time,
      end_time: s.end_time,
      break_minutes: s.break_minutes,
      shift_type: s.shift_type
    };
  });
  
  const weekSchedule = Array.from(staffMap.values()).sort((a, b) => a.staff_name.localeCompare(b.staff_name));

  const shiftTypes = ["all", "morning", "evening", "night"];

  // Handle staff click
  const handleStaffClick = (staff: WeekSchedule) => {
    setSelectedStaff(staff);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedStaff(null);
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

      {/* Shift filter */}
      <div className="mb-4 flex gap-2">
        <span className="font-medium text-black">Filter by shift:</span>
        {shiftTypes.map((shift) => (
          <button
            key={shift}
            onClick={() => setFilterShift(shift)}
            className={`px-3 py-1 rounded capitalize ${
              filterShift === shift
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            {shift}
          </button>
        ))}
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
                if (filterShift !== "all" && !hasMatchingShift) return null;

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
                        bgColor = shift.shift_type === "morning" ? "bg-blue-50" :
                                  shift.shift_type === "evening" ? "bg-orange-50" :
                                  shift.shift_type === "night" ? "bg-purple-50" : "bg-white";
                      }

                      return (
                        <td key={date} className={`border p-2 text-center ${bgColor}`}>
                          {shift ? (
                            <div className="text-sm">
                              <div className="font-medium">
                                {formatShiftTime(shift.start_time, shift.end_time)}
                              </div>
                              {shift.shift_type && (
                                <div className="text-xs text-gray-600 capitalize">{shift.shift_type}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="border p-2 text-center text-black">
                      {Object.values(staff.shifts).some((s) => s) ? (
                        <span>{Object.values(staff.shifts).find((s) => s)?.break_minutes || 60} min</span>
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
      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-1"><div className="w-4 h-4 bg-blue-50 border"></div>Morning</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 bg-orange-50 border"></div>Evening</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 bg-purple-50 border"></div>Night</div>
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
                  return (
                    <div key={date} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-black">
                            {formatDateLong(date)}
                          </h3>
                          {shift ? (
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
                                <span className="font-medium">Break:</span> {shift.break_minutes} minutes
                              </p>
                            </div>
                          ) : (
                            <p className="text-gray-500 mt-2">No shift scheduled</p>
                          )}
                        </div>
                        {shift && (
                          <div className="text-sm text-gray-500">
                            Schedule ID: {schedules.find(s => 
                              formatDateKey(s.schedule_date) === date && 
                              s.staff_id === selectedStaff.staff_id
                            )?.schedule_id || 'N/A'}
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