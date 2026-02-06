import { describe, expect, it } from "bun:test";
import { extractResultJson } from "../../test/utils";
import { formatToolMarkdownOutput } from "./tool-output";

describe("formatToolMarkdownOutput", () => {
  it("injects schemaVersion when result has numeric version", () => {
    const output = formatToolMarkdownOutput({
      summaryLines: ["ok"],
      resultJson: { version: 1, valid: true },
      diagnostics: [],
    });

    const json = extractResultJson(output) as { version: number; schemaVersion?: number };
    expect(json.version).toBe(1);
    expect(json.schemaVersion).toBe(1);
  });

  it("keeps existing schemaVersion untouched", () => {
    const output = formatToolMarkdownOutput({
      summaryLines: ["ok"],
      resultJson: { version: 1, schemaVersion: 99, valid: true },
      diagnostics: [],
    });

    const json = extractResultJson(output) as { version: number; schemaVersion?: number };
    expect(json.version).toBe(1);
    expect(json.schemaVersion).toBe(99);
  });
});
