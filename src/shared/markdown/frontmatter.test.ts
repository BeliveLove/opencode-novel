import { describe, expect, it } from "bun:test";
import { parseFrontmatter } from "./frontmatter";

describe("parseFrontmatter", () => {
  it("parses frontmatter when file starts with UTF-8 BOM", () => {
    const content = `\uFEFF---
key: value
---

Body
`;
    const parsed = parseFrontmatter<Record<string, unknown>>(content);
    expect(parsed.hasFrontmatter).toBeTrue();
    expect(parsed.data.key).toBe("value");
    expect(parsed.body).toContain("Body");
  });

  it("parses frontmatter when preceded by blank lines", () => {
    const content = `

---
key: value
---

Body
`;
    const parsed = parseFrontmatter<Record<string, unknown>>(content);
    expect(parsed.hasFrontmatter).toBeTrue();
    expect(parsed.data.key).toBe("value");
    expect(parsed.body).toContain("Body");
  });

  it("warns on unterminated frontmatter", () => {
    const content = `---
key: value

Body
`;
    const parsed = parseFrontmatter<Record<string, unknown>>(content, { strict: false });
    expect(parsed.hasFrontmatter).toBeFalse();
    expect(parsed.diagnostics.length).toBeGreaterThan(0);
    expect(parsed.diagnostics[0]?.code).toBe("PARSE_FRONTMATTER");
  });
});

