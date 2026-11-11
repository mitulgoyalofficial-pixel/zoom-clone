// =============================================================================
// File: components/Avatar.tsx
// Purpose: The coloured square (or circle) with a person's first initial, used in
//          the navbar, the profile card and later the participants list.
// Contains: Avatar component
// =============================================================================

interface AvatarProps {
  name: string;
  color: string; // hex background colour, comes from users.avatar_color
  sizePx: number;
  className?: string; // use it to change the shape, e.g. "rounded-full"; default is a rounded square
}

// Purpose: Show a person's initial on a coloured background.
// Input:   name - person's name; color - background hex; sizePx - width and height;
//          className - optional extra Tailwind classes (shape)
// Output:  a div with the first letter of the name, white on `color`
export default function Avatar({ name, color, sizePx, className = "rounded-md" }: AvatarProps) {
  const initial = name.trim().charAt(0) || "?";

  return (
    <div
      // Inline style because the colour and size are runtime values; Tailwind classes are fixed at build time.
      style={{ backgroundColor: color, width: sizePx, height: sizePx, fontSize: sizePx * 0.55 }}
      className={`flex shrink-0 items-center justify-center font-medium text-white select-none ${className}`}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
