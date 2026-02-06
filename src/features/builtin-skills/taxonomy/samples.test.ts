import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const SAMPLE_ROOT = path.resolve(process.cwd(), "test", "skills-taxonomy");

function readSample(fileName: string): string {
  const fullPath = path.join(SAMPLE_ROOT, fileName);
  expect(existsSync(fullPath)).toBeTrue();
  return readFileSync(fullPath, "utf8");
}

describe("taxonomy sample files", () => {
  it("provides six domain sample files with positive/negative buckets", () => {
    const files = [
      "genre.samples.md",
      "trope.samples.md",
      "audience.samples.md",
      "emotion.samples.md",
      "structure.samples.md",
      "market.samples.md",
    ];

    for (const fileName of files) {
      const content = readSample(fileName);
      const positives = (content.match(/^- P\d+/gm) ?? []).length;
      const negatives = (content.match(/^- N\d+/gm) ?? []).length;
      expect(positives).toBeGreaterThanOrEqual(10);
      expect(negatives).toBeGreaterThanOrEqual(10);
    }
  });

  it("provides aggregate samples for combination and conflict regression", () => {
    const content = readSample("aggregate.samples.md");
    const combinations = (content.match(/^- C\d+/gm) ?? []).length;
    const conflicts = (content.match(/^- X\d+/gm) ?? []).length;
    expect(combinations).toBeGreaterThanOrEqual(10);
    expect(conflicts).toBeGreaterThanOrEqual(10);
  });
});
