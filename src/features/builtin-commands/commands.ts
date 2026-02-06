import { NOVEL_APPLY_CANDIDATES_TEMPLATE } from "./templates/novel-apply-candidates";
import { NOVEL_BIBLE_TEMPLATE } from "./templates/novel-bible";
import { NOVEL_BOOTSTRAP_TEMPLATE } from "./templates/novel-bootstrap";
import { NOVEL_CHAPTER_DRAFT_TEMPLATE } from "./templates/novel-chapter-draft";
import { NOVEL_CHAPTER_PLAN_TEMPLATE } from "./templates/novel-chapter-plan";
import { NOVEL_CHAPTER_REVIEW_TEMPLATE } from "./templates/novel-chapter-review";
import { NOVEL_CHARACTER_TEMPLATE } from "./templates/novel-character";
import { NOVEL_CHARACTER_REPORT_TEMPLATE } from "./templates/novel-character-report";
import { NOVEL_CONFIG_CHECK_TEMPLATE } from "./templates/novel-config-check";
import { NOVEL_CONTINUATION_TEMPLATE } from "./templates/novel-continuation";
import { NOVEL_CONTINUITY_CHECK_TEMPLATE } from "./templates/novel-continuity-check";
import { NOVEL_ENTITIES_AUDIT_TEMPLATE } from "./templates/novel-entities-audit";
import { NOVEL_EXPORT_TEMPLATE } from "./templates/novel-export";
import { NOVEL_EXTRACT_ENTITIES_TEMPLATE } from "./templates/novel-extract-entities";
import { NOVEL_FACTION_TEMPLATE } from "./templates/novel-faction";
import { NOVEL_FORESHADOWING_AUDIT_TEMPLATE } from "./templates/novel-foreshadowing-audit";
import { NOVEL_GRAPH_TEMPLATE } from "./templates/novel-graph";
import { NOVEL_IMPORT_TEMPLATE } from "./templates/novel-import";
import { NOVEL_INDEX_TEMPLATE } from "./templates/novel-index";
import { NOVEL_INIT_TEMPLATE } from "./templates/novel-init";
import { NOVEL_OUTLINE_TEMPLATE } from "./templates/novel-outline";
import { NOVEL_POLISH_TEMPLATE } from "./templates/novel-polish";
import { NOVEL_REWRITE_TEMPLATE } from "./templates/novel-rewrite";
import { NOVEL_SNAPSHOT_TEMPLATE } from "./templates/novel-snapshot";
import { NOVEL_STYLE_CHECK_TEMPLATE } from "./templates/novel-style-check";
import { NOVEL_STYLE_GUIDE_TEMPLATE } from "./templates/novel-style-guide";
import { NOVEL_SUMMARY_TEMPLATE } from "./templates/novel-summary";
import { NOVEL_THREAD_TEMPLATE } from "./templates/novel-thread";
import type { BuiltinCommandName, BuiltinCommands, CommandDefinition } from "./types";

const BUILTIN_COMMANDS: Record<BuiltinCommandName, Omit<CommandDefinition, "name">> = {
  "novel-init": {
    description: "创建小说工程骨架与最小配置。",
    argumentHint: "<title>",
    agent: "novel-sentinel",
    template: wrapTemplate(NOVEL_INIT_TEMPLATE),
  },
  "novel-import": {
    description: "从已有目录导入为 manuscript/ 结构（不改原文）。",
    argumentHint: "[--from=<path>] [--mode=analyze|copy]",
    agent: "novel-sentinel",
    template: wrapTemplate(NOVEL_IMPORT_TEMPLATE),
  },
  "novel-bootstrap": {
    description: "一键迁移：scaffold→import→index→gaps→graph→character report。",
    argumentHint: "[--from=<path>] [--stubs]",
    agent: "novel-sentinel",
    template: wrapTemplate(NOVEL_BOOTSTRAP_TEMPLATE),
  },
  "novel-style-guide": {
    description: "生成/更新全局写作约束（styleGuide）。",
    template: wrapTemplate(NOVEL_STYLE_GUIDE_TEMPLATE),
  },
  "novel-bible": {
    description: "生成/更新世界观/名词表/规则条款，并产出派生摘要。",
    template: wrapTemplate(NOVEL_BIBLE_TEMPLATE),
  },
  "novel-index": {
    description: "生成 INDEX/TIMELINE/THREADS_REPORT（派生）。",
    template: wrapTemplate(NOVEL_INDEX_TEMPLATE),
  },
  "novel-config-check": {
    description: "检查配置合并与 schema 诊断（source/path 结构化输出）。",
    template: wrapTemplate(NOVEL_CONFIG_CHECK_TEMPLATE),
  },
  "novel-entities-audit": {
    description: "实体缺口盘点（可选补 stub）。",
    argumentHint: "[--stubs]",
    template: wrapTemplate(NOVEL_ENTITIES_AUDIT_TEMPLATE),
  },
  "novel-graph": {
    description: "输出 Mermaid 图（relationships|factions）。",
    argumentHint: "<relationships|factions>",
    template: wrapTemplate(NOVEL_GRAPH_TEMPLATE),
  },
  "novel-character-report": {
    description: "输出人物曲线/出场统计。",
    template: wrapTemplate(NOVEL_CHARACTER_REPORT_TEMPLATE),
  },
  "novel-outline": {
    description: "生成大纲（三幕/节拍/冲突升级）。",
    argumentHint: "[--acts=3]",
    agent: "novel-muse",
    template: wrapTemplate(NOVEL_OUTLINE_TEMPLATE),
  },
  "novel-character": {
    description: "生成/更新角色卡。",
    argumentHint: "<id>",
    template: wrapTemplate(NOVEL_CHARACTER_TEMPLATE),
  },
  "novel-faction": {
    description: "生成/更新势力卡。",
    argumentHint: "<id>",
    template: wrapTemplate(NOVEL_FACTION_TEMPLATE),
  },
  "novel-thread": {
    description: "创建/更新线程卡（伏笔/承诺）。",
    argumentHint: "<thread_id>",
    template: wrapTemplate(NOVEL_THREAD_TEMPLATE),
  },
  "novel-chapter-plan": {
    description: "生成章节计划。",
    argumentHint: "<chapter_id> [--apply]",
    template: wrapTemplate(NOVEL_CHAPTER_PLAN_TEMPLATE),
  },
  "novel-extract-entities": {
    description: "从正文/索引抽取实体 candidates（写入 candidates.json）。",
    argumentHint: "[--scope=all|chapter:<id>]",
    template: wrapTemplate(NOVEL_EXTRACT_ENTITIES_TEMPLATE),
  },
  "novel-apply-candidates": {
    description: "将 candidates 应用到 manuscript/（受控落盘）。",
    template: wrapTemplate(NOVEL_APPLY_CANDIDATES_TEMPLATE),
  },
  "novel-chapter-draft": {
    description: "基于计划生成章节草稿（默认新文件）。",
    argumentHint: "<chapter_id> [--apply]",
    template: wrapTemplate(NOVEL_CHAPTER_DRAFT_TEMPLATE),
  },
  "novel-continuation": {
    description: "续写下一段/下一章（默认新文件）。",
    argumentHint: "<chapter_id> [--apply]",
    template: wrapTemplate(NOVEL_CONTINUATION_TEMPLATE),
  },
  "novel-rewrite": {
    description: "按目标重写章节（默认新文件）。",
    argumentHint: "<chapter_id> [--goal=...] [--apply]",
    template: wrapTemplate(NOVEL_REWRITE_TEMPLATE),
  },
  "novel-polish": {
    description: "润色章节（默认新文件）。",
    argumentHint: "<chapter_id> [--mode=conservative|rewrite] [--apply]",
    template: wrapTemplate(NOVEL_POLISH_TEMPLATE),
  },
  "novel-summary": {
    description: "生成章节摘要/回顾。",
    argumentHint: "<chapter_id>",
    template: wrapTemplate(NOVEL_SUMMARY_TEMPLATE),
  },
  "novel-chapter-review": {
    description: "审稿问题清单与修改方案（最小改动）。",
    argumentHint: "<chapter_id>",
    agent: "novel-editor",
    template: wrapTemplate(NOVEL_CHAPTER_REVIEW_TEMPLATE),
  },
  "novel-continuity-check": {
    description: "一致性报告（CONTINUITY_REPORT.md）。",
    argumentHint: "[--scope=all|chapter:<id>]",
    agent: "novel-sentinel",
    template: wrapTemplate(NOVEL_CONTINUITY_CHECK_TEMPLATE),
  },
  "novel-foreshadowing-audit": {
    description: "伏笔对账报告（FORESHADOWING_AUDIT.md）。",
    agent: "novel-sentinel",
    template: wrapTemplate(NOVEL_FORESHADOWING_AUDIT_TEMPLATE),
  },
  "novel-style-check": {
    description: "风格一致性报告（STYLE_REPORT.md）。",
    argumentHint: "[--scope=chapter:<id>|all]",
    template: wrapTemplate(NOVEL_STYLE_CHECK_TEMPLATE),
  },
  "novel-export": {
    description: "导出编译（md/html/epub/docx）。",
    argumentHint: "<md|html|epub|docx>",
    template: wrapTemplate(NOVEL_EXPORT_TEMPLATE),
  },
  "novel-snapshot": {
    description: "冻结阶段快照。",
    argumentHint: "<tag>",
    template: wrapTemplate(NOVEL_SNAPSHOT_TEMPLATE),
  },
};

function wrapTemplate(inner: string): string {
  return `<command-instruction>\n${inner}\n</command-instruction>\n\n<user-request>\n$ARGUMENTS\n</user-request>`;
}

export function loadBuiltinCommands(disabledCommands?: BuiltinCommandName[]): BuiltinCommands {
  const disabled = new Set(disabledCommands ?? []);
  const commands: Partial<BuiltinCommands> = {};
  for (const [name, def] of Object.entries(BUILTIN_COMMANDS) as Array<
    [BuiltinCommandName, Omit<CommandDefinition, "name">]
  >) {
    if (disabled.has(name)) continue;
    commands[name] = { name, ...def };
  }
  return commands as BuiltinCommands;
}
