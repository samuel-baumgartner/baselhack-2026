import { errorResponse, requireOperator } from "@/server/auth";
import { getSnapshot } from "@/server/services/snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireOperator(request);
  } catch (error) {
    return errorResponse(error);
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let last = "";
      let stopped = false;
      const stop = () => {
        stopped = true;
      };
      request.signal.addEventListener("abort", stop, { once: true });
      try {
        while (!stopped) {
          const data = JSON.stringify(await getSnapshot());
          if (data !== last) {
            controller.enqueue(
              encoder.encode(
                `id: ${Date.now()}\nevent: state\ndata: ${data}\n\n`,
              ),
            );
            last = data;
          } else controller.enqueue(encoder.encode(": heartbeat\n\n"));
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      } catch {
        /* Disconnects are normal; reconnect obtains the current database snapshot. */
      } finally {
        request.signal.removeEventListener("abort", stop);
        try {
          controller.close();
        } catch {
          /* Client already closed. */
        }
      }
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
