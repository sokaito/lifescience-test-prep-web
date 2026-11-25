import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LifeSci Prep — CSIR NET, GATE, DBT-BET & ICMR JRF",
    template: "%s | LifeSci Prep",
  },
  description:
    "Focused mock tests, previous year question papers, and analytics for CSIR NET, GATE XL, DBT-BET, and ICMR JRF Life Sciences.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

import LayoutWrapper from "@/components/LayoutWrapper";
import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import NotificationHandler from "@/components/NotificationHandler";
import NotificationDebug from "@/components/NotificationDebug";
import AppUpdateChecker from "@/components/AppUpdateChecker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <ThemeProvider>
          <AuthProvider>
            <AppUpdateChecker />
            <NotificationHandler />
            <NotificationDebug />
            <LayoutWrapper>{children}</LayoutWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
