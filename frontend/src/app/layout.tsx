import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Samarthya AI — Inclusive Welfare & Credit Readiness",
  description: "AI-powered statutory scheme matching and fair credit readiness.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
