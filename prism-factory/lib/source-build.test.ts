import { test } from "node:test";
import assert from "node:assert/strict";
import { validateGeneratedFiles } from "../worker/source-build";
const valid = [
  { path: "components/merchant-experience.tsx" as const, content: '"use client"; import { RetailView } from "./retail"; export default function View(props: never) { return <RetailView {...props} />; }' },
  { path: "app/merchant.css" as const, content: ".merchant-generated { color: #222; }" },
  { path: "README.md" as const, content: "A local synthetic shopping app." },
];
test("source generation restricts imports and requires the real merchant runtime", () => {
  assert.equal(validateGeneratedFiles(valid).length, 3);
  assert.throws(() => validateGeneratedFiles([{ ...valid[0], content: valid[0].content.replace('./retail', 'node:fs') }, valid[1], valid[2]]), /unsupported/);
  assert.throws(() => validateGeneratedFiles([{ ...valid[0], content: '"use client"; export default function View() { return <div />; }' }, valid[1], valid[2]]), /RetailView/);
  assert.throws(() => validateGeneratedFiles([valid[0], valid[1], valid[1]]), /exactly once/);
});
