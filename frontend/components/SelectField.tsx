// =============================================================================
// File: components/SelectField.tsx
// Purpose: A dropdown (native <select>) with Zoom's chevron arrow, used in the schedule form
//          for the time, AM/PM, duration and time zone fields.
// Contains: SelectField component
// =============================================================================

import { ChevronDown } from "lucide-react";

import { SELECT_CLASSES } from "@/lib/uiClasses";

interface SelectFieldProps {
  label: string; // accessible name for screen readers (the visible label sits elsewhere)
  value: string | number;
  options: { value: string | number; text: string }[];
  onChange: (newValue: string) => void;
  widthClass?: string; // e.g. "w-[195px]"; default is the full width of the parent
}

// Purpose: Render the dropdown.
// Input:   see SelectFieldProps; onChange receives the selected value as a string
// Output:  the select with a chevron icon laid over its right end
export default function SelectField({ label, value, options, onChange, widthClass = "w-full" }: SelectFieldProps) {
  return (
    <div className={`relative ${widthClass}`}>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={SELECT_CLASSES}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.text}
          </option>
        ))}
      </select>
      {/* pointer-events-none lets clicks pass through the icon to the select underneath. */}
      <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2" aria-hidden="true" />
    </div>
  );
}
