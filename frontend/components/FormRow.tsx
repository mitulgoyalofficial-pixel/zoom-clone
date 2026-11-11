// =============================================================================
// File: components/FormRow.tsx
// Purpose: One row of the schedule form: the label on the left (170px column) and the
//          controls on the right. Required rows get Zoom's red asterisk before the label.
// Contains: FormRow component
// Source: docs/zoom-design-analysis.md section 3.2
// =============================================================================

interface FormRowProps {
  label?: string; // leave out for rows without a label (e.g. the "+ Add Description" link)
  isRequired?: boolean;
  htmlFor?: string; // id of the input this label belongs to (lets a click on the label focus it)
  children: React.ReactNode;
}

// Purpose: Lay out a label and its controls side by side.
// Input:   see FormRowProps
// Output:  the row; rows are 20px apart (the controls are 32px high, so ~52px per row like Zoom)
export default function FormRow({ label, isRequired = false, htmlFor, children }: FormRowProps) {
  return (
    <div className="mt-5 flex items-start">
      <label htmlFor={htmlFor} className="relative w-[170px] shrink-0 pt-1 text-[15px]">
        {isRequired && (
          <span className="absolute -left-2.5 text-red-600" aria-hidden="true">
            *
          </span>
        )}
        {label}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
