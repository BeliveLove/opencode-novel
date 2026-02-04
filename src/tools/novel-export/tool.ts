import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { type ToolDefinition, tool } from "@opencode-ai/plugin";
import type { NovelConfig } from "../../config/schema";
import type { Diagnostic } from "../../shared/errors/diagnostics";
import { fromRelativePosixPath, toRelativePosixPath } from "../../shared/fs/paths";
import { ensureDirForFile, normalizeLf, writeTextFile } from "../../shared/fs/write";
import { buildFrontmatterFile, parseFrontmatter } from "../../shared/markdown/frontmatter";
import { formatToolMarkdownOutput } from "../../shared/tool-output";
import { loadOrScan } from "../novel-scan/scan";
import { markdownToDocxBytes } from "./docx";
import { chaptersToEpubBytes } from "./epub";
import { markdownToHtml, wrapHtmlDocument } from "./render";
import type {
  NovelChapterOrder,
  NovelExportArgs,
  NovelExportFormat,
  NovelExportResultJson,
} from "./types";

function sortByTimelineKey(
  a: { date?: string; start?: string; chapter_id: string },
  b: { date?: string; start?: string; chapter_id: string },
): number {
  const aKey = `${a.date ?? ""} ${a.start ?? ""}`.trim();
  const bKey = `${b.date ?? ""} ${b.start ?? ""}`.trim();
  const aHas = aKey.length > 0;
  const bHas = bKey.length > 0;
  if (aHas && bHas) {
    const cmp = aKey.localeCompare(bKey);
    if (cmp !== 0) return cmp;
    return a.chapter_id.localeCompare(b.chapter_id);
  }
  if (aHas) return -1;
  if (bHas) return 1;
  return a.chapter_id.localeCompare(b.chapter_id);
}

function ensureChapterHeading(markdownBody: string, title: string): string {
  const body = normalizeLf(markdownBody).trimStart();
  if (body.startsWith("# ")) return body;
  return `# ${title}\n\n${body}`.trimEnd();
}

export function createNovelExportTool(deps: {
  projectRoot: string;
  config: NovelConfig;
}): ToolDefinition {
  return tool({
    description:
      "Export novel by merging chapters into a single MD/HTML/DOCX file (deterministic ordering).",
    args: {
      rootDir: tool.schema.string().optional(),
      manuscriptDir: tool.schema.string().optional(),
      format: tool.schema.enum(["md", "html", "epub", "docx"]),
      outputDir: tool.schema.string().optional(),
      title: tool.schema.string().optional(),
      chapterOrder: tool.schema.enum(["by_id", "by_timeline", "custom"]).optional(),
      customOrder: tool.schema.array(tool.schema.string()).optional(),
      includeFrontmatter: tool.schema.boolean().optional(),
      writeFile: tool.schema.boolean().optional(),
    },
    async execute(args: NovelExportArgs) {
      const startedAt = Date.now();
      const diagnostics: Diagnostic[] = [];

      const rootDir = path.resolve(args.rootDir ?? deps.projectRoot);
      const manuscriptDirName = args.manuscriptDir ?? deps.config.manuscriptDir;
      const format: NovelExportFormat = args.format;
      const outputDir = path.isAbsolute(args.outputDir ?? "")
        ? (args.outputDir as string)
        : path.resolve(path.join(rootDir, args.outputDir ?? deps.config.export.outputDir));
      const title = (args.title ?? "").trim() || path.basename(rootDir);
      const chapterOrder: NovelChapterOrder = args.chapterOrder ?? deps.config.export.chapterOrder;
      const includeFrontmatter = args.includeFrontmatter ?? deps.config.export.includeFrontmatter;
      const writeFile = args.writeFile ?? true;

      const scan = loadOrScan({
        projectRoot: deps.projectRoot,
        config: deps.config,
        args: { rootDir, manuscriptDir: manuscriptDirName, mode: "incremental", writeCache: true },
      });
      diagnostics.push(...scan.diagnostics);

      let ordered = [...scan.entities.chapters];
      if (chapterOrder === "by_id") {
        ordered.sort((a, b) => a.chapter_id.localeCompare(b.chapter_id));
      } else if (chapterOrder === "by_timeline") {
        ordered.sort((a, b) =>
          sortByTimelineKey(
            { date: a.timeline?.date, start: a.timeline?.start, chapter_id: a.chapter_id },
            { date: b.timeline?.date, start: b.timeline?.start, chapter_id: b.chapter_id },
          ),
        );
      } else {
        const custom = args.customOrder ?? [];
        const byId = new Map(ordered.map((c) => [c.chapter_id, c]));
        const picked: typeof ordered = [];
        const missing: string[] = [];
        for (const id of custom) {
          const c = byId.get(id);
          if (c) picked.push(c);
          else missing.push(id);
        }
        if (missing.length > 0) {
          diagnostics.push({
            severity: "warn",
            code: "EXPORT_CUSTOM_ORDER_MISSING",
            message: `customOrder 中存在不存在章节: ${missing.join(", ")}`,
          });
        }
        const pickedSet = new Set(picked.map((c) => c.chapter_id));
        const rest = ordered
          .filter((c) => !pickedSet.has(c.chapter_id))
          .sort((a, b) => a.chapter_id.localeCompare(b.chapter_id));
        ordered = [...picked, ...rest];
      }

      const mergedMdParts: string[] = [];
      const titleById = new Map<string, string>();
      const chaptersForEpub: { id: string; title: string; markdown: string }[] = [];
      for (const chapter of ordered) {
        const abs = fromRelativePosixPath(rootDir, chapter.path);
        if (!existsSync(abs)) {
          diagnostics.push({
            severity: "error",
            code: "EXPORT_CHAPTER_MISSING_FILE",
            message: `章节文件不存在: ${chapter.path}`,
          });
          continue;
        }
        const content = readFileSync(abs, "utf8");
        const parsed = parseFrontmatter<Record<string, unknown>>(content, {
          file: chapter.path,
          strict: false,
        });
        diagnostics.push(...parsed.diagnostics);

        const titleForHeading =
          chapter.title ??
          (typeof parsed.data.title === "string" ? parsed.data.title : chapter.chapter_id);
        titleById.set(chapter.chapter_id, titleForHeading);
        const bodyWithHeading = ensureChapterHeading(parsed.body, titleForHeading);

        const markdownFinal = includeFrontmatter
          ? parsed.hasFrontmatter
            ? buildFrontmatterFile(parsed.data as Record<string, unknown>, bodyWithHeading)
            : bodyWithHeading
          : bodyWithHeading;

        mergedMdParts.push(markdownFinal.trimEnd());
        chaptersForEpub.push({
          id: chapter.chapter_id,
          title: titleForHeading,
          markdown: markdownFinal,
        });
      }

      const mergedMarkdown = `${mergedMdParts.join("\n\n---\n\n")}\n`;

      const chapterInfos = ordered.map((c) => ({
        chapter_id: c.chapter_id,
        title: titleById.get(c.chapter_id) ?? c.title,
        path: c.path,
      }));

      const fileExt =
        format === "docx" ? "docx" : format === "html" ? "html" : format === "epub" ? "epub" : "md";
      const outputPathAbs = path.join(outputDir, `${slugifyTitle(title)}.${fileExt}`);
      const outputPathRel = toRelativePosixPath(rootDir, outputPathAbs);

      if (writeFile) {
        if (format === "md") {
          writeTextFile(outputPathAbs, mergedMarkdown, { mode: "always" });
        } else if (format === "html") {
          const htmlBody = markdownToHtml(mergedMarkdown);
          const html = wrapHtmlDocument({
            title,
            bodyHtml: htmlBody,
            language: deps.config.language,
          });
          writeTextFile(outputPathAbs, html, { mode: "always" });
        } else if (format === "epub") {
          const bytes = chaptersToEpubBytes({
            title,
            language: deps.config.language,
            chapters: chaptersForEpub.map((c) => ({
              id: c.id,
              title: c.title,
              bodyHtml: markdownToHtml(c.markdown),
            })),
          });
          ensureDirForFile(outputPathAbs);
          await Bun.write(outputPathAbs, bytes);
        } else {
          const bytes = await markdownToDocxBytes(mergedMarkdown, { title });
          ensureDirForFile(outputPathAbs);
          await Bun.write(outputPathAbs, bytes);
        }
      }

      const durationMs = Date.now() - startedAt;
      const resultJson: NovelExportResultJson = {
        version: 1,
        format,
        outputPath: writeFile ? outputPathRel : undefined,
        chapters: chapterInfos,
        stats: { chapters: chapterInfos.length, durationMs },
        diagnostics,
      };

      return formatToolMarkdownOutput({
        summaryLines: [
          `format: ${format}`,
          `chapters: ${chapterInfos.length}`,
          `outputPath: ${writeFile ? outputPathRel : "(dry)"}`,
          `durationMs: ${durationMs}`,
        ],
        resultJson,
        diagnostics,
      });
    },
  });
}

function slugifyTitle(title: string): string {
  const safe = title
    .trim()
    .replace(/[<>:"/\\\\|?*]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return safe.length > 0 ? safe : "novel";
}
