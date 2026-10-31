import type { Metadata } from "next";
import { DemoWorkspace } from "@/features/demo/workspace";

export const metadata: Metadata = { title: "Presence · Hotel owner" };

export default async function OwnerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const chapter =
    query.chapter === "book" || query.chapter === "reconnect"
      ? query.chapter
      : "publish";
  return <DemoWorkspace key={chapter} initialChapter={chapter} />;
}
