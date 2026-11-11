"use client";

// =============================================================================
// File: components/SidebarNav.tsx
// Purpose: Zoom's left sidebar (300px wide): Home, the "My Products" list, and the
//          collapsed My Account / Admin / Support groups.
//          Only Home goes anywhere for now; the rest are placeholders that look like Zoom.
// Contains: SidebarNav component, SidebarRow helper, the static item lists
// Source: docs/zoom-design-analysis.md section 3.1-C and 3.2
// =============================================================================

import { ChevronRight, ExternalLink, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ProductItem {
  label: string;
  href?: string; // set only for items that lead to a page of this app
  showsNewBadge?: boolean;
  opensExternalProduct?: boolean; // shows the small "open in new tab" icon
}

// Static list, same order as Zoom's sidebar. "Meetings" is the highlighted item on the schedule page.
const PRODUCT_ITEMS: ProductItem[] = [
  { label: "AI", showsNewBadge: true, opensExternalProduct: true },
  { label: "Meetings", href: "/meeting" },
  { label: "Recordings" },
  { label: "Summaries" },
  { label: "Hub", showsNewBadge: true, opensExternalProduct: true },
  { label: "Whiteboards", opensExternalProduct: true },
  { label: "Notes" },
  { label: "Clips", opensExternalProduct: true },
  { label: "Canvas", opensExternalProduct: true },
  { label: "Paper", opensExternalProduct: true },
  { label: "Sheets", opensExternalProduct: true },
  { label: "Slides", opensExternalProduct: true },
  { label: "Tasks", opensExternalProduct: true },
  { label: "Scheduler", opensExternalProduct: true },
  { label: "Discover More Products" },
];

const COLLAPSED_GROUPS = ["My Account", "Admin", "Support"];

const ROW_BASE_CLASSES = "mx-1.5 flex h-9 w-[calc(100%-12px)] items-center rounded-control text-left text-base";

// Purpose: Render one clickable-looking row of the sidebar.
// Input:   label; isActive - highlight it; href - makes it a real link (omit for placeholders);
//          children - extra content on the right (badge, icon)
// Output:  a Link when href is given, otherwise a button that does nothing
function SidebarRow({
  label,
  isActive = false,
  href,
  children,
}: {
  label: string;
  isActive?: boolean;
  href?: string;
  children?: React.ReactNode;
}) {
  const colourClasses = isActive ? "bg-sidebar-active text-zoom-blue" : "text-ink hover:bg-sidebar-active";
  const classes = `${ROW_BASE_CLASSES} ${colourClasses} pl-[30px] pr-3`;

  const content = (
    <>
      <span className="flex-1 truncate">{label}</span>
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-current={isActive ? "page" : undefined}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={classes}>
      {content}
    </button>
  );
}

// Purpose: Render the whole sidebar.
// Output:  the <aside> element; highlights Home on "/" and Meetings on any "/meeting..." page
export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-[300px] shrink-0 bg-sidebar py-2.5">
      <SidebarRow label="Home" href="/" isActive={pathname === "/"} />

      {/* Margins tuned so the first product row sits where Zoom's does (reference screenshot). */}
      <p className="mt-[15px] mb-[9px] px-[13px] text-[13px] text-ink-muted">My Products</p>
      <ul>
        {PRODUCT_ITEMS.map((item) => (
          <li key={item.label}>
            <SidebarRow
              label={item.label}
              href={item.href}
              isActive={item.label === "Meetings" && pathname.startsWith("/meeting")}
            >
              {item.showsNewBadge && (
                <span className="mr-2 rounded-full bg-badge-new px-2 py-0.5 text-[11px] text-zoom-blue">New</span>
              )}
              {item.opensExternalProduct && (
                <ExternalLink size={16} className="text-ink-muted" aria-hidden="true" />
              )}
            </SidebarRow>
          </li>
        ))}
      </ul>

      <ul className="mt-5">
        {COLLAPSED_GROUPS.map((label) => (
          <li key={label}>
            {/* Same 30px text indent as the product rows; the chevron sits in the gap to its left. */}
            <button type="button" className={`${ROW_BASE_CLASSES} relative pl-[30px] text-ink hover:bg-sidebar-active`}>
              <ChevronRight size={16} className="absolute left-2 text-ink-muted" aria-hidden="true" />
              {label}
            </button>
          </li>
        ))}
      </ul>

      {/* Zoom shows this upsell pill on every Meetings page (schedule, details, list). Decoration only. */}
      {pathname.startsWith("/meeting") && (
        <button
          type="button"
          className="mx-auto mt-7 flex h-8 w-[146px] items-center justify-center gap-1.5 rounded-full border border-upgrade-border bg-upgrade-bg text-[15px] text-zoom-blue hover:brightness-95"
        >
          <Star size={14} fill="currentColor" aria-hidden="true" />
          Upgrade to Pro
        </button>
      )}
    </aside>
  );
}
