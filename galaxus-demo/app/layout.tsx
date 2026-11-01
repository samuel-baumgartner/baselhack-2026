import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Galaxus • PRISM demo",
  description:
    "Discover headphones, compare your shortlist and try a demo checkout with Galaxus on PRISM.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
