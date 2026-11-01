import { z } from "zod";
import { turn } from "../worker/agent";
const schema = z.object({ status: z.literal("ok") });
const a = await turn("Return status ok.", schema);
const b = await turn("Continue this thread. Return status ok.", schema, a.id);
console.log(
  JSON.stringify({
    nativeSubscription: true,
    resumed: a.id === b.id,
    status: b.output.status,
  }),
);
