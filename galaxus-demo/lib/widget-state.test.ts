import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptsSnapshot } from "./widget-state";

test("a late widget response cannot replace a newer revision", () => {
  assert.equal(
    acceptsSnapshot(
      { sessionId: "A", revision: 4 },
      { sessionId: "A", revision: 3 },
      "A",
    ),
    false,
  );
});
test("a late local response cannot undo a host session switch", () => {
  assert.equal(
    acceptsSnapshot(
      { sessionId: "B", revision: 0 },
      { sessionId: "A", revision: 5 },
      "A",
    ),
    false,
  );
});
test("host session switches and same-revision view changes are accepted", () => {
  assert.equal(
    acceptsSnapshot(
      { sessionId: "A", revision: 4 },
      { sessionId: "B", revision: 0 },
    ),
    true,
  );
  assert.equal(
    acceptsSnapshot(
      { sessionId: "A", revision: 4 },
      { sessionId: "A", revision: 4 },
      "A",
    ),
    true,
  );
});
