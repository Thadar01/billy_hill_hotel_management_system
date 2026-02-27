"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";

interface Staff {
  staff_id: string;
  staff_name: string;
}

// Helper function to get dates based on start date and selected weekdays
function getDatesFromWeekdays(startDate: string, days: string[]): string[] {
  if (!startDate || days.length === 0) return [];
  
  const result: string[] = [];
  const start = new Date(startDate);
  const dayMap: { [key: string]: number } = {
    "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6
  };
  
  // Convert selected day names to numbers
  const selectedDayNumbers = days.map(day => dayMap[day]);
  
  // Generate dates for just 1 week (changed from 4 to 1)
  for (let week = 0; week < 1; week++) {
    for (const dayNum of selectedDayNumbers) {
      const date = new Date(start);
      // Calculate days to add to reach the next occurrence of the selected day
      const currentDay = date.getDay();
      let daysToAdd = dayNum - currentDay;
      if (daysToAdd < 0) daysToAdd += 7;
      
      // Add weeks
      daysToAdd += week * 7;
      
      date.setDate(date.getDate() + daysToAdd);
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      result.push(`${year}-${month}-${day}`);
    }
  }
  
  // Sort dates and remove duplicates
  return [...new Set(result)].sort();
}

// Helper to determine shift type based on time
function getShiftTypeFromTime(time: string): "morning" | "evening" | "night" {
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 5 && hour < 12) return "morning";  // 5 AM to 11:59 AM
  if (hour >= 12 && hour < 18) return "evening"; // 12 PM to 5:59 PM
  return "night"; // 6 PM to 4:59 AM
}


// Custom error type for API responses
interface ApiError {
  error: string;
  message?: string;
}

export default function CreateSchedule() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    staff_ids: [] as string[],
    start_date: "",
    days: [] as string[],
    start_time: "",
    end_time: "",
    break_minutes: 60,
  });

  // Fetch staff to populate multi-select
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch("/api/staff");
        const data = await res.json();
        setStaffList(data.staff || []);
      } catch (error) {
        console.error("Error fetching staff:", error);
      }
    };
    fetchStaff();
  }, []);

  const toggleStaff = (id: string) => {
    setForm((prev) => ({
      ...prev,
      staff_ids: prev.staff_ids.includes(id)
        ? prev.staff_ids.filter((s) => s !== id)
        : [...prev.staff_ids, id],
    }));
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const submit = async () => {
    // Validation
    if (!form.start_date) {
      alert("Please select a start date");
      return;
    }
    if (form.staff_ids.length === 0) {
      alert("Please select at least one staff member");
      return;
    }
    if (form.days.length === 0) {
      alert("Please select at least one day of the week");
      return;
    }
    if (!form.start_time) {
      alert("Please select start time");
      return;
    }
    if (!form.end_time) {
      alert("Please select end time");
      return;
    }

    function validateShiftTimes(start: string, end: string): boolean {
  if (!start || !end) return false;

  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Allow overnight shifts
  if (startMinutes === endMinutes) return false; // same time not allowed
  return true;
}


    // Validate that end time is after start time
   // Replace your old validation
if (!validateShiftTimes(form.start_time, form.end_time)) {
  alert("End time must be after start time (or next day for overnight shifts)");
  return;
}


    setLoading(true);

    try {
      // Generate actual dates from weekdays
      const dates = getDatesFromWeekdays(form.start_date, form.days);
      
      if (dates.length === 0) {
        alert("No dates generated. Please check your selection.");
        setLoading(false);
        return;
      }

      // Determine shift type based on start time
      const shift_type = getShiftTypeFromTime(form.start_time);

      // Prepare data for API
      const requestData = {
        staff_ids: form.staff_ids,
        dates: dates,
        start_time: form.start_time,
        end_time: form.end_time,
        break_minutes: form.break_minutes,
        shift_type: shift_type,
        schedule_status: 'scheduled' // Default status for new schedules
      };

      console.log("Sending data:", requestData);

      const res = await fetch("/api/schedules/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle API error response
        const errorData = data as ApiError;
        throw new Error(errorData.error || errorData.message || "Failed to create schedule");
      }

      alert(`✅ Schedule created successfully! 
        • ${data.created} schedules created
        • ${dates.length} dates × ${form.staff_ids.length} staff
        • Total: ${data.created} records`);

      // Reset form
      setForm({
        staff_ids: [],
        start_date: "",
        days: [],
        start_time: "",
        end_time: "",
        break_minutes: 60,
      });

      // Redirect back to schedules page
      router.push("/schedules");
      
    } catch (error: unknown) {
      // Properly typed error handling
      console.error("Error creating schedule:", error);
      
      let errorMessage = "Failed to create schedule";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Preview generated dates
  const previewDates = form.start_date && form.days.length > 0 
    ? getDatesFromWeekdays(form.start_date, form.days).slice(0, 7) 
    : [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl text-black mb-6">Create Weekly Schedule</h1>

        {/* Staff multi-select */}
        <div className="mb-6">
          <label className="block font-medium mb-2 text-black">Select Staff</label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded">
            {staffList.map((s) => (
              <button
                key={s.staff_id}
                type="button"
                onClick={() => toggleStaff(s.staff_id)}
                className={`px-3 py-1 rounded border transition-colors ${
                  form.staff_ids.includes(s.staff_id)
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                    : "bg-white text-black border-gray-300 hover:bg-gray-100"
                }`}
              >
                {s.staff_name}
              </button>
            ))}
          </div>
          {form.staff_ids.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Selected: {form.staff_ids.length} staff
            </p>
          )}
        </div>

        {/* Start date */}
        <div className="mb-6">
          <label className="block font-medium mb-2 text-black">Week Starting From</label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, start_date: e.target.value }))
            }
            className="border px-3 py-2 rounded w-64 text-black"
          />
          <p className="text-sm text-gray-500 mt-1">This will be the Monday of the week</p>
        </div>

        {/* Weekdays buttons */}
        <div className="mb-6">
          <label className="block font-medium mb-2 text-black">Select Days of Week</label>
          <div className="flex gap-2 flex-wrap">
            {weekdays.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-4 py-2 rounded border transition-colors ${
                  form.days.includes(day)
                    ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                    : "bg-white text-black border-gray-300 hover:bg-gray-100"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Time and break */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium mb-1 text-black">Start Time</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, start_time: e.target.value }))
              }
              className="border px-3 py-2 rounded w-full text-black"
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-black">End Time</label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, end_time: e.target.value }))
              }
              className="border px-3 py-2 rounded w-full text-black"
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-black">Break (minutes)</label>
            <input
              type="number"
              min="0"
              max="180"
              step="15"
              value={form.break_minutes}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  break_minutes: Number(e.target.value),
                }))
              }
              className="border px-3 py-2 rounded w-full text-black"
            />
          </div>
        </div>

        {/* Preview */}
        {previewDates.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded border">
            <h3 className="font-medium text-black mb-2">Preview Dates (this week):</h3>
            <div className="flex flex-wrap gap-2">
              {previewDates.map((date, i) => {
                const dateObj = new Date(date);
                const dayName = weekdays[dateObj.getDay()];
                return (
                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {dayName} {date}
                  </span>
                );
              })}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Total: {previewDates.length} days this week × {form.staff_ids.length} staff = 
              <strong> {previewDates.length * form.staff_ids.length} schedules</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Note: Only generating schedules for one week
            </p>
          </div>
        )}

        {/* Submit button */}
        <div className="flex gap-3">
          <button
            onClick={submit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded transition-colors"
          >
            {loading ? "Creating..." : "Save Weekly Schedule"}
          </button>
          
          <button
            onClick={() => router.push("/schedules")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Layout>
  );
}