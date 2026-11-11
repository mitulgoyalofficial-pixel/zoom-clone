"use client";

// =============================================================================
// File: components/ScheduleMeetingForm.tsx
// Purpose: The Schedule Meeting page content (zoom.us/meeting/schedule look): topic,
//          optional description, date and time, duration and passcode are real and are saved
//          through the API; Time Zone, Meeting ID, Waiting Room and Video are visual only.
// Contains: ScheduleMeetingForm (page header + client-only fields), ScheduleFormFields
// Source: docs/zoom-design-analysis.md section 3.2
// =============================================================================

import { ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import FormRow from "@/components/FormRow";
import SelectField from "@/components/SelectField";
import { useIsClient } from "@/hooks/useIsClient";
import { ApiError, scheduleMeeting } from "@/lib/apiClient";
import { formatTimeZoneOffset } from "@/lib/formatters";
import {
  buildScheduleRequest,
  createDefaultFormValues,
  DURATION_HOUR_OPTIONS,
  DURATION_MINUTE_OPTIONS,
  MERIDIEM_OPTIONS,
  START_TIME_OPTIONS,
  validateScheduleForm,
  type Meridiem,
  type ScheduleFormValues,
} from "@/lib/scheduleForm";
import { PRIMARY_BUTTON_CLASSES, SOFT_BUTTON_CLASSES, TEXT_INPUT_CLASSES } from "@/lib/uiClasses";

const HELPER_TEXT_CLASSES = "mt-1.5 text-[15px] text-ink-muted";
const CHECKBOX_CLASSES = "size-4 accent-zoom-blue";

// Purpose: Render the page header and, in the browser only, the form fields.
// Output:  the page content
// How it works: the fields start from today's date and the next half hour, which cannot be known
//   while the page is prerendered at build time, so they are rendered once the browser is ready.
export default function ScheduleMeetingForm() {
  const isClient = useIsClient();

  return (
    <div className="px-4 pt-6 pb-14 sm:px-8 sm:pt-8">
      <Link href="/meeting" className="inline-flex items-center gap-1 text-[15px] text-zoom-blue hover:underline">
        <ChevronLeft size={16} aria-hidden="true" />
        Back to Meetings
      </Link>
      <h1 className="mt-4 text-[22px] font-bold">Schedule Meeting</h1>
      {isClient && <ScheduleFormFields />}
    </div>
  );
}

// Purpose: The form itself: state, validation, saving and the rows.
// Output:  the <form> element
function ScheduleFormFields() {
  const router = useRouter();
  const [formValues, setFormValues] = useState<ScheduleFormValues>(createDefaultFormValues);
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Purpose: Change one field of the form values.
  // Input:   fieldName - e.g. "topic"; newValue - its new value
  function updateField<FieldName extends keyof ScheduleFormValues>(
    fieldName: FieldName,
    newValue: ScheduleFormValues[FieldName],
  ) {
    setFormValues((previous) => ({ ...previous, [fieldName]: newValue }));
  }

  // Purpose: Save button: validate, send to the backend, then open the new meeting's details page.
  // Input:   the form submit event
  async function saveMeeting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validateScheduleForm(formValues);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const meeting = await scheduleMeeting(buildScheduleRequest(formValues));
      // Reset first: Next.js keeps this page mounted but hidden, so without it the old
      // values would still be in the form when the user comes back (see the Next.js "preserving UI state" guide).
      setFormValues(createDefaultFormValues());
      setIsDescriptionVisible(false);
      setIsSaving(false);
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Could not save the meeting. Please try again.");
      setIsSaving(false);
    }
  }

  const timeZoneLabel = `(${formatTimeZoneOffset(new Date())}) ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;

  return (
    <form onSubmit={saveMeeting} noValidate>
      <FormRow label="Topic" isRequired htmlFor="topic">
        <div className="w-[490px] max-w-full">
          <input
            id="topic"
            type="text"
            value={formValues.topic}
            maxLength={200}
            onChange={(event) => updateField("topic", event.target.value)}
            className={TEXT_INPUT_CLASSES}
          />
        </div>
      </FormRow>

      <FormRow label={isDescriptionVisible ? "Description" : undefined} htmlFor="description">
        {isDescriptionVisible ? (
          <textarea
            id="description"
            value={formValues.description}
            maxLength={2000}
            rows={3}
            onChange={(event) => updateField("description", event.target.value)}
            className="w-[490px] max-w-full rounded-control border border-input-border bg-white px-3 py-2 text-[15px] outline-none focus:border-zoom-blue"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsDescriptionVisible(true)}
            className="flex items-center gap-1 pt-1 text-[15px] text-zoom-blue hover:underline"
          >
            <Plus size={16} aria-hidden="true" />
            Add Description
          </button>
        )}
      </FormRow>

      <FormRow label="When" htmlFor="meeting-date">
        <div className="flex flex-wrap gap-3">
          <div className="w-[240px] max-w-full">
            <input
              id="meeting-date"
              type="date"
              value={formValues.date}
              onChange={(event) => updateField("date", event.target.value)}
              className={TEXT_INPUT_CLASSES}
            />
          </div>
          <SelectField
            label="Start time"
            value={formValues.startTime}
            options={START_TIME_OPTIONS}
            onChange={(newValue) => updateField("startTime", newValue)}
            widthClass="w-[195px]"
          />
          <SelectField
            label="AM or PM"
            value={formValues.meridiem}
            options={MERIDIEM_OPTIONS}
            onChange={(newValue) => updateField("meridiem", newValue as Meridiem)}
            widthClass="w-[103px]"
          />
        </div>
      </FormRow>

      <FormRow label="Duration">
        <div className="flex items-center gap-2 text-[15px]">
          <SelectField
            label="Duration hours"
            value={formValues.durationHours}
            options={DURATION_HOUR_OPTIONS}
            onChange={(newValue) => updateField("durationHours", Number(newValue))}
            widthClass="w-[110px] sm:w-[150px]"
          />
          hr
          <SelectField
            label="Duration minutes"
            value={formValues.durationMinutes}
            options={DURATION_MINUTE_OPTIONS}
            onChange={(newValue) => updateField("durationMinutes", Number(newValue))}
            widthClass="w-[110px] sm:w-[150px]"
          />
          min
        </div>
      </FormRow>

      {/* Visual only: times are always converted from the browser's own time zone. */}
      <FormRow label="Time Zone">
        <div className="w-[490px] max-w-full">
          <SelectField label="Time zone" value="browser" options={[{ value: "browser", text: timeZoneLabel }]} onChange={() => {}} />
        </div>
      </FormRow>

      {/* Visual only: every meeting gets an automatically generated ID. */}
      <FormRow label="Meeting ID">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 pt-1 text-[15px]">
          <label className="flex items-center gap-2">
            <input type="radio" name="meeting-id-type" defaultChecked className={CHECKBOX_CLASSES} />
            Generate Automatically
          </label>
          <label className="flex items-center gap-2 text-ink-muted">
            <input type="radio" name="meeting-id-type" disabled className={CHECKBOX_CLASSES} />
            Personal Meeting ID 123 456 7890
          </label>
        </div>
      </FormRow>

      <FormRow label="Security">
        <div className="flex flex-wrap items-center gap-3 pt-1 text-[15px]">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formValues.hasPasscode}
              onChange={(event) => updateField("hasPasscode", event.target.checked)}
              className={CHECKBOX_CLASSES}
            />
            Passcode
          </label>
          {/* The server generates the passcode when the meeting is saved, so it cannot be shown or typed here. */}
          {formValues.hasPasscode && (
            <div className="w-[240px]">
              <input type="text" readOnly disabled value="Generated when you save" className={TEXT_INPUT_CLASSES} />
            </div>
          )}
        </div>
        <p className={HELPER_TEXT_CLASSES}>
          {formValues.hasPasscode
            ? "Only users who have the invite link or passcode can join the meeting"
            : "Anyone with the meeting ID or invite link can join the meeting"}
        </p>

        {/* Visual only: there is no waiting room in this clone. */}
        <label className="mt-4 flex items-center gap-2 text-[15px]">
          <input type="checkbox" className={CHECKBOX_CLASSES} />
          Waiting Room
        </label>
        <p className={HELPER_TEXT_CLASSES}>Only users admitted by the host can join the meeting</p>
      </FormRow>

      <hr className="mt-6 border-line" />

      {/* Visual only: the pre-join camera and microphone toggles are not stored per meeting. */}
      <FormRow label="Video">
        <div className="text-[15px]">
          {["Host", "Participant"].map((role) => (
            <div key={role} className="mt-1 flex items-center first:mt-0">
              <span className="w-[150px]">{role}</span>
              <label className="mr-6 flex items-center gap-2">
                <input type="radio" name={`video-${role}`} defaultChecked className={CHECKBOX_CLASSES} />
                on
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name={`video-${role}`} className={CHECKBOX_CLASSES} />
                off
              </label>
            </div>
          ))}
        </div>
      </FormRow>

      {errorMessage && (
        <p role="alert" className="mt-6 text-[15px] text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="mt-8 flex gap-2.5">
        <button type="submit" disabled={isSaving} className={PRIMARY_BUTTON_CLASSES}>
          {isSaving ? "Saving..." : "Save"}
        </button>
        <Link href="/meeting" className={SOFT_BUTTON_CLASSES}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
