import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Manrope, Sora } from "next/font/google";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "GENQUIZ | Your AI Playground",
  description: "A futuristic AI-powered multiplayer quiz platform."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#060711"
};

const displayFont = Sora({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display"
});

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans"
});

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}
