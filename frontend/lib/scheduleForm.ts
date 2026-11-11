// =============================================================================
// File: lib/scheduleForm.ts
// Purpose: The data and rules behind the Schedule form, kept out of the component so they are
//          easy to read: default values, dropdown options, validation and conversion into the
//          request the backend expects.
// Contains: ScheduleFormValues, createDefaultFormValues, START_TIME_OPTIONS, MERIDIEM_OPTIONS,
//           DURATION_HOUR_OPTIONS, DURATION_MINUTE_OPTIONS, validateScheduleForm, buildScheduleRequest
// =============================================================================

import { format, roundToNearestMinutes } from "date-fns";

import type { ScheduleMeetingRequest } from "@/lib/apiTypes";

const DEFAULT_TOPIC = "My Meeting"; // Zoom's default topic
const DEFAULT_DURATION_MINUTES = 40; // Zoom's default length
const MAX_DURATION_MINUTES = 24 * 60; // same limit as the backend
const START_TIME_STEP_MINUTES = 15;
const DURATION_MINUTE_STEP = 5;
const MAX_DURATION_HOURS = 24;

export type Meridiem = "AM" | "PM";

// Everything the user can change in the form.
export interface ScheduleFormValues {
  topic: string;
  description: string;
  date: string; // "yyyy-MM-dd", the value format of <input type="date">
  startTime: string; // "5:30" (12-hour clock, AM/PM is separate)
  meridiem: Meridiem;
  durationHours: number;
  durationMinutes: number;
  hasPasscode: boolean;
}

// Purpose: The values the form starts with: Zoom's defaults and the next half hour from now.
// Output:  a new ScheduleFormValues (call it in the browser only, it reads the current time)
export function createDefaultFormValues(): ScheduleFormValues {
  // "ceil" rounds up, so at 5:18 PM the default start is 5:30 PM, like Zoom.
  const start = roundToNearestMinutes(new Date(), { nearestTo: 30, roundingMethod: "ceil" });

  return {
    topic: DEFAULT_TOPIC,
    description: "",
    date: format(start, "yyyy-MM-dd"),
    startTime: format(start, "h:mm"),
    meridiem: format(start, "a") as Meridiem,
    durationHours: Math.floor(DEFAULT_DURATION_MINUTES / 60),
    durationMinutes: DEFAULT_DURATION_MINUTES % 60,
    hasPasscode: true,
  };
}

// Purpose: Build a list of dropdown options for the start time: 12:00, 12:15 ... 11:45.
// Output:  [{ value: "12:00", text: "12:00" }, ...] (clock order starts at 12, like a clock face)
function buildStartTimeOptions(): { value: string; text: string }[] {
  const options: { value: string; text: string }[] = [];
  for (const hour of [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
    for (let minute = 0; minute < 60; minute += START_TIME_STEP_MINUTES) {
      const text = `${hour}:${String(minute).padStart(2, "0")}`;
      options.push({ value: text, text });
    }
  }
  return options;
}

export const START_TIME_OPTIONS = buildStartTimeOptions();

export const MERIDIEM_OPTIONS = [
  { value: "AM", text: "AM" },
  { value: "PM", text: "PM" },
];

// 0 to 24 hours.
export const DURATION_HOUR_OPTIONS = Array.from({ length: MAX_DURATION_HOURS + 1 }, (_, hour) => ({
  value: hour,
  text: String(hour),
}));

// 0, 5, 10 ... 55 minutes (includes the default 40).
export const DURATION_MINUTE_OPTIONS = Array.from({ length: 60 / DURATION_MINUTE_STEP }, (_, index) => ({
  value: index * DURATION_MINUTE_STEP,
  text: String(index * DURATION_MINUTE_STEP),
}));

// Purpose: Total length chosen in the two duration dropdowns.
function calculateDurationMinutes(values: ScheduleFormValues): number {
  return values.durationHours * 60 + values.durationMinutes;
}

// Purpose: Check the form before sending it.
// Input:   values - the current form values
// Output:  an error message for the user, or null when everything is fine
// Note:    "start time is in the past" is checked by the backend, which is the single source of truth for it.
export function validateScheduleForm(values: ScheduleFormValues): string | null {
  if (values.topic.trim() === "") {
    return "Enter a topic for the meeting.";
  }
  if (values.date === "") {
    return "Pick a date for the meeting.";
  }

  const durationMinutes = calculateDurationMinutes(values);
  if (durationMinutes < 1) {
    return "The duration must be at least 1 minute.";
  }
  if (durationMinutes > MAX_DURATION_MINUTES) {
    return "The duration cannot be longer than 24 hours.";
  }
  return null;
}

// Purpose: Combine the date, time and AM/PM dropdowns into one moment in the viewer's time zone.
// Input:   values - the form values (date and startTime must be valid)
// Output:  the moment as an ISO string in UTC, e.g. "2026-11-11T12:00:00.000Z"
// How it works: new Date(year, month, day, hour, minute) uses the browser's local time zone, and
//   toISOString() converts it to UTC, which is what the backend stores.
function buildStartTimeIso(values: ScheduleFormValues): string {
  const [year, month, day] = values.date.split("-").map(Number);
  const [hourText, minuteText] = values.startTime.split(":");

  // 12 AM is hour 0 and 12 PM is hour 12: "% 12" maps 12 to 0, then PM adds 12.
  const hour24 = (Number(hourText) % 12) + (values.meridiem === "PM" ? 12 : 0);
  const localStart = new Date(year, month - 1, day, hour24, Number(minuteText));
  return localStart.toISOString();
}

// Purpose: Turn the form values into the body of POST /api/meetings/schedule.
// Input:   values - validated form values
// Output:  ScheduleMeetingRequest
export function buildScheduleRequest(values: ScheduleFormValues): ScheduleMeetingRequest {
  const description = values.description.trim();

  return {
    title: values.topic.trim(),
    description: description === "" ? null : description,
    scheduled_start: buildStartTimeIso(values),
    duration_minutes: calculateDurationMinutes(values),
    has_passcode: values.hasPasscode,
  };
}
