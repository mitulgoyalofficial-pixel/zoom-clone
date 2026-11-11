// =============================================================================
// File: components/ActionTile.tsx
// Purpose: One of the big coloured quick-action buttons on the dashboard (New Meeting,
//          Join, Schedule): a 50px rounded square with a white icon and a label under it.
// Contains: ActionTile component
// Source: docs/zoom-design-analysis.md section 3.1-G
// =============================================================================

import Link from "next/link";

interface ActionTileProps {
  label: string;
  icon: React.ReactNode;
  colorClass: string; // Tailwind background class, e.g. "bg-zoom-orange"
  href?: string; // give href to make the tile a link to another page...
  onClick?: () => void; // ...or onClick to make it a button that runs code
  isDisabled?: boolean; // only used for the button version (e.g. while a request is running)
}

// Purpose: Render the tile as a link (when href is set) or as a button (otherwise).
// Input:   see ActionTileProps
// Output:  the clickable tile
export default function ActionTile({ label, icon, colorClass, href, onClick, isDisabled = false }: ActionTileProps) {
  const tileContent = (
    <>
      <span className={`flex size-[50px] items-center justify-center rounded-card text-white ${colorClass}`}>
        {icon}
      </span>
      {/* nowrap: "New Meeting" is wider than its 93px column and must stay on one line like Zoom's labels. */}
      <span className="text-base whitespace-nowrap text-ink/80">{label}</span>
    </>
  );
  const classes = "flex flex-col items-center gap-1.5 hover:opacity-90 disabled:opacity-60";

  if (href) {
    return (
      <Link href={href} className={classes}>
        {tileContent}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={isDisabled} className={classes}>
      {tileContent}
    </button>
  );
}
