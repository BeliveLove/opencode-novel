import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { strFromU8, unzipSync } from "fflate";
import { executeTool, extractResultJson, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelExportTool } from "./tool";
import type { NovelExportArgs, NovelExportResultJson } from "./types";

function readDocxDocumentXml(bytes: Uint8Array): string {
  const unzipped = unzipSync(bytes);
  const documentXml = unzipped["word/document.xml"];
  if (!documentXml) {
    throw new Error("DOCX is missing word/document.xml");
  }
  return strFromU8(documentXml);
}

describe("novel_export", () => {
  it("exports DOCX and writes a .docx file", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
---

# 第一章：起风

正文段落 A。
`,
      );

      const tool = createNovelExportTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        format: "docx",
        outputDir: "export",
        title: "测试书",
        includeFrontmatter: false,
        writeFile: true,
      } satisfies NovelExportArgs);

      const json = extractResultJson(String(output)) as NovelExportResultJson;

      expect(json.version).toBe(1);
      if (json.version !== 1) throw new Error("Expected version=1 export result");
      expect(json.format).toBe("docx");
      expect(json.outputPath).toBeTruthy();
      expect(json.outputPath).toContain("export/");
      expect(json.outputPath).toEndWith(".docx");

      const abs = path.join(rootDir, String(json.outputPath).replaceAll("/", path.sep));
      expect(existsSync(abs)).toBeTrue();
      const bytes = readFileSync(abs);
      expect(bytes.length).toBeGreaterThan(100);
      expect(bytes[0]).toBe(0x50); // P
      expect(bytes[1]).toBe(0x4b); // K
    });
  });

  it("blocks export when preflight fails (continuity errors)", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({
        projectRoot: rootDir,
        export: { preflight: { enabled: true, checks: ["continuity"], failOn: "error" } },
      });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
timeline:
  date: "2026-02-03"
  start: "20:30"
  end: "20:00"
---

# 第一章：起风

正文段落 A。
`,
      );

      const tool = createNovelExportTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        format: "docx",
        outputDir: "export",
        title: "测试书",
        includeFrontmatter: false,
        writeFile: true,
      } satisfies NovelExportArgs);

      const json = extractResultJson(String(output)) as NovelExportResultJson;

      expect(json.version).toBe(1);
      if (json.version !== 1) throw new Error("Expected version=1 export result");

      expect(json.preflight?.enabled).toBeTrue();
      expect(json.preflight?.blocked).toBeTrue();
      expect(json.outputPath).toBeUndefined();
      expect(json.diagnostics.some((d) => d.code === "EXPORT_PREFLIGHT_BLOCKED")).toBeTrue();

      // Preflight should still write the report.
      const reportAbs = path.join(
        rootDir,
        ".opencode/novel/CONTINUITY_REPORT.md".replaceAll("/", path.sep),
      );
      expect(existsSync(reportAbs)).toBeTrue();
    });
  });

  it("exports DOCX when preflight is enabled and passes", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({
        projectRoot: rootDir,
        export: { preflight: { enabled: true, checks: ["continuity"], failOn: "error" } },
      });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
timeline:
  date: "2026-02-03"
  start: "20:00"
  end: "20:30"
---

# 第一章：起风

正文段落 A。
`,
      );

      const tool = createNovelExportTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        format: "docx",
        outputDir: "export",
        title: "测试书",
        includeFrontmatter: false,
        writeFile: true,
      } satisfies NovelExportArgs);

      const json = extractResultJson(String(output)) as NovelExportResultJson;

      expect(json.version).toBe(1);
      if (json.version !== 1) throw new Error("Expected version=1 export result");

      expect(json.preflight?.enabled).toBeTrue();
      expect(json.preflight?.blocked).toBeFalse();
      expect(json.outputPath).toBeTruthy();
    });
  });

  it("applies configured manuscript docx template", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({
        projectRoot: rootDir,
        export: { docx: { template: "manuscript" } },
      });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
---

# 第一章：起风

正文段落 A。`,
      );

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0002.md",
        `---
chapter_id: ch0002
title: "第二章：夜雨"
---

# 第二章：夜雨

正文段落 B。`,
      );

      const tool = createNovelExportTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        format: "docx",
        outputDir: "export",
        title: "测试书",
        includeFrontmatter: false,
        writeFile: true,
      } satisfies NovelExportArgs);

      const json = extractResultJson(String(output)) as NovelExportResultJson;
      expect(json.version).toBe(1);
      if (json.version !== 1) throw new Error("Expected version=1 export result");
      expect(json.docxTemplate).toBe("manuscript");
      expect(json.outputPath).toBeTruthy();

      const abs = path.join(rootDir, String(json.outputPath).replaceAll("/", path.sep));
      const xml = readDocxDocumentXml(readFileSync(abs));
      expect(xml).not.toContain("w:pageBreakBefore");
      expect((xml.match(/w:type="page"/g) ?? []).length).toBe(1);
      expect(xml).toContain('w:firstLine="420"');
    });
  });

  it("allows docxTemplate arg to override config", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({
        projectRoot: rootDir,
        export: { docx: { template: "default" } },
      });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
---

# 第一章：起风

正文段落 A。`,
      );

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0002.md",
        `---
chapter_id: ch0002
title: "第二章：夜雨"
---

# 第二章：夜雨

正文段落 B。`,
      );

      const tool = createNovelExportTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        format: "docx",
        outputDir: "export",
        title: "测试书",
        includeFrontmatter: false,
        writeFile: true,
        docxTemplate: "manuscript",
      } satisfies NovelExportArgs);

      const json = extractResultJson(String(output)) as NovelExportResultJson;
      expect(json.version).toBe(1);
      if (json.version !== 1) throw new Error("Expected version=1 export result");
      expect(json.docxTemplate).toBe("manuscript");

      const abs = path.join(rootDir, String(json.outputPath).replaceAll("/", path.sep));
      const xml = readDocxDocumentXml(readFileSync(abs));
      expect(xml).not.toContain("w:pageBreakBefore");
      expect((xml.match(/w:type="page"/g) ?? []).length).toBe(1);
    });
  });

  it("exports EPUB and writes a .epub file (zip)", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
---

# 第一章：起风

正文段落 A。
`,
      );

      const tool = createNovelExportTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        format: "epub",
        outputDir: "export",
        title: "测试书",
        includeFrontmatter: false,
        writeFile: true,
      } satisfies NovelExportArgs);

      const json = extractResultJson(String(output)) as NovelExportResultJson;

      expect(json.version).toBe(1);
      if (json.version !== 1) throw new Error("Expected version=1 export result");
      expect(json.format).toBe("epub");
      expect(json.outputPath).toBeTruthy();
      expect(json.outputPath).toContain("export/");
      expect(json.outputPath).toEndWith(".epub");

      const abs = path.join(rootDir, String(json.outputPath).replaceAll("/", path.sep));
      expect(existsSync(abs)).toBeTrue();
      const bytes = readFileSync(abs);
      expect(bytes.length).toBeGreaterThan(100);
      expect(bytes[0]).toBe(0x50); // P
      expect(bytes[1]).toBe(0x4b); // K

      const unzipped = unzipSync(bytes);
      expect(strFromU8(unzipped.mimetype)).toBe("application/epub+zip");
      expect(strFromU8(unzipped["META-INF/container.xml"])).toContain("OEBPS/content.opf");
      expect(strFromU8(unzipped["OEBPS/content.opf"])).toContain("<dc:title>测试书</dc:title>");
      expect(unzipped["OEBPS/chapters/ch0001.xhtml"]).toBeTruthy();
      expect(strFromU8(unzipped["OEBPS/nav.xhtml"])).toContain("chapters/ch0001.xhtml");
    });
  });

  it("exports multiple formats when format is omitted (config.export.formats)", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({
        projectRoot: rootDir,
        export: { formats: ["md", "html"] },
      });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
---

# 第一章：起风

正文段落 A。
`,
      );

      const tool = createNovelExportTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        outputDir: "export",
        title: "测试书",
        includeFrontmatter: false,
        writeFile: true,
      } satisfies NovelExportArgs);

      const json = extractResultJson(String(output)) as NovelExportResultJson;

      expect(json.version).toBe(2);
      if (json.version !== 2) throw new Error("Expected version=2 export result");

      expect(json.formats).toEqual(["md", "html"]);
      expect(json.outputs.map((o) => o.format)).toEqual(["md", "html"]);
      expect(json.outputs.every((o) => Boolean(o.outputPath))).toBeTrue();
      expect(Boolean(json.manifestPath)).toBeTrue();

      const mdOutput = json.outputs.find((o) => o.format === "md")?.outputPath;
      const htmlOutput = json.outputs.find((o) => o.format === "html")?.outputPath;
      expect(mdOutput).toBeTruthy();
      expect(htmlOutput).toBeTruthy();
      expect(mdOutput).toEndWith(".md");
      expect(htmlOutput).toEndWith(".html");

      const mdAbs = path.join(rootDir, String(mdOutput).replaceAll("/", path.sep));
      const htmlAbs = path.join(rootDir, String(htmlOutput).replaceAll("/", path.sep));
      const manifestAbs = path.join(rootDir, String(json.manifestPath).replaceAll("/", path.sep));
      expect(existsSync(mdAbs)).toBeTrue();
      expect(existsSync(htmlAbs)).toBeTrue();
      expect(existsSync(manifestAbs)).toBeTrue();
      expect(readFileSync(mdAbs, "utf8")).toContain("第一章：起风");
      expect(readFileSync(htmlAbs, "utf8")).toContain("<html");

      const manifest = JSON.parse(readFileSync(manifestAbs, "utf8")) as {
        version: number;
        formats: string[];
        outputs: Array<{ format: string; outputPath: string; contentSha256: string }>;
      };
      expect(manifest.version).toBe(1);
      expect(manifest.formats).toEqual(["md", "html"]);
      expect(manifest.outputs.map((o) => o.format)).toEqual(["md", "html"]);
      expect(manifest.outputs.every((o) => o.contentSha256.length === 64)).toBeTrue();
    });
  });

  it("produces deterministic manifest for same input and config", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({
        projectRoot: rootDir,
        export: { formats: ["md", "html"] },
      });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "Chapter 1"
---

# Chapter 1

Body A`,
      );

      const tool = createNovelExportTool({ projectRoot: rootDir, config });

      const firstOutput = await executeTool(tool, {
        rootDir,
        outputDir: "export",
        title: "determinism-check",
        includeFrontmatter: false,
        writeFile: true,
      } satisfies NovelExportArgs);
      const firstJson = extractResultJson(String(firstOutput)) as NovelExportResultJson;
      expect(firstJson.version).toBe(2);
      if (firstJson.version !== 2) throw new Error("Expected version=2 export result");
      const firstManifestAbs = path.join(
        rootDir,
        String(firstJson.manifestPath).replaceAll("/", path.sep),
      );
      const firstManifest = readFileSync(firstManifestAbs, "utf8");

      const secondOutput = await executeTool(tool, {
        rootDir,
        outputDir: "export",
        title: "determinism-check",
        includeFrontmatter: false,
        writeFile: true,
      } satisfies NovelExportArgs);
      const secondJson = extractResultJson(String(secondOutput)) as NovelExportResultJson;
      expect(secondJson.version).toBe(2);
      if (secondJson.version !== 2) throw new Error("Expected version=2 export result");
      const secondManifestAbs = path.join(
        rootDir,
        String(secondJson.manifestPath).replaceAll("/", path.sep),
      );
      const secondManifest = readFileSync(secondManifestAbs, "utf8");

      expect(firstJson.outputs).toEqual(secondJson.outputs);
      expect(firstManifest).toEqual(secondManifest);
    });
  });
});
