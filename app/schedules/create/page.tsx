"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";

interface Staff {
  staff_id: string;
  staff_name: string;
  role?: string;
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
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [form, setForm] = useState({
    staff_ids: [] as string[],
    start_date: "",
    days: [] as string[],
    start_time: "",
    end_time: "",
    break_minutes: 60,
  });

  const isFieldInvalid = (fieldName: keyof typeof form) => {
    if (!attemptedSubmit) return false;
    if (Array.isArray(form[fieldName])) return (form[fieldName] as string[]).length === 0;
    return !form[fieldName];
  };

  // Fetch staff to populate multi-select
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch("/api/staff");
        const data = await res.json();
        
        // Filter only allowed roles: receptionist, housekeeping, and staff
        const filtered = (data.staff || []).filter((s: Staff) => {
          const role = (s.role || "").toLowerCase().trim();
          return role === "receptionist" || role === "housekeeping" || role === "staff";
        });
        
        setStaffList(filtered);
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
    setAttemptedSubmit(true);

    // Validation
    if (isFieldInvalid("start_date") || isFieldInvalid("staff_ids") || isFieldInvalid("days") || isFieldInvalid("start_time") || isFieldInvalid("end_time")) {
      alert("Please Fill all the required fields");
      return;
    }

    function validateShiftTimes(start: string, end: string): boolean {
      if (!start || !end) return false;
      const [startH, startM] = start.split(":").map(Number);
      const [endH, endM] = end.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      if (startMinutes === endMinutes) return false; 
      return true;
    }

    if (!validateShiftTimes(form.start_time, form.end_time)) {
      alert("End time must be after start time (or next day for overnight shifts)");
      return;
    }

    setLoading(true);

    try {
      const dates = getDatesFromWeekdays(form.start_date, form.days);
      if (dates.length === 0) {
        alert("No dates generated. Please check your selection.");
        setLoading(false);
        return;
      }

      const shift_type = getShiftTypeFromTime(form.start_time);
      const requestData = {
        staff_ids: form.staff_ids,
        dates: dates,
        start_time: form.start_time,
        end_time: form.end_time,
        break_minutes: form.break_minutes,
        shift_type: shift_type,
        schedule_status: 'scheduled'
      };

      const res = await fetch("/api/schedules/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to create schedule");

      alert(`✅ Schedule created successfully!`);
      router.push("/schedules");
    } catch (error: any) {
      alert(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const previewDates = form.start_date && form.days.length > 0 
    ? getDatesFromWeekdays(form.start_date, form.days).slice(0, 7) 
    : [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl text-black border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/schedules")}
            className="text-black text-xl font-bold hover:text-gray-700 transition-colors"
            title="Back"
          >
            &#8592;
          </button>
          <h1 className="text-3xl font-bold text-black tracking-tight">Create Weekly Schedule</h1>
        </div>

        {/* Staff multi-select */}
        <div className="mb-8">
          <label className={`block font-bold uppercase tracking-wider mb-3 ${isFieldInvalid("staff_ids") ? "text-red-500" : "text-gray-500 text-sm"}`}>
            Select Staff <span className="text-[10px] font-normal opacity-70">(required)</span>
          </label>
          <div className={`flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 border rounded-xl transition-all ${isFieldInvalid("staff_ids") ? "border-red-500 bg-red-50" : "border-gray-200"}`}>
            {staffList.map((s) => (
              <button
                key={s.staff_id}
                type="button"
                onClick={() => toggleStaff(s.staff_id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  form.staff_ids.includes(s.staff_id)
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                }`}
              >
                {s.staff_name} <span className="text-[10px] opacity-70">({s.role})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Start date */}
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-3 ${isFieldInvalid("start_date") ? "text-red-500" : "text-gray-500 text-sm"}`}>
              Week Starting From <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-xl text-black transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${isFieldInvalid("start_date") ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            />
          </div>

          {/* Weekdays buttons */}
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-3 ${isFieldInvalid("days") ? "text-red-500" : "text-gray-500 text-sm"}`}>
              Days of Week <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <div className={`flex gap-2 flex-wrap p-2 border rounded-xl transition-all ${isFieldInvalid("days") ? "border-red-500 bg-red-50" : "border-gray-200"}`}>
              {weekdays.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-lg border text-xs font-bold uppercase transition-all ${
                    form.days.includes(day)
                      ? "bg-green-600 text-white border-green-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Time and break */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-3 ${isFieldInvalid("start_time") ? "text-red-500" : "text-gray-500 text-sm"}`}>
              Start Time <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-xl text-black transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${isFieldInvalid("start_time") ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            />
          </div>

          <div>
            <label className={`block font-bold uppercase tracking-wider mb-3 ${isFieldInvalid("end_time") ? "text-red-500" : "text-gray-500 text-sm"}`}>
              End Time <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-xl text-black transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${isFieldInvalid("end_time") ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            />
          </div>

          <div>
            <label className="block font-bold text-gray-500 text-sm uppercase tracking-wider mb-3">Break (minutes)</label>
            <input
              type="number"
              min="0"
              max="180"
              step="15"
              value={form.break_minutes}
              onChange={(e) => setForm((prev) => ({ ...prev, break_minutes: Number(e.target.value) }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Submit buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg transition-all"
          >
            {loading ? "Creating..." : "Generate & Save Schedule"}
          </button>
          
          <button
            onClick={() => router.push("/schedules")}
            className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </Layout>
  );
}