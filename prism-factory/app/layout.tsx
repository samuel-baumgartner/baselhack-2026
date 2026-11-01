import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
export const metadata: Metadata = {
  title: "PRISM — Your business. Inside their AI.",
  description:
    "One website becomes a new way to connect. Create branded shopping experiences for personal agents.",
  icons: {
    shortcut: "/favicon.ico?v=2",
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/images/prism-mark-32-v2.png", sizes: "32x32", type: "image/png" },
      { url: "/images/prism-mark-512-v2.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/images/prism-mark-180-v2.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    title: "PRISM — Your business. Inside their AI.",
    description: "Turn your website into agent-native customer experiences.",
  },
};
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
