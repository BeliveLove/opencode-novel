# 数据模型（事实源）

## 目录约定（默认）

```
manuscript/
  bible/
    world.md
    rules.md
    glossary.md
  characters/
    <id>.md
  factions/
    <id>.md
  locations/
    <id>.md
  threads/
    <thread_id>.md
  chapters/
    <chapter_id>.md
  snapshots/
    <date>-<tag>.md
```

## ID 约定（建议）

- chapter_id：`ch` + 4 位数字（例：`ch0001`）
- thread_id：`th-` + slug（例：`th-001`、`th-矿井事故`）
- character id：`char-` + slug
- faction id：`fac-` + slug
- location id：`loc-` + slug

slug 规则：trim → 空白折叠为 `-` → 去掉标点（保留中英文/数字/连字符）→ lowercase；为空则回退 hash8。

## Chapter frontmatter（建议字段）

```yaml
chapter_id: ch0001
title: "第一章：起风"
pov: third_limited
timeline:
  date: "2026-02-03"
  start: "20:00"
  end: "20:30"
  location: loc-town
characters: [char-zhangsan, char-lisi]
threads_opened: [th-001]
threads_advanced: []
threads_closed: []
summary: "一句话摘要（用于索引/导出/上下文包）。"
tags: [intro]
```

## Thread frontmatter（建议字段）

```yaml
thread_id: th-001
type: mystery
status: open
opened_in:
  chapter_id: ch0001
expected_close_by: ch0010
close_plan: "第10章回收，并给出证据链。"
closed_in: null
```

## 派生目录（默认）

```
.opencode/novel/
  INDEX.md
  TIMELINE.md
  THREADS_REPORT.md
  CONTINUITY_REPORT.md
  FORESHADOWING_AUDIT.md
  STYLE_REPORT.md
  IMPORT_REPORT.md
  ENTITY_GAPS.md
  CHARACTER_REPORT.md
  APPLY_REPORT.md
  GRAPH/
    RELATIONSHIPS.mmd
    FACTIONS.mmd
  CONTEXT_PACKS/
  cache/
    scan.json
    import-map.json
    entity-gaps.json
```

