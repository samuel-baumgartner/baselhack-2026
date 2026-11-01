import type { Snapshot } from "./shopping";

export function acceptsSnapshot(
  current: Pick<Snapshot, "sessionId" | "revision"> | null,
  incoming: Pick<Snapshot, "sessionId" | "revision">,
  requestSession?: string,
) {
  if (requestSession && current?.sessionId !== requestSession) return false;
  return (
    current?.sessionId !== incoming.sessionId ||
    incoming.revision >= current.revision
  );
}
