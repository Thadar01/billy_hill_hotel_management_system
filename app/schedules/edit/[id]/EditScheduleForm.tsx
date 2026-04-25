// app/schedules/edit/[id]/EditScheduleForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

interface EditScheduleFormProps {
  scheduleId: string;
}

interface ApiResponse {
  schedule: ScheduleData;
}

interface ErrorResponse {
  error: string;
}

export default function EditScheduleForm({ scheduleId }: EditScheduleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [attemptedAttendanceSubmit, setAttemptedAttendanceSubmit] = useState(false);
  
  const [formData, setFormData] = useState({
    staff_id: "",
    staff_name: "",
    schedule_date: "",
    planned_start_time: "",
    planned_end_time: "",
    break_minutes: 30,
    shift_type: "morning" as "morning" | "evening" | "night" | "",
    schedule_status: "scheduled" as "scheduled" | "cancelled" | "",
    actual_check_in: "",
    actual_check_out: "",
    attendance_status: "",
  });

  const [attendanceData, setAttendanceData] = useState({
    actual_check_in: "",
    actual_check_out: "",
    attendance_status: "",
    overtime_minutes: 0,
    late_minutes: 0,
    worked_hours: 0,
  });

useEffect(() => {
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/schedules/${scheduleId}`);
      
      if (!res.ok) {
        const errorData: ErrorResponse = await res.json();
        throw new Error(errorData.error || 'Failed to fetch schedule');
      }

      const data: ApiResponse = await res.json(); // { schedule: {...} }
      const schedule = data.schedule;

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      // Format time strings to HH:MM
      const formatTimeForInput = (timeStr: string | null): string => {
        if (!timeStr) return "";
        const [h, m] = timeStr.split(':');
        return `${h.padStart(2,'0')}:${m.padStart(2,'0')}`;
      };

      setFormData({
        staff_id: schedule.staff_id,
        staff_name: schedule.staff_name,
        schedule_date: schedule.schedule_date.split('T')[0],
        planned_start_time: formatTimeForInput(schedule.planned_start_time),
        planned_end_time: formatTimeForInput(schedule.planned_end_time),
        break_minutes: schedule.break_minutes,
        shift_type: schedule.shift_type || "",
        schedule_status: schedule.schedule_status || "scheduled",
        actual_check_in: formatTimeForInput(schedule.actual_check_in),
        actual_check_out: formatTimeForInput(schedule.actual_check_out),
        attendance_status: schedule.attendance_status || "",
      });

      setAttendanceData({
        actual_check_in: formatTimeForInput(schedule.actual_check_in),
        actual_check_out: formatTimeForInput(schedule.actual_check_out),
        attendance_status: schedule.attendance_status || "",
        overtime_minutes: schedule.overtime_minutes || 0,
        late_minutes: schedule.late_minutes || 0,
        worked_hours: schedule.worked_hours || 0,
      });

    } catch (err: unknown) {
      console.error('Error fetching schedule:', err);
      if (err instanceof Error) setError(err.message);
      else setError('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  if (scheduleId) fetchSchedule();
}, [scheduleId]);




  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

 const handleAttendanceChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  setAttendanceData(prev => {
    const updated = { ...prev, [name]: value };

 

    return updated;
  });
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    
    if (!formData.planned_start_time || !formData.planned_end_time || !formData.break_minutes || !formData.schedule_status) {
      alert("Please Fill all the required fields");
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const scheduleIdNum = parseInt(scheduleId, 10);

      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: scheduleIdNum,
          planned_start_time: formData.planned_start_time,
          planned_end_time: formData.planned_end_time,
          break_minutes: parseInt(formData.break_minutes.toString()),
          shift_type: formData.shift_type,
          schedule_status: formData.schedule_status,
        }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.error || 'Failed to update schedule');
      }

      // Redirect back to schedules page
      router.push('/schedules');
      router.refresh();
    } catch (err: unknown) {
      console.error('Error updating schedule:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update schedule');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAttendanceUpdate = async () => {
    setAttemptedAttendanceSubmit(true);
    if (!attendanceData.attendance_status) {
      alert("Please Fill all the required fields");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(scheduleId),
          action: 'status',
          attendance_status: attendanceData.attendance_status,
        }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.error || 'Failed to update attendance');
      }

      alert('Attendance updated successfully');
      router.refresh();
    } catch (err: unknown) {
      console.error('Error updating attendance:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update attendance');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      setSaving(true);
      
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.error || 'Failed to delete schedule');
      }

      router.push('/schedules');
      router.refresh();
    } catch (err: unknown) {
      console.error('Error deleting schedule:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete schedule');
      }
    } finally {
      setSaving(false);
    }
  };

  const formatTimeDisplay = (time: string): string => {
    if (!time) return '--:--';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-black">Loading schedule data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => router.back()}
            className="text-black text-xl font-bold hover:text-gray-700 transition-colors"
            title="Back"
          >
            &#8592;
          </button>
          <h1 className="text-3xl font-semibold text-black">Edit Schedule</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Schedule Edit Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Schedule Details</h2>
            
            {/* Staff Info (read-only) */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staff Name
                  </label>
                  <input
                    type="text"
                    value={formData.staff_name}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.schedule_date}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Time Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="planned_start_time" className={`block text-sm font-bold uppercase tracking-wider mb-1 ${attemptedSubmit && !formData.planned_start_time ? "text-red-500" : "text-gray-500"}`}>
                    Start Time <span className="text-[10px] font-normal opacity-70">(required)</span>
                  </label>
                  <input
                    type="time"
                    id="planned_start_time"
                    name="planned_start_time"
                    value={formData.planned_start_time}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !formData.planned_start_time ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                  />
                </div>
                <div>
                  <label htmlFor="planned_end_time" className={`block text-sm font-bold uppercase tracking-wider mb-1 ${attemptedSubmit && !formData.planned_end_time ? "text-red-500" : "text-gray-500"}`}>
                    End Time <span className="text-[10px] font-normal opacity-70">(required)</span>
                  </label>
                  <input
                    type="time"
                    id="planned_end_time"
                    name="planned_end_time"
                    value={formData.planned_end_time}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !formData.planned_end_time ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                  />
                </div>
              </div>

              {/* Break Minutes */}
              <div>
                <label htmlFor="break_minutes" className={`block text-sm font-bold uppercase tracking-wider mb-1 ${attemptedSubmit && !formData.break_minutes ? "text-red-500" : "text-gray-500"}`}>
                  Break Minutes <span className="text-[10px] font-normal opacity-70">(required)</span>
                </label>
                <input
                  type="number"
                  id="break_minutes"
                  name="break_minutes"
                  value={formData.break_minutes}
                  onChange={handleChange}
                  min="0"
                  max="180"
                  step="15"
                  className={`w-full px-3 py-2 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !formData.break_minutes ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                />
              </div>

              {/* Shift Type */}
              <div>
                <label htmlFor="shift_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Shift Type
                </label>
                <select
                  id="shift_type"
                  name="shift_type"
                  value={formData.shift_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </div>

              {/* Schedule Status */}
              <div>
                <label htmlFor="schedule_status" className={`block text-sm font-bold uppercase tracking-wider mb-1 ${attemptedSubmit && !formData.schedule_status ? "text-red-500" : "text-gray-500"}`}>
                  Schedule Status <span className="text-[10px] font-normal opacity-70">(required)</span>
                </label>
                <select
                  id="schedule_status"
                  name="schedule_status"
                  value={formData.schedule_status}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !formData.schedule_status ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </form>
          </div>

          {/* Attendance Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Attendance Details</h2>
            
            <div className="space-y-4">
              {/* Read-only attendance summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Current Attendance</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Duty In:</span>
                    <p className="font-medium text-black">{formatTimeDisplay(attendanceData.actual_check_in)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Duty Out:</span>
                    <p className="font-medium text-black">{formatTimeDisplay(attendanceData.actual_check_out)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-medium text-black capitalize">{attendanceData.attendance_status || 'pending'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Worked Hours:</span>
                    <p className="font-medium text-black">{attendanceData.worked_hours}h</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Late Minutes:</span>
                    <p className="font-medium text-black">{attendanceData.late_minutes} min</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Overtime:</span>
                    <p className="font-medium text-black">{attendanceData.overtime_minutes} min</p>
                  </div>
                   <div>
                    <span className="text-gray-500">Duty In Time:</span>
                    <p className="font-medium text-black">{attendanceData.actual_check_in || "N/A"}</p>
                  </div>
                   <div>
                    <span className="text-gray-500">Duty Out Time:</span>
                    <p className="font-medium text-black">{attendanceData.actual_check_out || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Manual attendance update form */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-3">Manual Attendance Update</h3>
                <div className="space-y-3">
                 
                  
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${attemptedAttendanceSubmit && !attendanceData.attendance_status ? "text-red-500" : "text-gray-500"}`}>
                      Attendance Status <span className="font-normal opacity-70">(required)</span>
                    </label>
                    <select
                      name="attendance_status"
                      value={attendanceData.attendance_status}
                      onChange={handleAttendanceChange}
                      className={`w-full px-3 py-2 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedAttendanceSubmit && !attendanceData.attendance_status ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                    >
                      <option value="">Select Status</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="leave">Leave</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAttendanceUpdate}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Updating...' : 'Update Attendance'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}