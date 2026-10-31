import type { Metadata } from "next";
import { GrokWorkspace } from "@/features/demo/grok-workspace";

export const metadata: Metadata = { title: "Grok · Traveller demo" };

export default function TravellerPage() {
  return <GrokWorkspace />;
}
