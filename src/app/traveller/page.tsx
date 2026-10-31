import type { Metadata } from "next";
import { GrokWorkspace } from "@/features/demo/grok-workspace";

export const metadata: Metadata = { title: "Grok" };

export default function TravellerPage() {
  return <GrokWorkspace />;
}
