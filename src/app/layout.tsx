import type { Metadata } from "next";
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
    default: "Lifesci Prep",
    template: "%s | Lifesci Prep",
  },
  description: "Premium Life Science Test Preparation Platform",
};

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <AppUpdateChecker />
            <NotificationHandler />
            <NotificationDebug />
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
