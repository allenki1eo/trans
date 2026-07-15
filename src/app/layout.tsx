import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "TransTrack",
  description: "Transit & goods tracking for logistics operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={getLocale()}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
