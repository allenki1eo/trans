import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/locale";
import { getTheme } from "@/lib/theme/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dami&Co",
  description: "Transit & goods tracking for logistics operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = getTheme();
  return (
    <html lang={getLocale()} className={theme === "dark" ? "dark" : undefined}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
