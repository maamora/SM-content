import type { Metadata } from "next";
import "./globals.css";
import "./signal-press.css";
/* QUIET STUDIO: authenticated-only minimal product system, loaded after legacy and Signal Press layers. */
import "./quiet-studio.css";

export const metadata: Metadata = {
  title: "STUDIO | Creative operations in motion",
  description: "A living creative workspace for teams building visual systems, campaigns, and content that moves.",
  keywords: ["STUDIO", "creative operations", "AI creative workspace", "content generation", "campaign system"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
