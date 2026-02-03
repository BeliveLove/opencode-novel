import { NOVEL_CHARACTER_EXPERT_SKILL } from "./skills/novel-character-expert";
import { NOVEL_CONTINUATION_EXPERT_SKILL } from "./skills/novel-continuation-expert";
import { NOVEL_CONTINUITY_SENTINEL_SKILL } from "./skills/novel-continuity-sentinel";
import { NOVEL_ENTITY_EXTRACTOR_SKILL } from "./skills/novel-entity-extractor";
import { NOVEL_FACTION_RELATIONS_SKILL } from "./skills/novel-faction-relations";
import { NOVEL_FLAW_FINDER_SKILL } from "./skills/novel-flaw-finder";
import { NOVEL_FORESHADOWING_UNRESOLVED_SKILL } from "./skills/novel-foreshadowing-unresolved";
import { NOVEL_ORACLE_SKILL } from "./skills/novel-oracle";
import { NOVEL_POLISH_EXPERT_SKILL } from "./skills/novel-polish-expert";
import { NOVEL_SUMMARY_EXPERT_SKILL } from "./skills/novel-summary-expert";
import { NOVEL_TIMELINE_KEEPER_SKILL } from "./skills/novel-timeline-keeper";
import { NOVEL_WORLDBIBLE_KEEPER_SKILL } from "./skills/novel-worldbible-keeper";
import type { BuiltinSkillName, BuiltinSkills, SkillDefinition } from "./types";

const BUILTIN_SKILLS: Record<BuiltinSkillName, Omit<SkillDefinition, "name">> = {
  "novel-oracle": {
    description: "主线/冲突/主题/承诺兑现诊断；给结构性改造建议。",
    template: NOVEL_ORACLE_SKILL,
  },
  "novel-entity-extractor": {
    description: "从正文/摘要抽取实体候选（输出 candidates JSON）。",
    template: NOVEL_ENTITY_EXTRACTOR_SKILL,
  },
  "novel-character-expert": {
    description: "人物画像、动机、弧光、关系、台词一致性。",
    template: NOVEL_CHARACTER_EXPERT_SKILL,
  },
  "novel-faction-relations": {
    description: "势力结构与关系图（Mermaid）。",
    template: NOVEL_FACTION_RELATIONS_SKILL,
  },
  "novel-worldbible-keeper": {
    description: "设定条款整理、名词表、规则一致性建议。",
    template: NOVEL_WORLDBIBLE_KEEPER_SKILL,
  },
  "novel-timeline-keeper": {
    description: "时间线梳理、矛盾定位与修复建议。",
    template: NOVEL_TIMELINE_KEEPER_SKILL,
  },
  "novel-continuity-sentinel": {
    description: "基于报告给最小改动修复路径。",
    template: NOVEL_CONTINUITY_SENTINEL_SKILL,
  },
  "novel-foreshadowing-unresolved": {
    description: "伏笔/承诺回收方案（按章节落点）。",
    template: NOVEL_FORESHADOWING_UNRESOLVED_SKILL,
  },
  "novel-flaw-finder": {
    description: "节奏/逻辑/视角/信息分配问题清单（含优先级）。",
    template: NOVEL_FLAW_FINDER_SKILL,
  },
  "novel-continuation-expert": {
    description: "续写/补场景/转场（可给多分支）。",
    template: NOVEL_CONTINUATION_EXPERT_SKILL,
  },
  "novel-polish-expert": {
    description: "润色（保守/重写两档）。",
    template: NOVEL_POLISH_EXPERT_SKILL,
  },
  "novel-summary-expert": {
    description: "章节回顾/梗概/无剧透文案/编辑向梗概。",
    template: NOVEL_SUMMARY_EXPERT_SKILL,
  },
};

export function loadBuiltinSkills(disabledSkills?: BuiltinSkillName[]): BuiltinSkills {
  const disabled = new Set(disabledSkills ?? []);
  const skills: Partial<BuiltinSkills> = {};
  for (const [name, def] of Object.entries(BUILTIN_SKILLS) as Array<
    [BuiltinSkillName, Omit<SkillDefinition, "name">]
  >) {
    if (disabled.has(name)) continue;
    skills[name] = { name, ...def };
  }
  return skills as BuiltinSkills;
}
