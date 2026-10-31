import {
  AppError,
  errorResponse,
  requireOperator,
  requireSameOrigin,
} from "@/server/auth";
import { transcribeAudio } from "@/server/services/transcribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await requireOperator(request);
    if (
      !/^audio\/(webm|mp4|ogg|wav|mpeg)(;|$)/i.test(
        request.headers.get("content-type") ?? "",
      )
    )
      throw new AppError(
        "INVALID_AUDIO",
        "Please send a microphone recording.",
        415,
      );
    if (Number(request.headers.get("content-length")) > 2_000_000)
      throw new AppError(
        "INVALID_AUDIO",
        "Record a request up to one minute.",
        413,
      );
    const reader = request.body?.getReader();
    if (!reader)
      throw new AppError("INVALID_AUDIO", "No recording was received.");
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > 2_000_000)
          throw new AppError(
            "INVALID_AUDIO",
            "Record a request up to one minute.",
            413,
          );
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    return Response.json(
      { text: await transcribeAudio(Buffer.concat(chunks)) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
