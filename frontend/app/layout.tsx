// =============================================================================
// File: app/layout.tsx
// Purpose: The root layout wrapped around every page: loads the Inter font,
//          sets the page title and renders the <html>/<body> shell.
// Note: the Zoom header/sidebar are NOT here; they live in app/(site)/layout.tsx
//       so the full-screen meeting room can skip them.
// =============================================================================

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter-like sans font (analysis section 1); next/font self-hosts it, so no request goes to Google.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zoom Clone",
  description: "A learning project that recreates the Zoom web app: meetings, scheduling and joining.",
};

// Purpose: Wrap every page in <html> and <body>.
// Input:   children - the page being rendered
// Output:  the document shell with the Inter font variable applied
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
