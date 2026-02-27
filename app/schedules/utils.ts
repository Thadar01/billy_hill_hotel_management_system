import { format, addDays, parseISO } from "date-fns";

export const getWeekDates = (startDate: string): string[] => {
  const dates: string[] = [];
  const start = parseISO(startDate);

  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    dates.push(format(date, "yyyy-MM-dd"));
  }

  return dates;
};

export const formatDateKey = (dateStr: string): string => {
  if (dateStr.includes("T")) return dateStr.split("T")[0];
  return dateStr;
};

export const formatDateDisplay = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[date.getUTCDay()]} ${month}/${day}`;
};

export const formatDateLong = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return `${days[date.getUTCDay()]}, ${months[date.getUTCMonth()]} ${day}, ${year}`;
};

export const convertTo12HourFormat = (timeStr: string): string => {
  if (!timeStr) return "--:--";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${hours}:${minutes} ${ampm}`;
};

export const formatTimeString = (timeStr: string | Date | null | undefined): string => {
  if (!timeStr) return "--:--";

  if (typeof timeStr === "string") {
    if (timeStr.includes(":")) return convertTo12HourFormat(timeStr);
    if (timeStr.includes("T")) {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
      }
    }
    return timeStr;
  }

  if (timeStr instanceof Date) {
    const hours = timeStr.getHours();
    const minutes = timeStr.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  return String(timeStr);
};

export const formatShiftTime = (
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string => {
  return `${formatTimeString(start)} - ${formatTimeString(end)}`;
};
