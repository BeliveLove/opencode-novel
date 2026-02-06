import { describe, expect, it } from "bun:test";
import { loadBuiltinCommands } from "./commands";

describe("builtin commands", () => {
  it("keeps chapter writing commands non-overwrite by default", () => {
    const commands = loadBuiltinCommands();

    const plan = commands["novel-chapter-plan"];
    const draft = commands["novel-chapter-draft"];
    const continuation = commands["novel-continuation"];
    const rewrite = commands["novel-rewrite"];
    const polish = commands["novel-polish"];
    const review = commands["novel-chapter-review"];

    expect(plan.argumentHint).toContain("--apply");
    expect(draft.argumentHint).toContain("--apply");
    expect(continuation.argumentHint).toContain("--apply");
    expect(rewrite.argumentHint).toContain("--apply");
    expect(polish.argumentHint).toContain("--apply");

    expect(plan.template).toContain(".plan.md");
    expect(draft.template).toContain(".draft.md");
    expect(continuation.template).toContain(".continue.md");
    expect(rewrite.template).toContain(".rewrite.md");
    expect(polish.template).toContain(".polish.md");

    expect(plan.template).toContain("不覆盖原章");
    expect(draft.template).toContain("不覆盖原章");
    expect(continuation.template).toContain("覆盖");
    expect(rewrite.template).toContain("覆盖");
    expect(polish.template).toContain("不覆盖原章");
    expect(review.template).toContain("不直接改写正文");
  });
});
