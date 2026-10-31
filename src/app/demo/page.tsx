import { redirect } from "next/navigation";
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
  redirect(
    query.actor === "traveller" && chapter !== "publish"
      ? "/traveller"
      : `/owner?chapter=${chapter}`,
  );
}
