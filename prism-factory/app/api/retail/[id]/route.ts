import { NextResponse } from "next/server";
import { retail } from "@/lib/retail/store";
import { definitions, type ToolName } from "@/lib/retail/tools";
import { failure, safeId } from "@/lib/http";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { name, ...args } = await req.json();
    if (typeof name !== "string" || !Object.hasOwn(definitions, name))
      throw Error("Unknown action");
    const def = definitions[name as ToolName],
      parsed = def.schema.parse(args);
    return NextResponse.json({
      ok: true,
      state: await retail(safeId((await params).id), { ...parsed, name }),
    });
  } catch (e) {
    return failure(e);
  }
}
