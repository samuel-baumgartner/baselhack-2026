import { DemoWorkspace } from "@/features/demo/workspace";
export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const chapter =
    query.chapter === "book" || query.chapter === "reconnect"
      ? query.chapter
      : "publish";
  return (
    <DemoWorkspace
      initialChapter={chapter}
      initialActor={query.actor === "owner" ? "owner" : "traveller"}
    />
  );
}
