import type { ReactNode } from "react";
import config from "@/app-config.json";
import "./globals.css";
import "./merchant.css";
export const metadata = { title: `${config.company.name} · PRISM local app`, description: config.company.description };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
