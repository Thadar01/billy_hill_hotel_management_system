export interface Schedule {
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

export interface Shift {
  id: number;
  start_time: string;
  end_time: string;
  break_minutes: number;
  shift_type: string | null;
  status: string | null;
  actual_check_in: string | null;
  actual_check_out: string | null;
  attendance_status: string;
  worked_hours?: number;        // optional
  overtime_minutes?: number;    // optional
  late_minutes?: number;        // optional
}

export interface WeekSchedule {
  staff_id: string;
  staff_name: string;
  shifts: {
    [date: string]: Shift | null;
  };
}

export interface ApiResponse {
  schedules: Schedule[];
}

export interface ErrorResponse {
  error: string;
}
