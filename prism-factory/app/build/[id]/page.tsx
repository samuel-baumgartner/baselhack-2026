import { Build } from "@/components/factory";
import { safeId } from "@/lib/http";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    safeId(id);
  } catch {
    notFound();
  }
  return <Build id={id} />;
}
