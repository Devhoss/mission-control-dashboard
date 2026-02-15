import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { getDefaultWorkspace } from "@/lib/workspace-path";
import { Providers } from "./providers";
import { Nav } from "@/components/nav";
import { PageTransition } from "@/components/page-transition";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpenClaw Mission Control",
  description: "Mission Control Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const defaultWorkspace = getDefaultWorkspace();
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className} font-sans glass-texture min-h-screen`}>
        <Providers defaultWorkspace={defaultWorkspace}>
          <Suspense fallback={<nav className="h-12 border-b border-white/[0.06] bg-white/[0.03]" />}>
            <Nav />
          </Suspense>
          <main className="relative z-10 min-h-[calc(100vh-3rem)]">
            <PageTransition>{children}</PageTransition>
          </main>
        </Providers>
      </body>
    </html>
  );
}
