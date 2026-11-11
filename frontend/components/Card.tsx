// =============================================================================
// File: components/Card.tsx
// Purpose: The white rounded box with a soft shadow that every dashboard section sits in
//          (profile, quick actions, meetings, recent meetings).
// Contains: Card component
// =============================================================================

// Purpose: A styled container.
// Input:   children - the content; className - optional extra classes (e.g. spacing)
// Output:  a white card, 12px radius, 24px padding, soft shadow
export default function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-card bg-white p-6 shadow-card ${className}`}>{children}</section>;
}
