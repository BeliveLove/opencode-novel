#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { NovelConfigSchema } from "../src/config/schema";
import { createNovelIndexTool } from "../src/tools/novel-index";
import type { NovelIndexResultJson } from "../src/tools/novel-index/types";

type BenchmarkOptions = {
  rootDir: string;
  chapters: number;
  repeats: number;
  clean: boolean;
};

type BenchmarkReport = {
  version: 1;
  generatedAt: string;
  rootDir: string;
  chapters: number;
  repeats: number;
  fullMs: number[];
  incrementalMs: number[];
  incrementalCache: Array<{ fastHits: number; hashHits: number; misses: number }>;
  summary: {
    full: { p50: number; p90: number; avg: number };
    incremental: { p50: number; p90: number; avg: number };
  };
};

function parseArgs(argv: string[]): BenchmarkOptions {
  const options: BenchmarkOptions = {
    rootDir: ".tmp/perf-index-benchmark",
    chapters: 500,
    repeats: 5,
    clean: true,
  };

  for (const arg of argv) {
    if (arg.startsWith("--root=")) options.rootDir = arg.slice("--root=".length);
    else if (arg.startsWith("--chapters="))
      options.chapters = Number(arg.slice("--chapters=".length));
    else if (arg.startsWith("--repeats=")) options.repeats = Number(arg.slice("--repeats=".length));
    else if (arg === "--no-clean") options.clean = false;
  }

  if (!Number.isFinite(options.chapters) || options.chapters <= 0) {
    throw new Error(`Invalid --chapters value: ${options.chapters}`);
  }
  if (!Number.isFinite(options.repeats) || options.repeats <= 0) {
    throw new Error(`Invalid --repeats value: ${options.repeats}`);
  }

  return options;
}

function extractResultJson(markdownOutput: string): NovelIndexResultJson {
  const match = markdownOutput.match(/```json\n([\s\S]*?)\n```/);
  if (!match) {
    throw new Error("No JSON block found in tool output");
  }
  return JSON.parse(match[1]) as NovelIndexResultJson;
}

function chapterId(index: number): string {
  return `ch${String(index).padStart(4, "0")}`;
}

function ensureFixtureProject(rootDir: string, chapters: number) {
  const chaptersDir = path.join(rootDir, "manuscript", "chapters");
  const charactersDir = path.join(rootDir, "manuscript", "characters");
  mkdirSync(chaptersDir, { recursive: true });
  mkdirSync(charactersDir, { recursive: true });

  const characterPath = path.join(charactersDir, "char-main.md");
  writeFileSync(
    characterPath,
    `---
id: char-main
name: "Main Character"
---

# Main Character
`,
    "utf8",
  );

  for (let i = 1; i <= chapters; i += 1) {
    const id = chapterId(i);
    const chapterPath = path.join(chaptersDir, `${id}.md`);
    writeFileSync(
      chapterPath,
      `---
chapter_id: ${id}
title: "Chapter ${i}"
characters: [char-main]
threads_opened: []
threads_advanced: []
threads_closed: []
timeline:
  date: "2026-01-${String(((i - 1) % 28) + 1).padStart(2, "0")}"
  start: "20:00"
  end: "20:30"
---

# Chapter ${i}

This is benchmark chapter ${i}.
`,
      "utf8",
    );
  }
}

function mutateOneChapter(rootDir: string, index: number) {
  const id = chapterId(index);
  const chapterPath = path.join(rootDir, "manuscript", "chapters", `${id}.md`);
  const content = readFileSync(chapterPath, "utf8");
  const marker = `\n<!-- bench-update:${Date.now()} -->\n`;
  writeFileSync(chapterPath, `${content.trimEnd()}\n${marker}`, "utf8");
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(0, Math.ceil(p * sorted.length) - 1);
  return sorted[rank];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

async function run() {
  const options = parseArgs(Bun.argv.slice(2));
  const rootDir = path.resolve(options.rootDir);

  if (options.clean && existsSync(rootDir)) {
    rmSync(rootDir, { recursive: true, force: true });
  }

  ensureFixtureProject(rootDir, options.chapters);

  const config = NovelConfigSchema.parse({
    projectRoot: rootDir,
    index: { writeDerivedFiles: true },
  });
  const tool = createNovelIndexTool({ projectRoot: rootDir, config });

  const executeIndex = async (scanMode: "full" | "incremental") => {
    const output = await tool.execute({
      rootDir,
      scanMode,
      writeCache: true,
      writeDerivedFiles: true,
      forceWrite: true,
    });
    return extractResultJson(String(output));
  };

  const fullMs: number[] = [];
  const incrementalMs: number[] = [];
  const incrementalCache: Array<{ fastHits: number; hashHits: number; misses: number }> = [];

  for (let i = 0; i < options.repeats; i += 1) {
    const full = await executeIndex("full");
    fullMs.push(full.stats.durationMs);
  }

  await executeIndex("full");

  for (let i = 0; i < options.repeats; i += 1) {
    mutateOneChapter(rootDir, (i % options.chapters) + 1);
    const incremental = await executeIndex("incremental");
    incrementalMs.push(incremental.stats.durationMs);
    incrementalCache.push({
      fastHits: incremental.stats.scan.cache.fastHits,
      hashHits: incremental.stats.scan.cache.hashHits,
      misses: incremental.stats.scan.cache.misses,
    });
  }

  const report: BenchmarkReport = {
    version: 1,
    generatedAt: new Date().toISOString(),
    rootDir,
    chapters: options.chapters,
    repeats: options.repeats,
    fullMs,
    incrementalMs,
    incrementalCache,
    summary: {
      full: { p50: percentile(fullMs, 0.5), p90: percentile(fullMs, 0.9), avg: average(fullMs) },
      incremental: {
        p50: percentile(incrementalMs, 0.5),
        p90: percentile(incrementalMs, 0.9),
        avg: average(incrementalMs),
      },
    },
  };

  const reportPath = path.join(rootDir, ".opencode", "novel", "PERF_INDEX_BASELINE.json");
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("=== novel-index benchmark ===");
  console.log(`rootDir: ${rootDir}`);
  console.log(`chapters: ${options.chapters}, repeats: ${options.repeats}`);
  console.log(`full(ms): ${fullMs.join(", ")}`);
  console.log(`incremental(ms): ${incrementalMs.join(", ")}`);
  console.log(
    `full p50/p90/avg: ${report.summary.full.p50}/${report.summary.full.p90}/${report.summary.full.avg}`,
  );
  console.log(
    `incremental p50/p90/avg: ${report.summary.incremental.p50}/${report.summary.incremental.p90}/${report.summary.incremental.avg}`,
  );
  console.log(`report: ${reportPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
