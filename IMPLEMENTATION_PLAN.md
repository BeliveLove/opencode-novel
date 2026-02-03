# Novel Plugin（oh-my-opencode 风格）完备实现计划

定位：把“写小说”工程化为 **OpenCode 插件**（Bun/TypeScript），提供可复用的 **Tools / Commands / Skills / Background Tasks**，并以项目内 Markdown 作为事实来源，自动生成索引与巡检报告。

> 说明：本文是“完备计划”（目标形态 + 架构拆分 + 任务分解 + 验收标准 + 风险与发布）。实现路径遵循 oh-my-opencode 的插件工程思路（`src/index.ts` 入口、`src/features/*` 组织 builtin commands/skills、`src/tools/*` 强类型工具、`src/config/schema.ts` Zod 配置校验、谨慎 hooks、可选后台任务）。

---

## 0. 本地集成（OpenCode）与调试（必须可执行）

### 0.1 本地开发集成（推荐：`file://` 指向 `dist/index.js`）
1) 在 `novel/` 插件工程目录构建（产出 `dist/index.js`）：
   - `bun install`
   - `bun run build`
2) 编辑 OpenCode 配置文件，把插件加入 `plugin` 数组（JSON 或 JSONC 均可）：
   - Windows 示例（注意是 **file URI**，使用 `/`）：
     ```json
     {
       "plugin": [
         "file:///D:/code/novel/dist/index.js"
       ]
     }
     ```
3) 重启 OpenCode（或重开会话）以重新加载插件。
4) 验证加载成功：
   - agent 列表可看到：`novel-muse` / `novel-editor` / `novel-sentinel`
   - 运行任意 `/novel-*` 命令（或让 agent 调用 `novel_*` tools）能正常输出

### 0.2 OpenCode 配置文件位置（Windows 常见）
> 以你实际安装方式与 OpenCode 版本为准；以下是“最常见位置”。

- OpenCode CLI（常见）：`%USERPROFILE%\.config\opencode\opencode.json` 或 `opencode.jsonc`
- OpenCode CLI（兼容路径）：`%APPDATA%\opencode\opencode.json` 或 `opencode.jsonc`
- OpenCode Desktop（可能）：`%APPDATA%\ai.opencode.desktop\opencode.json` 或 `opencode.jsonc`

### 0.3 本插件项目级配置（推荐）
- 项目级：`<project>/.opencode/novel.jsonc`
- 全局级：`%USERPROFILE%\.config\opencode\novel.jsonc`（如你选择支持用户级覆盖）

## 1. 总目标与范围

### 1.1 总目标
- 让作者/编辑在 OpenCode 中通过 `/命令` + `skill` 完成：建档 → 大纲 → 角色/设定 → 写章 → 审章 → 一致性/伏笔对账 → 导出发布。
- 将“容易遗忘/容易冲突”的部分（时间线、人物状态、伏笔承诺）交给工具自动维护，输出结构化报告，能被 LLM 和人同时使用。

### 1.2 范围（要做）
- OpenCode 插件包（npm 包形态），`dist/index.js` 默认导出 Plugin。
- Zod schema + JSONC 配置读取与合并（项目级/用户级）。
- 内置工具（scan/index/context-pack/continuity/foreshadowing/export 等）。
- 内置命令（固定流程，模板驱动）。
- 内置技能（专家提示词库，模板驱动）。
- 可选后台任务（长耗时巡检、索引增量更新、报告定期生成）。

### 1.3 非目标（先不做/可后续）
- GUI 写作编辑器（不做 UI，依赖编辑器/Obsidian/VSCode）。
- 全自动长篇“一键生成整本”（提供流程与校验，不替代作者）。
- 侵入式改写用户原文（默认只生成派生文件；改写需显式命令）。
- 依赖云端数据库（默认本地文件系统即可；可选 MCP/向量检索后置）。

---

## 2. 关键设计原则（对齐 oh-my-opencode 的工程哲学）

1) **模板驱动**：Commands/Skills 以模板字符串为核心产物，明确输入/输出/约束。  
2) **工具可测、输出可复现**：工具输出稳定（排序/格式固定）；派生文件可通过 golden tests 验证。  
3) **低开销 Hooks**：避免重型 PreToolUse；只做轻量路由/提醒/自动建议。  
4) **文件即数据库**：Markdown + frontmatter 为事实来源；索引/报告为派生物。  
5) **强类型边界**：所有工具入参/出参定义类型（Zod/TS）；错误有错误码与可读提示。  
6) **可扩展**：规则引擎、模板、数据模型都允许用户覆盖/扩展（项目级 `.opencode`）。  
7) **面向长篇**：大工程要增量扫描、缓存与并发（后台任务/分段计算），避免每次全量重算。

---

## 3. 目标形态：插件工程结构（建议）

```
novel/
  package.json
  bun.lockb
  tsconfig.json
  src/
    index.ts
    config/
      schema.ts              # Zod schema（导出 schema.json）
      defaults.ts            # 默认配置
      load.ts                # JSONC 读取、合并（项目/用户）
      types.ts               # TS types
    features/
      builtin-commands/
        commands.ts          # 注册 builtin commands
        templates/           # 每个 command 一个模板
          novel-init.ts
          novel-import.ts
          novel-bootstrap.ts
          novel-index.ts
          novel-entities-audit.ts
          novel-graph.ts
          novel-character-report.ts
          novel-outline.ts
          novel-extract-entities.ts
          novel-apply-candidates.ts
          novel-chapter-plan.ts
          novel-chapter-draft.ts
          novel-chapter-review.ts
          novel-continuity-check.ts
          novel-foreshadowing-audit.ts
          novel-export.ts
          novel-bible.ts
          novel-style-guide.ts
          novel-rewrite.ts
          novel-snapshot.ts
      builtin-skills/
        skills.ts            # 注册 builtin skills（工厂）
        skills/
          novel-oracle.ts
          novel-entity-extractor.ts
          novel-character-expert.ts
          novel-faction-relations.ts
          novel-worldbible-keeper.ts
          novel-timeline-keeper.ts
          novel-continuity-sentinel.ts
          novel-foreshadowing-unresolved.ts
          novel-flaw-finder.ts
          novel-continuation-expert.ts
          novel-polish-expert.ts
          novel-summary-expert.ts
      opencode-loaders/      # 发现项目级/用户级 commands/skills（可选）
      background-agent/      # 长任务（可选，按需实现）
    tools/
      novel-scan/
      novel-index/
      novel-context-pack/
      novel-continuity/
      novel-foreshadowing/
      novel-export/
      novel-style/
      novel-bible/
    agents/                  # 内置 Agents（导出到 OpenCode agent 列表，直接可用）
      muse.ts
      editor.ts
      sentinel.ts
    hooks/                   # 可选：轻量 hook（自动建议/提醒）
      auto-slash-command/
      reminders/
    shared/
      markdown/
      fs/
      hashing/
      sorting/
      errors/
    types/
      novel.ts               # 领域类型（chapter/character/thread）
  docs/
    workflow.md
    data-model.md
    commands.md
    skills.md
    rules.md
  assets/
    templates/
      chapter.md
      character.md
      faction.md
      thread.md
      location.md
      bible.md
```

关键点（必须对齐 oh-my-opencode 的注意事项）：
- `dist/index.js` **只导出 default Plugin**；避免导出普通函数（OpenCode 可能会把所有 exports 当插件实例调用）。
- `package.json` 使用 ESM（`"type":"module"`），`main/exports` 指向 `dist/index.js`，并导出 `dist/index.d.ts`。
- 构建：`bun build` + `tsc --emitDeclarationOnly` + `build:schema`（输出 schema.json 供用户配置校验）。

### 3.1 插件入口（`src/index.ts`）职责（参考 oh-my-opencode）

目标：保持入口层“薄”，把复杂度下沉到 `features/*` 与 `tools/*`，便于适配 OpenCode 版本变化。

- 加载配置：`loadNovelConfig(ctx.directory, ctx)`（JSONC + Zod 校验 + 合并默认值）
- 初始化核心组件：
  - cache/index 输出目录准备（必要时创建）
  - （可选）BackgroundManager：后台任务/并发（仅在启用时初始化）
- 注册 tools（强类型）：`createNovelTools({ ctx, config })`
- 加载 skills（模板）：
  - builtin skills：`createBuiltinSkills(...)`
  - （可选）发现 project/user skills：`discover...` → `mergeSkills(...)`
  - 注册 `skill` 工具（让用户/命令可以调用 skill）
- 加载 commands：
  - builtin commands（模板）+ project commands（`.opencode/command`）
- 注册 `slashcommand` 工具（让用户通过 `/novel-*` 使用命令）
- Hooks（轻量）：
  - `auto-slash-command`：建议命令，不做重活
  - `reminders`：提醒补齐索引/线程卡
- Agents 导出（对齐 oh-my-opencode 的方式）：
  - 在插件 `config` handler 中把内置 `novel-*` agents 注入到 OpenCode 的 `config.agent`
  - 允许通过 `novel.jsonc` 禁用/覆盖 agent（模型、温度、工具开关等）
- 导出规则：入口只 `export default` 插件实例；其他只能 `export type`（避免被误当插件调用）

### 3.2 命名规范与冲突策略（必须写死）

#### 命名规范
- **OpenCode tools**：全部使用 `snake_case`，且 novel 领域工具必须以 `novel_` 前缀开头：
  - 例：`novel_scan`、`novel_import`、`novel_index`、`novel_continuity_check`
- **Slash commands**：全部使用 `kebab-case`，并以 `novel-` 前缀开头：
  - 例：`/novel-import`、`/novel-chapter-review`
- **Agents**：全部使用 `kebab-case`，并以 `novel-` 前缀开头：
  - 例：`novel-muse`、`novel-editor`、`novel-sentinel`
- **Skills**：全部使用 `kebab-case`，并以 `novel-` 前缀开头（避免与其他插件/用户技能冲突）：
- 例：`novel-character-expert`、`novel-summary-expert`、`novel-polish-expert`

#### 与其他插件的冲突策略（特别是 oh-my-opencode）
- 任何 **novel_** 前缀工具不会与 oh-my-opencode 冲突（其工具名不使用该前缀）。
- `slashcommand` / `skill` / `skill_mcp` 这类“通用工具名”若你希望与 oh-my-opencode 共存，必须可配置关闭：
  - 本插件配置增加：`compat.export_slashcommand_tool`、`compat.export_skill_tool`（默认 true；共存时手动设为 false）
  - 关闭后：你依赖 OpenCode/其他插件提供的 `slashcommand/skill` 工具来加载 `.opencode/command` 与 `.opencode/skills`

### 3.3 插件对 OpenCode 的输出形态（实现者按此写）

> 说明：OpenCode 会调用插件默认导出的 `Plugin` 工厂并接收返回对象。入口必须薄，复杂逻辑下沉到 `features/*` 与 `tools/*`。

伪代码结构（仅示意关键点）：
```ts
import type { Plugin } from "@opencode-ai/plugin"

const NovelPlugin: Plugin = async (ctx) => {
  const config = loadNovelConfig(ctx.directory, ctx)

  // tools（novel_ 前缀 + 可选通用工具）
  const novelTools = createNovelTools({ ctx, config })
  const maybeSlashcommand = config.compat.export_slashcommand_tool ? createSlashcommandTool(...) : null
  const maybeSkill = config.compat.export_skill_tool ? createSkillTool(...) : null

  // hooks（轻量）
  const hooks = createNovelHooks({ ctx, config })

  // config handler（注入 novel agents）
  const configHandler = createNovelConfigHandler({ ctx, config })

  return {
    tool: {
      ...novelTools,
      ...(maybeSlashcommand ? { slashcommand: maybeSlashcommand } : {}),
      ...(maybeSkill ? { skill: maybeSkill } : {}),
      // ...(maybeSkillMcp ? { skill_mcp: maybeSkillMcp } : {}),
    },
    config: configHandler,
    ...hooks,
  }
}

export default NovelPlugin
```

---

## 4. 配置系统（JSONC + Zod）完备设计

### 4.1 配置位置与优先级
建议三层（可按 OpenCode 能力调整）：
1) **项目级**：`<project>/.opencode/novel.jsonc`（覆盖最高）
2) **用户级**：`~/.config/opencode/novel.jsonc`
3) **默认值**：`src/config/defaults.ts`

合并规则：
- 深合并（对象）/覆盖（标量、数组默认替换，可提供 `mergeStrategy`）
- `disabled_commands` / `disabled_skills` / `disabled_rules` 统一用数组，最后合并去重

### 4.2 Schema 字段（建议全量）
#### 基础
- `projectRoot`: string（默认 plugin ctx.directory）
- `manuscriptDir`: string（默认 `manuscript`）
- `language`: `"zh" | "en"`（默认 `"zh"`）
- `encoding`: `"utf8"`（默认）

#### 写作约束（全局风格/禁忌/叙事）
- `styleGuide`：
  - `pov`: `"first" | "third_limited" | "third_omniscient" | "multi"`
  - `tense`: `"past" | "present" | "mixed"`
  - `tone`: string（如：冷峻/轻喜/史诗）
  - `taboos`: string[]（显式禁忌/避免要素）
  - `rating`: `"G"|"PG"|"R"|"NC-17"|string`
  - `lexicon`: `{ preferred: string[]; avoid: string[] }`

#### 数据模型约束
- `naming`：
  - `chapterIdPattern`: string（regex）
  - `threadIdPattern`: string（regex）
  - `characterIdPattern`: string（regex）
  - `factionIdPattern`: string（regex）
  - `locationIdPattern`: string（regex）
  - `dateFormat`: string（ISO/自定义）
- `frontmatter`：各实体允许字段、必填字段策略（strict/loose）

#### 索引/缓存
- `index`：
  - `outputDir`: string（默认 `.opencode/novel` 或 `manuscript/.derived`）
  - `cacheDir`: string（默认 `.opencode/novel/cache`）
  - `stableSortLocale`: string（默认 `"zh-CN"`）
  - `writeDerivedFiles`: boolean（默认 true）

#### 一致性规则引擎
- `continuity`：
  - `enabled`: boolean
  - `rules`: `{ id: string; enabled: boolean; severity: "error"|"warn"|"info"; params?: object }[]`
  - `strictMode`: boolean（严格模式下把 warn 也当 error）

#### 伏笔/承诺系统
- `threads`：
  - `enabled`: boolean
  - `requireClosePlan`: boolean（未回收必须给出计划）
  - `staleDaysWarn`: number

#### 导出
- `export`：
  - `formats`: (`"md"|"html"|"epub"|"docx"`)[]（epub/docx 可后置）
  - `chapterOrder`: `"by_id"|"by_timeline"|"custom"`
  - `includeFrontmatter`: boolean
  - `outputDir`: string

#### LLM 上下文打包（Context Pack）
- `contextPack`：
  - `maxChars`: number / `maxTokens`（如由 OpenCode 暴露）
  - `include`: `{ bible: boolean; characters: boolean; openThreads: boolean; lastChapters: number }`
  - `redaction`: `{ enabled: boolean; patterns: string[] }`

#### Agents（导出到 OpenCode）
- `agents_enabled`: boolean（默认 true；关闭则不向 OpenCode 注入 novel agents）
- `agent_name_prefix`: string（默认 `"novel-"`；用于避免与其他插件/用户自定义 agent 名冲突）
- `agents_preset`: `"core" | "full"`（默认 `"core"`；`core` 只导出 muse/editor/sentinel；`full` 额外导出各专家 agent，见 10.1）
- `disabled_agents`: string[]（默认空；填“baseName”（不含前缀）；core：`muse`/`editor`/`sentinel`；full 还支持 `oracle`/`entity-extractor`/`character-expert`/…）
- `agents_force_override`: boolean（默认 false；true 时允许覆盖用户已存在的同名 agent 配置，谨慎启用）
- `agents`: 对每个 agent 的 override（键为最终导出的 agent name），支持：
  - `model` / `variant` / `temperature` / `top_p` / `maxTokens`
  - `category`（若你实现“分类默认值/模型链”）
  - `prompt` / `prompt_append`
  - `tools`: `Record<string, boolean>`（按 OpenCode 规则启用/禁用工具）
  - `permission`：`edit` / `bash` / `webfetch` 等（按 OpenCode permission 体系）

#### 扩展与覆盖
- `customTemplatesDir`: string（项目级覆盖内置模板）
- `customRulesDir`: string（加载用户自定义规则）
- `skills`: 允许用户注入额外 skills 定义（或覆盖 builtin 的描述/template）

#### Import（逆向导入/迁移到 `manuscript/`，默认不改原文）
> 你已确认：**不修改原文**，默认生成/使用 `manuscript/`；因此 `import.defaultMode` 固定默认 `copy`。

- `import`：
  - `enabled`: boolean（默认 true）
  - `defaultMode`: `"copy" | "analyze"`（默认 `"copy"`；`analyze` 仅生成报告，不写入 `manuscript/`）
  - `includeGlobs`: string[]（默认 `["**/*.md", "**/*.txt"]`）
  - `excludeGlobs`: string[]（默认忽略：`.git/**`、`.opencode/**`、`node_modules/**`、`dist/**`、`build/**`、`out/**`、`.cache/**`）
  - `chapterDetection`：
    - `mode`: `"heading_heuristic"`（默认）
    - `patterns`: `{ id: string; regex: string; flags?: string }[]`（默认提供中文“第X章”和英文“Chapter N”）
    - `enableLooseH1AfterFirstMatch`: boolean（默认 true；避免把普通标题误判为章）
  - `chapterId`：
    - `scheme`: `"from_heading"`（默认：从“第X章/Chapter N”提取）
    - `prefix`: string（默认 `"ch"`）
    - `pad`: number（默认 4）
    - `specialPrefix`: string（默认 `"sp"`；用于“序章/尾声/番外”等无法编号章节）
  - `multiChapterFiles`: `"split"`（默认；一个源文件含多个章节标题时按标题拆分）
  - `manuscriptExistsPolicy`: `"merge"`（默认；合并写入但不覆盖既有章节文件，见 `novel_import` 规则）

#### Compatibility（与其他插件共存）
- `compat`：
  - `export_slashcommand_tool`: boolean（默认 true；若与其他插件冲突可关）
  - `export_skill_tool`: boolean（默认 true；若与其他插件冲突可关）
  - `export_skill_mcp_tool`: boolean（默认 false；后续需要 skill MCP 再开启）

#### Disabled（统一禁用开关）
- `disabled_commands`: string[]（默认空；匹配 command 名，如 `"novel-export"`）
- `disabled_skills`: string[]（默认空；匹配 skill 名，如 `"novel-summary-expert"`）
- `disabled_rules`: string[]（默认空；匹配 rule id，如 `"CONT_TIME_OVERLAP"`）

### 4.3 `novel.jsonc` 示例（可直接复制）
```jsonc
{
  // 根目录：默认等于 OpenCode 打开的目录（ctx.directory）
  "manuscriptDir": "manuscript",

  "index": {
    "outputDir": ".opencode/novel",
    "cacheDir": ".opencode/novel/cache",
    "stableSortLocale": "zh-CN",
    "writeDerivedFiles": true
  },

  "import": {
    "enabled": true,
    "defaultMode": "copy",
    "includeGlobs": ["**/*.md", "**/*.txt"],
    "excludeGlobs": [".git/**", ".opencode/**", "node_modules/**", "dist/**", "build/**", "out/**", ".cache/**"],
    "chapterDetection": {
      "mode": "heading_heuristic",
      "enableLooseH1AfterFirstMatch": true,
      "patterns": [
        { "id": "zh_chapter", "regex": "^\\s*#*\\s*第([0-9一二三四五六七八九十百千万两〇零]+)\\s*章(.*)$", "flags": "i" },
        { "id": "en_chapter", "regex": "^\\s*#*\\s*Chapter\\s+(\\d+)\\s*[:：-]?\\s*(.*)$", "flags": "i" }
      ]
    },
    "chapterId": { "scheme": "from_heading", "prefix": "ch", "pad": 4, "specialPrefix": "sp" },
    "multiChapterFiles": "split",
    "manuscriptExistsPolicy": "merge"
  },

  "agents_enabled": true,
  "agent_name_prefix": "novel-",
  "disabled_agents": [],
  "agents": {
    "novel-editor": {
      "temperature": 0.1,
      "permission": { "edit": "deny" }
    }
  },

  "compat": {
    "export_slashcommand_tool": true,
    "export_skill_tool": true,
    "export_skill_mcp_tool": false
  }
}
```

---

## 5. 小说工程数据模型（事实来源）完备规范

### 5.1 目录约定（manuscriptDir）
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
  snapshots/                # 可选：阶段性冻结
    <date>-<tag>.md
```

### 5.1.1 ID 约定（建议默认规则，便于工具确定性）
> 说明：章节 ID 在 import 中已固定为 `ch0001` 这类递增/可排序格式；其余实体建议使用“前缀 + slug”，并在必要时回退 hash，确保稳定与可落盘。

- `chapter_id`：`ch` + 4 位数字（例：`ch0001`）
- `thread_id`：默认 `th-` + 数字或 slug（例：`th-001`、`th-矿井事故`）；可在 `threads/*.md` 自定义
- `character id`：`char-` + `slug(name)`（例：`char-zhangsan`）
- `faction id`：`fac-` + `slug(name)`（例：`fac-blackhand`）
- `location id`：`loc-` + `slug(name)`（例：`loc-town`）

`slug()` 规则（实现时写死，保证一致性）：
- trim → 空白折叠为 `-` → 去掉标点（保留中英文/数字/连字符）→ lowercase
- 结果为空则回退：`hash8(original)`（保证可用且稳定）

派生目录（默认写入，不手改）：
```
.opencode/novel/
  INDEX.md
  TIMELINE.md
  THREADS_REPORT.md
  CONTINUITY_REPORT.md
  ENTITY_GAPS.md              # 引用缺失/字段缺失盘点（可选：自动补 stub）
  CHARACTER_REPORT.md         # 角色出场/线程参与/弧光摘要（从事实源聚合）
  APPLY_REPORT.md             # candidates 应用审计报告（由 novel_apply_candidates 生成）
  GRAPH/
    RELATIONSHIPS.mmd         # Mermaid：人物关系图（metadata 优先，缺省回退共现图）
    FACTIONS.mmd              # Mermaid：势力关系图（metadata 优先）
  CONTEXT_PACKS/
  cache/
    scan.json
    hash.json
    last-run.json
    entity-gaps.json
    candidates.json
```

### 5.2 Frontmatter（建议字段）
#### Chapter
- `chapter_id`（必填）
- `title`
- `pov`（可选，覆盖全局）
- `timeline`：`{ date?: string; start?: string; end?: string; location?: string }`
- `characters`: string[]（角色 id）
- `threads_opened`: string[]
- `threads_advanced`: string[]
- `threads_closed`: string[]
- `summary`（可选，给索引/导出使用）
- `tags`: string[]

#### Character
- `id`（必填）
- `name` / `alias`: string[]
- `age` / `appearance`
- `motivation` / `desire`
- `arc`（阶段/转折）
- `voice`：口癖/句式/禁用词
- `relationships`: `{ target: string; type: string; notes?: string }[]`

#### Thread（伏笔/承诺）
- `thread_id`（必填）
- `type`: `"foreshadowing"|"promise"|"mystery"|"setup"|"debt"|string`
- `opened_in`: `{ chapter_id: string; note?: string }`
- `expected_close_by`（可选：章节/日期/区间）
- `status`: `"open"|"in_progress"|"closed"|"abandoned"`
- `close_plan`（未回收必须有）
- `closed_in`（若已回收）

#### Faction（势力/组织）
- `id`（必填）
- `name`
- `type`（宗门/公司/国家/帮派…）
- `goal` / `motto`
- `leader` / `core_members`: string[]
- `resources`: string[]
- `territory`: string[]（地点 id）
- `relationships`: `{ target: string; type: "ally"|"enemy"|"vassal"|"neutral"|string; notes?: string }[]`

#### Location（地点）
- `id`（必填）
- `name`
- `type`（城市/建筑/区域/星球…）
- `region`（可选：大区划）
- `rules`: string[]（禁忌/限制/通行条件）
- `connected`: `{ target: string; type?: string; notes?: string }[]`

### 5.2.1 标准文件模板（实现时必须提供）

#### `manuscript/chapters/<chapter_id>.md`
```md
---
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
summary: "张三在镇口遇到李四，得知矿井出事。"
tags: [intro]
source: # 仅导入/生成时写入，手工创作可省略
  imported_from: "drafts/book.md"
  imported_at: "2026-02-03T12:00:00Z"
---

# 第一章：起风

## Scene 1（镇口）
（正文……）
```

#### `manuscript/characters/<id>.md`
```md
---
id: char-zhangsan
name: "张三"
alias: ["三儿"]
age: 19
appearance: "瘦高，左眉有一道浅疤。"
motivation: "查清父亲之死。"
desire: "离开小镇。"
arc:
  - phase: "起点"
    state: "逃避真相"
  - phase: "转折"
    state: "主动追查"
voice:
  catchphrases: ["我不信。", "你确定？"]
  preferred: ["短句", "反问"]
  avoid: ["大段旁白腔"]
relationships:
  - target: char-lisi
    type: friend
    notes: "童年伙伴，彼此信任但信息不对称。"
---

# 张三（角色卡）

## 核心矛盾
- 外部：矿井事故背后有人操盘
- 内部：恐惧承担真相带来的代价

## 出场记录
（由索引工具自动生成，或手写补充）
```

#### `manuscript/threads/<thread_id>.md`
```md
---
thread_id: th-001
type: mystery
status: open
opened_in:
  chapter_id: ch0001
  note: "矿井事故的真相"
expected_close_by: ch0010
close_plan: "第10章揭示矿主与县衙勾结，给出证据链。"
closed_in: null
---

# th-001：矿井事故真相（线程卡）

## 线索清单
- （条目……）
```

#### `manuscript/bible/world.md`（世界观）
```md
# 世界观（World Bible）

## 规则条款
1. R-001：镇上夜间宵禁（20:00 后不得外出）
2. R-002：矿井入口只有两处（北口/西口）

## 名词表（可由工具派生到 glossary.md）
- 矿主：……
```

### 5.2.2 派生文件格式（实现时必须固定，便于 golden test）

派生文件一律写入：`.opencode/novel/`（默认），并在文件头写入版本标记，禁止手工编辑：
- `INDEX.md`
- `TIMELINE.md`
- `THREADS_REPORT.md`
- `CONTINUITY_REPORT.md`
- `FORESHADOWING_AUDIT.md`
- `STYLE_REPORT.md`
- `IMPORT_REPORT.md`

建议统一文件头（示例）：
```md
<!-- novel:derived v1; DO NOT EDIT BY HAND -->
```

`INDEX.md` 建议结构（固定标题）：
- `# INDEX`
- `## Chapters`（表：`chapter_id | title | pov | date | location | characters | threads_opened | threads_closed`）
- `## Characters`（表：`id | name | aliases | first_seen | last_seen | appearances`）
- `## Threads`（表：`thread_id | type | status | opened_in | expected_close_by | closed_in`）
- `## Factions`（表：`id | name | role | appearances`）
- `## Locations`（表：`id | name | appearances`）

`CONTINUITY_REPORT.md` 建议结构（固定标题）：
- `# CONTINUITY REPORT`
- `## Summary`（error/warn/info 计数）
- `## Findings`（每条 finding 必含：severity、ruleId、message、evidence、suggestedFix）

### 5.3 解析与容错策略
- 解析失败：
  - 工具返回 `diagnostics[]`（含 filePath、message、severity、suggestedFix）
  - 不直接崩溃（除非 `strictMode`），尽可能生成部分索引并标注错误
- ID 冲突：
  - 视为 error；索引里标红并给出 rename 建议

---

## 6. Tools（可测内核）完备设计

> 每个工具目录结构对齐 oh-my-opencode：`types.ts` / `tool.ts` / `index.ts` / `*.test.ts`。

### 6.0 工具通用约定（实现者必须遵守）

#### 6.0.1 I/O 与输出格式（统一）
- 领域工具统一返回 **Markdown 文本**，其中必须包含一段机器可读 JSON（用于后续命令/agent 复用）。
- 统一输出结构：
  1) `## Summary`：一句话 + 计数/耗时
  2) `## Result (JSON)`：` ```json ... ``` `
  3) `## Diagnostics`：按 severity 排序输出（error→warn→info）
- 任何工具一律不抛“裸异常”给用户：异常转为 `diagnostics` + `Summary` 中说明；除非是参数校验错误（可 throw）。

#### 6.0.2 统一 `Diagnostic` 结构（建议在 `src/shared/errors/diagnostics.ts` 定义）
```ts
export type DiagnosticSeverity = "error" | "warn" | "info"

export type DiagnosticEvidence = {
  file: string               // 相对 projectRoot
  line?: number              // 1-based
  excerpt?: string           // <= 200 chars
}

export type Diagnostic = {
  severity: DiagnosticSeverity
  code: string               // 稳定错误码，如 "PARSE_FRONTMATTER"
  message: string
  file?: string
  line?: number
  evidence?: DiagnosticEvidence[]
  suggestedFix?: string
}
```

#### 6.0.3 路径与换行（Windows 必须正确）
- 所有写入文件统一使用 `LF`（`\n`）作为换行，避免 CRLF 造成 golden test 抖动。
- 所有输出 JSON 内的路径统一使用 **项目相对路径**（基于 `projectRoot = ctx.directory`），并使用 `/` 作为分隔符（输出层），内部可用 `path` 处理。

#### 6.0.4 写入策略（不破坏用户原文）
- 工具只允许写入：
  - `manuscript/**`（事实源：可由命令/导入生成）
  - `.opencode/novel/**`（派生物：可覆盖写）
  - `export/**`（导出产物）
- **禁止**写入 `fromDir` 的原始文件（`novel_import` 明确要求“不修改原文”）。
- 覆盖策略必须显式：对 `manuscript/chapters/*.md` 默认不覆盖；对 `.opencode/novel/*.md` 默认覆盖。

#### 6.0.5 缓存（增量扫描必做）
- `.opencode/novel/cache/scan.json`：存扫描快照（含每个文件 hash）
- `.opencode/novel/cache/import-map.json`：存导入映射（source→output）
- `.opencode/novel/cache/last-run.json`：存最近一次运行的版本、时间、参数摘要

#### 6.0.6 可选“通用工作流工具”（与 oh-my-opencode 同款）
> 用于加载 `.opencode/command` 与 `.opencode/skills` 并把模板返回给模型。若与 oh-my-opencode 共存冲突，可用 `compat.export_*` 关闭。

- `slashcommand`（若启用）：
  - 搜索命令目录优先级（建议与 oh-my-opencode 一致）：builtin → `.opencode/command` → `.claude/commands` → `~/.config/opencode/command` → `~/.config/claude/commands`
  - 解析 frontmatter（字段：`description`、`argument-hint`、`model`、`agent`、`subtask`）
  - 输出：格式化后的 “命令说明 + 已替换的参数 + resolved file refs”
- `skill`（若启用）：
  - 搜索技能目录优先级：builtin → `.opencode/skills` → `~/.config/opencode/skills` → `.claude/skills`
  - 解析 `SKILL.md` frontmatter（字段：`name`、`description`、`argumentHint`、`agent`）
  - 输出：技能正文（优先抽取 `<skill-instruction>...</skill-instruction>`）

### 6.1 `novel_scan`
职责：扫描小说工程，解析 frontmatter 与引用关系，产出标准化“项目快照”（供索引/巡检/导出/上下文打包复用）。

- 输入：`rootDir`、`manuscriptDir`、扫描策略（全量/增量）、`strictMode`
- 输出：
  - `entities`：chapters/characters/threads/... 的元数据（id、title、文件路径、关系引用）
  - `diagnostics[]`：解析错误/缺字段/ID 冲突/死链等
  - `stats`：文件数、实体数、耗时
- 关键实现点：
  - YAML frontmatter 解析（严格与宽松两档）
  - wikilink/markdown link 解析（用于关系/死链检查）
  - 增量：对文件内容做 hash（mtime + size + content-hash），跳过未变更文件
  - 稳定排序：所有输出数组按固定 key 排序（避免 diff 抖动）
- 副作用：可选写入 `.opencode/novel/cache/scan.json`
- 测试：
  - fixture 工程扫描快照（稳定排序）
  - frontmatter 容错（缺字段、坏 YAML、重复 ID）

**Tool 名（OpenCode）**：`novel_scan`

**Args（必须实现，建议 Zod）**：
```ts
export type NovelScanMode = "full" | "incremental"

export type NovelScanArgs = {
  rootDir?: string            // default: ctx.directory
  manuscriptDir?: string      // default: config.manuscriptDir
  mode?: NovelScanMode        // default: "incremental"
  strictMode?: boolean        // default: config.continuity.strictMode ?? false
  writeCache?: boolean        // default: true
}
```

**Result JSON（必须稳定字段名）**：
```ts
export type NovelFileHash = {
  path: string
  mtimeMs: number
  size: number
  sha256: string
}

export type ChapterEntity = {
  chapter_id: string
  title?: string
  path: string
  pov?: string
  timeline?: { date?: string; start?: string; end?: string; location?: string }
  characters?: string[]
  threads_opened?: string[]
  threads_advanced?: string[]
  threads_closed?: string[]
  summary?: string
  tags?: string[]
}

export type CharacterEntity = { id: string; name?: string; path: string; alias?: string[] }
export type ThreadEntity = { thread_id: string; type?: string; status?: string; path: string }
export type FactionEntity = { id: string; name?: string; path: string }
export type LocationEntity = { id: string; name?: string; path: string }

export type NovelScanResultJson = {
  version: 1
  rootDir: string
  manuscriptDir: string
  stats: { filesScanned: number; entities: Record<string, number>; durationMs: number }
  files: NovelFileHash[]
  entities: {
    chapters: ChapterEntity[]
    characters: CharacterEntity[]
    threads: ThreadEntity[]
    factions: FactionEntity[]
    locations: LocationEntity[]
  }
  diagnostics: Diagnostic[]
  cache: { scanCachePath?: string }
}
```

**实现算法（必须按此顺序）**：
1) 解析 `rootDir/manuscriptDir` 下的固定子目录（`chapters/characters/threads/factions/locations/bible`），忽略未知目录但记录为 info。
2) 对每个文件读取：
   - Markdown：解析 YAML frontmatter + 正文
   - TXT：仅用于 `novel_import`；`novel_scan` 默认忽略 `.txt`（避免把源草稿当事实源），除非 `config.import.enabled` 且你显式把 txt 复制进 `manuscript/`。
3) 生成 `NovelFileHash`：
   - `sha256` 对文件内容（UTF-8，行尾归一化为 `\n` 后再 hash）
4) 增量模式：
   - 读取 `.opencode/novel/cache/scan.json`（若存在）
   - hash 不变则跳过解析实体，但仍保留旧实体结果；最后写回新 cache（稳定排序）
5) 校验：
   - `chapter_id/id/thread_id` 必须唯一
   - 引用校验：`characters[]` 引用的角色必须存在（否则 warn/error 取决于 strictMode）
6) 输出：
   - 返回 Markdown + JSON
   - 若 `writeCache=true`，写入 `.opencode/novel/cache/scan.json`

### 6.2 `novel_index`
职责：根据 scan 快照生成派生文件（INDEX/TIMELINE/THREADS_REPORT），并保持稳定格式。

- 输入：scan 快照 + index 配置（输出目录、排序规则、是否覆盖写）
- 输出：
  - `INDEX.md`：角色/势力/地点/线程/章节索引（含引用计数与最后出现章节）
  - `TIMELINE.md`：按时间/章节聚合的事件线（缺省时间时退化为章节顺序）
  - `THREADS_REPORT.md`：线程状态总览（open/in_progress/closed/abandoned）
- 关键实现点：
  - 稳定排序：按 id、再按文件路径；时间线按可解析时间优先，否则按章节 id
  - 写入策略：仅覆盖“派生区块”（保留用户手写区块可选）
  - 变更最小化：生成内容 hash，不变则不写，降低 git diff 噪音
- 测试：
  - golden files（INDEX/TIMELINE/THREADS_REPORT）对比
  - 稳定性：同输入多次运行输出完全一致

**Tool 名（OpenCode）**：`novel_index`

**Args（建议 Zod）**：
```ts
export type NovelIndexArgs = {
  rootDir?: string            // default: ctx.directory
  manuscriptDir?: string      // default: config.manuscriptDir
  outputDir?: string          // default: config.index.outputDir
  writeDerivedFiles?: boolean // default: config.index.writeDerivedFiles
  forceWrite?: boolean        // default: false（true 时即使内容相同也重写文件）
}
```

**Result JSON**：
```ts
export type NovelIndexResultJson = {
  version: 1
  outputDir: string
  writtenFiles: string[]      // 相对 rootDir
  skippedFiles: string[]      // 内容无变化跳过
  stats: { chapters: number; characters: number; threads: number; durationMs: number }
  diagnostics: Diagnostic[]
}
```

**实现算法（必须定死）**：
1) 获取 scan 快照：
   - 内部调用共享函数 `loadOrScan({ mode: "incremental" })`（复用 6.1 cache）
2) 生成 `INDEX.md`：
   - 按 `chapter_id` 排序列出章节
   - 角色 appearances：统计 `chapters[*].characters` 引用次数
   - first_seen/last_seen：按章节顺序（`chapterOrder=by_id` 时按 id）推断
3) 生成 `TIMELINE.md`：
   - 若 `chapter.timeline.date/start` 可解析：按（date,start,chapter_id）排序
   - 否则退化为章节顺序（by_id）
4) 生成 `THREADS_REPORT.md`：
   - 以 `threads/*.md` 为准，章节 frontmatter 的 opened/closed 用作交叉校验：
     - thread.status=closed 但没有 `closed_in` → warn
     - thread.closed_in 指向不存在章节 → error/warn（strictMode）
5) 写入输出目录：
   - 文件头写 `<!-- novel:derived v1; DO NOT EDIT BY HAND -->`
   - 内容不变则跳过写（除非 `forceWrite`）
6) 返回 Summary + JSON + Diagnostics

### 6.3 `novel_context_pack`
职责：为 LLM 生成“最相关、最短”的上下文包，避免把整本书塞进上下文窗口。

- 输入：目标（`chapter_id`/`thread_id`/`taskType`=draft|review|rewrite），预算（maxChars/maxTokens），include 策略
- 输出：
  - `CONTEXT_PACKS/<key>.md`（可选落盘）：bible 摘要、相关角色卡、相关线程、最近 N 章摘要/关键片段
  - `selectionReport`：为什么选这些文件（可解释性）
- 关键实现点：
  - 召回：引用图（章节↔角色↔线程↔地点），优先取直接邻居，再取二跳
  - 压缩：优先用 `summary`/frontmatter 字段；必要时抽取“相关段落”（基于 heading/标记）
  - 隐私：可选 redaction（替换敏感信息）
- 测试：
  - 选择策略确定性（同输入同选集）
  - budget 截断规则（不会截断到破坏结构）

**Tool 名（OpenCode）**：`novel_context_pack`

**Args（建议 Zod）**：
```ts
export type NovelContextPackTask =
  | "draft"
  | "review"
  | "rewrite"
  | "continuity"
  | "foreshadowing"

export type NovelContextPackArgs = {
  rootDir?: string
  manuscriptDir?: string
  task: NovelContextPackTask
  chapter_id?: string
  thread_id?: string
  budget: { maxChars: number } // MVP 先按字符预算，后续可扩展 maxTokens
  include?: { bible?: boolean; characters?: boolean; openThreads?: boolean; lastChapters?: number }
  redaction?: { enabled: boolean; patterns: string[] }
  writeFile?: boolean          // default: true
}
```

**Result JSON**：
```ts
export type NovelContextPackResultJson = {
  version: 1
  packPath?: string            // 相对 rootDir
  included: { path: string; reason: string; chars: number }[]
  stats: { totalChars: number; budgetChars: number }
  diagnostics: Diagnostic[]
}
```

**实现算法（必须可解释）**：
1) 获取 scan 快照（同 6.2）
2) 选集策略（确定性）：
   - 若给了 `chapter_id`：以该章为中心
     - 直接依赖：bible + chapter + chapter.characters + chapter.threads_opened/advanced/closed
     - 邻近章节：取 `lastChapters`（默认 3）个最近章节（按 chapterOrder=by_id）
   - 若给了 `thread_id`：取该线程卡 + opened/closed 对应章节 + 相关角色
3) 压缩策略：
   - 优先收录：frontmatter summary（若存在）和线程 close_plan
   - 正文只截取：`#`/`## Scene` 标题下的首段（实现时写死“每节最多 N 字”）
4) 脱敏（如启用）：
   - 对 pack 内容执行正则替换（patterns）
5) 写入：
   - 写入 `.opencode/novel/CONTEXT_PACKS/<task>-<key>.md`
6) 返回 JSON：必须包含 included 列表与 reason（可解释性）

### 6.4 `novel_continuity_check`
职责：一致性规则引擎：检测时间线、地点、角色状态、道具、设定冲突，并给出可执行修复建议。

- 输入：scan 快照 + continuity 配置（启用规则、严重级别、strict）
- 输出：`CONTINUITY_REPORT.md` + `diagnostics[]`（可直接回显）
- 规则引擎设计：
  - `Rule`：`id`、`description`、`severityDefault`、`run(context) -> Finding[]`
  - `Finding`：`ruleId`、`severity`、`message`、`evidence[]`（file + excerpt/lineHint）、`suggestedFix`
  - 规则参数可配置（例如“同日最大位移距离”“角色状态字段映射”等）
- 规则集（完备目标，分层交付）：
  - 时间：倒挂、重叠、缺失时间提示、同一角色并行出现在不相容地点
  - 地点：未定义地点引用、地点规则冲突（禁入/传送限制/地理距离）
  - 角色：年龄/伤势/装备状态矛盾、关系称谓前后不一致、死亡/失忆等状态机冲突
  - 世界观：bible 规则被正文违反（以条款编号定位）
  - POV：POV 规则被破坏（第三限知出现全知信息等，默认 warn）
- 测试：
  - 每条规则独立 fixture
  - 严重级别与 strictMode 行为

**Tool 名（OpenCode）**：`novel_continuity_check`

**Args（建议 Zod）**：
```ts
export type NovelContinuityScope =
  | { kind: "all" }
  | { kind: "chapter"; chapter_id: string }

export type NovelContinuityArgs = {
  rootDir?: string
  manuscriptDir?: string
  outputDir?: string           // default: config.index.outputDir
  scope?: NovelContinuityScope // default: {kind:"all"}
  strictMode?: boolean         // default: config.continuity.strictMode ?? false
  writeReport?: boolean        // default: true
}
```

**Finding / Report 结构（必须固定）**：
```ts
export type ContinuitySeverity = "error" | "warn" | "info"

export type ContinuityFinding = {
  ruleId: string
  severity: ContinuitySeverity
  message: string
  evidence: DiagnosticEvidence[]
  suggestedFix?: string
}

export type NovelContinuityResultJson = {
  version: 1
  reportPath?: string
  stats: { errors: number; warns: number; infos: number; durationMs: number }
  findings: ContinuityFinding[]    // 建议限制最大条数，剩余写入 report
  diagnostics: Diagnostic[]
}
```

**规则清单（第一版必须实现，规则 id 固定）**

时间类：
- `CONT_TIME_REVERSE`（error）：同一章的 `timeline.start > timeline.end`
- `CONT_TIME_PARSE`（warn）：日期/时间格式无法解析（按 `config.naming.dateFormat`）
- `CONT_TIME_OVERLAP_SAME_CHAR`（warn/error）：同一角色在重叠时间段出现在不同章节（仅在 scope=all 且可解析时间时启用）

引用类：
- `CONT_REF_CHARACTER_UNDEFINED`（error/warn）：章节 `characters[]` 引用的角色文件不存在
- `CONT_REF_THREAD_UNDEFINED`（warn）：章节 threads_* 引用的线程文件不存在
- `CONT_REF_LOCATION_UNDEFINED`（warn）：章节 timeline.location 引用的地点文件不存在

线程类：
- `CONT_THREAD_STATUS_MISMATCH`（warn）：thread.status=closed 但 thread.closed_in 为空 / 或 closed_in 指向不存在章节
- `CONT_THREAD_CLOSE_BEFORE_OPEN`（error）：线程 closed_in 的章节早于 opened_in（按 chapterOrder）

POV 类（默认 warn，可关）：
- `CONT_POV_POLICY_VIOLATION`（warn）：章节 pov 与全局 povPolicy 冲突（需要你定义 povPolicy 规则）

世界观条款类（可后置，但规则 id 先占位）：
- `CONT_BIBLE_RULE_VIOLATION`（info/warn）：正文疑似违反 bible 规则（第一版仅做“引用缺失/条款编号不存在”的静态检查，不做语义推断）

**实现算法（必须可测）**：
1) 获取 scan 快照（同 6.2）
2) 计算 chapter 顺序：
   - 默认 `by_id`（与导出/索引一致），后续允许 `by_timeline`
3) 运行规则引擎：
   - 每条规则是纯函数：输入 scan snapshot → 输出 findings[]
   - findings 必须稳定排序（按 `severity`、`ruleId`、`message`、`evidence[0].file`）
4) 写 `CONTINUITY_REPORT.md`（如启用）：
   - `<!-- novel:derived v1; DO NOT EDIT BY HAND -->`
   - `## Summary` + `## Findings`
5) 返回 JSON（含 reportPath 与统计）

### 6.5 `novel_foreshadowing_audit`
职责：伏笔/承诺对账：识别提出点、推进点、回收点，输出未回收清单与回收建议。

- 输入：scan 快照 + threads 配置（requireClosePlan、staleDaysWarn）
- 输出：
  - `THREADS_REPORT.md`（状态总览）
  - `FORESHADOWING_AUDIT.md`（更偏“回收方案/落点建议”）
- 关键实现点：
  - 以显式字段（threads_opened/advanced/closed）为主依据
  - 以文本启发（可选）为辅：识别“承诺语气/悬念语气”作为提醒（info）
  - 临期机制：`expected_close_by` 接近当前进度时提升严重级别
- 测试：
  - opened/advanced/closed 的显式路径
  - stale/临期计算（可注入“当前进度”）

**Tool 名（OpenCode）**：`novel_foreshadowing_audit`

**Args（建议 Zod）**：
```ts
export type NovelForeshadowingArgs = {
  rootDir?: string
  manuscriptDir?: string
  outputDir?: string          // default: config.index.outputDir
  writeReport?: boolean       // default: true
  strictMode?: boolean
}
```

**Result JSON**：
```ts
export type ThreadAuditItem = {
  thread_id: string
  type?: string
  status?: string
  opened_in?: string
  expected_close_by?: string
  closed_in?: string | null
  issues: { severity: "error" | "warn" | "info"; code: string; message: string }[]
  suggestedNextStep?: string
}

export type NovelForeshadowingResultJson = {
  version: 1
  reportPath?: string
  stats: { open: number; in_progress: number; closed: number; abandoned: number; durationMs: number }
  items: ThreadAuditItem[]
  diagnostics: Diagnostic[]
}
```

**实现算法（第一版必须可复现）**：
1) 获取 scan 快照（同 6.2）
2) 线程集合：
   - 以 `threads/*.md` 为主表（thread_id 唯一）
   - 章节 frontmatter 的 `threads_opened/advanced/closed` 用于交叉校验与补全统计
3) 生成问题清单：
   - open 但无 `close_plan` → warn/error（按 config.threads.requireClosePlan）
   - status=closed 但 `closed_in` 为空 → warn
   - `expected_close_by` 指向不存在章节 → warn
4) 写 `FORESHADOWING_AUDIT.md`：
   - `# FORESHADOWING AUDIT`
   - `## Summary`
   - `## Threads`（表：thread_id/status/opened_in/expected_close_by/closed_in/issues）
5) 返回 JSON（items 按 thread_id 排序）

### 6.6 `novel_style_check`（可做成 tool，也可完全由 skill 驱动）
职责：风格一致性检查（口吻、禁用词、句式偏差、叙事时态漂移），输出可定位的偏差条目。

- 输入：styleGuide + 角色 voice 卡 + 目标章节/全书范围
- 输出：`STYLE_REPORT.md`（不直接改稿）
- 关键实现点：词表规则 + 简单统计（重复短语、口吻词频）

**Tool 名（OpenCode）**：`novel_style_check`

**Args（建议 Zod）**：
```ts
export type NovelStyleScope =
  | { kind: "all" }
  | { kind: "chapter"; chapter_id: string }
  | { kind: "character"; id: string }

export type NovelStyleArgs = {
  rootDir?: string
  manuscriptDir?: string
  outputDir?: string
  scope?: NovelStyleScope
  writeReport?: boolean
}
```

**Result JSON**：
```ts
export type StyleFinding = {
  severity: "warn" | "info"
  code: string
  message: string
  evidence: DiagnosticEvidence[]
  suggestedFix?: string
}

export type NovelStyleResultJson = {
  version: 1
  reportPath?: string
  stats: { warns: number; infos: number; durationMs: number }
  findings: StyleFinding[]
  diagnostics: Diagnostic[]
}
```

**实现算法（第一版写死为规则 + 统计，不做复杂 NLP）**：
1) 获取 scan 快照（同 6.2）
2) 读取 `config.styleGuide.lexicon.preferred/avoid` 与 `characters/*.md` 的 voice 词表
3) 对正文做简单规则：
   - 禁用词命中（avoid）→ warn
   - 角色口癖缺失/过量（统计阈值）→ info
4) 写 `STYLE_REPORT.md`（可选），返回 JSON

### 6.7 `novel_bible`
职责：世界观/设定管理：整理条款、名词表、引用锚点，提供可引用摘要与一致性校验输入。

- 输入：bible 文件集合
- 输出：`BIBLE_SUMMARY.md`、`GLOSSARY.md`（派生或校验输出）
- 关键实现点：名词表去重、规则条款编号、引用锚点生成

**Tool 名（OpenCode）**：`novel_bible`

**Args（建议 Zod）**：
```ts
export type NovelBibleArgs = {
  rootDir?: string
  manuscriptDir?: string
  outputDir?: string          // default: config.index.outputDir
  writeDerivedFiles?: boolean // default: true
}
```

**Result JSON**：
```ts
export type BibleRule = { id: string; text: string; sourceFile: string; line?: number }
export type GlossaryTerm = { term: string; definition?: string; sourceFile: string }

export type NovelBibleResultJson = {
  version: 1
  summaryPath?: string
  glossaryPath?: string
  rules: BibleRule[]
  glossary: GlossaryTerm[]
  diagnostics: Diagnostic[]
}
```

**实现算法（第一版仅做结构化整理，不做语义推断）**：
1) 读取 `manuscript/bible/*.md`（固定：`world.md`、`rules.md`、`glossary.md` 若存在）
2) 解析条款：
   - 识别形如 `R-001：...` 的行作为 rule
   - 若缺少编号但存在列表项：生成临时编号 `R-AUTO-<n>`（warn）
3) 解析名词表：
   - 识别 `- 词条：解释` 或 `**词条**：解释`
   - 去重策略：同词条取最先出现定义，其余记 warn
4) 写入 `.opencode/novel/BIBLE_SUMMARY.md` 与 `.opencode/novel/GLOSSARY.md`（如启用）
5) 返回 JSON（rules/glossary 按 id/term 排序）

### 6.8 `novel_export`
职责：导出编译：按章节顺序合并为单文件（md/html），并可扩展到 epub/docx。

- 输入：chapterOrder、includeFrontmatter、输出格式、元信息（书名/作者/卷信息）
- 输出：`export/<title>.md|html|epub|docx`
- 关键实现点：
  - 章节顺序：by_id / by_timeline / custom list
  - 章节合并：保留标题层级、处理脚注/引用、可选移除 frontmatter
  - HTML：最小模板 + CSS（可选）
  - EPUB/DOCX：后置（可依赖 pandoc 或纯 JS 方案，择一）

**Tool 名（OpenCode）**：`novel_export`

**Args（建议 Zod）**：
```ts
export type NovelExportFormat = "md" | "html" | "epub" | "docx"
export type NovelChapterOrder = "by_id" | "by_timeline" | "custom"

export type NovelExportArgs = {
  rootDir?: string
  manuscriptDir?: string
  format: NovelExportFormat
  outputDir?: string            // default: config.export.outputDir ?? "export"
  title?: string                // default: read from config or infer from folder name
  chapterOrder?: NovelChapterOrder
  customOrder?: string[]        // when chapterOrder="custom"
  includeFrontmatter?: boolean  // default: config.export.includeFrontmatter ?? false
  writeFile?: boolean           // default: true
}
```

**Result JSON**：
```ts
export type NovelExportResultJson = {
  version: 1
  format: NovelExportFormat
  outputPath?: string
  chapters: { chapter_id: string; title?: string; path: string }[]
  stats: { chapters: number; durationMs: number }
  diagnostics: Diagnostic[]
}
```

**实现算法（必须可复现）**：
1) 获取 scan 快照（同 6.2）
2) 计算章节顺序：
   - `by_id`：按 `chapter_id` 排序
   - `by_timeline`：按（date,start,chapter_id）排序，无法解析的排后
   - `custom`：按 `customOrder`，缺失的章 append 到末尾（warn）
3) 读取每章正文：
   - `includeFrontmatter=false`：剥离 YAML frontmatter
   - 标题层级规范：每章至少一个 `# <title>`（若正文无标题则补）
4) 写出：
   - MD：章节间用 `\n\n---\n\n` 分隔（写死）
   - HTML：用最小模板包裹（`<article>`），并插入基础 CSS
5) 返回 JSON（outputPath 相对 rootDir）

### 6.9 `novel_import`（从已有小说目录逆向生成骨架）
职责：把“已有小说目录”**不改原文**地导入为本插件的标准事实源结构：生成 `manuscript/`（章节文件必带 frontmatter），并产出导入映射与报告（可复现、可回滚）。

**硬约束（实现时写死）**
- 不允许修改 `fromDir` 下任何文件（只读）。
- 默认输出到 `rootDir/manuscript/`（你已确认默认使用 `manuscript/`）。
- 默认对一个源文件中多个章节标题：**按标题拆分**，每章一个 `manuscript/chapters/<chapter_id>.md`。

**Tool 名（OpenCode）**：`novel_import`

**Args（建议 Zod）**：
```ts
export type NovelImportMode = "copy" | "analyze"

export type NovelImportArgs = {
  rootDir?: string                 // default: ctx.directory
  fromDir?: string                 // default: ctx.directory
  mode?: NovelImportMode           // default: config.import.defaultMode ("copy")
  manuscriptDir?: string           // default: config.manuscriptDir ("manuscript")
  includeGlobs?: string[]          // default: config.import.includeGlobs
  excludeGlobs?: string[]          // default: config.import.excludeGlobs + ["manuscript/**", ".opencode/**"]
  writeConfigJsonc?: boolean       // default: true（如 .opencode/novel.jsonc 不存在则生成最小配置）
  writeReport?: boolean            // default: true
}
```

**Result JSON（必须固定字段名）**：
```ts
export type ImportMapItem = {
  chapter_id: string
  title?: string
  source_path: string              // 相对 rootDir
  source_type: "md" | "txt"
  source_heading_line: number      // 1-based
  source_range: { startLine: number; endLine: number }
  output_path: string              // 相对 rootDir
  warnings?: string[]
}

export type NovelImportResultJson = {
  version: 1
  mode: NovelImportMode
  fromDir: string
  manuscriptDir: string
  writtenChapters: string[]        // 相对 rootDir
  conflicts: { chapter_id: string; existing: string; written: string }[]
  unclassified: { source_path: string; reason: string }[]
  reportPath?: string              // `.opencode/novel/IMPORT_REPORT.md`
  importMapPath?: string           // `.opencode/novel/cache/import-map.json`
  diagnostics: Diagnostic[]
}
```

**章节识别（标题启发：你已选择）**
- 中文强匹配（默认启用）：
  - `^\\s*#*\\s*第([0-9一二三四五六七八九十百千万两〇零]+)\\s*章(.*)$`（i）
- 英文强匹配（默认启用）：
  - `^\\s*#*\\s*Chapter\\s+(\\d+)\\s*[:：-]?\\s*(.*)$`（i）
- 松匹配（仅在同一文件已命中过强匹配后才允许，用于“第X章”后的小标题）：
  - `^\\s*#\\s+(.+)$`（可选）

**`chapter_id` 生成规则（从标题提取：你已选择）**
- 若可解析出章节编号 `n`：
  - `chapter_id = "ch" + n.padStart(4, "0")`（例：第12章 → `ch0012`）
- 若无法解析编号（序章/尾声/番外等）：
  - `chapter_id = "sp-" + slug(title).slice(0, 32)`（slug 规则：去空白与标点，保留中英文与数字；为空则用 hash8）
- 冲突处理（合并写入策略）：
  - 若 `manuscript/chapters/<chapter_id>.md` 已存在：写入 `manuscript/chapters/<chapter_id>.import-<hash8>.md`，并记录到 `conflicts[]`

**实现算法（必须按此执行，保证可复现）**
1) 确定 `rootDir` 与 `fromDir`：
   - 默认均为 `ctx.directory`（OpenCode 打开的目录）
2) 枚举源文件：
   - include：默认 `**/*.md`、`**/*.txt`
   - exclude：默认排除 `.git/**`、`.opencode/**`、`manuscript/**`、`node_modules/**`、`dist/**` 等
3) 对每个源文件读取全文（UTF-8；失败记 diagnostic）：
   - 按行扫描，找章节标题命中点（line number）
   - 0 命中：加入 `unclassified[]`（不生成 chapter 文件）
   - >=1 命中：按标题位置切分为多个章节片段
4) 对每个章节片段生成输出：
   - 生成 `chapter_id`（规则见上）
   - 生成 `title`（从标题行提取；为空则用原标题行）
   - 生成章节文件内容（Markdown）：
     - 写 YAML frontmatter（chapter_id/title/source/imported_at）
     - 第一行标题统一为 `# <title>`（写死）
     - 正文保留原文（去掉章节标题行本身；txt 直接按行写入）
5) 写入（仅在 `mode=copy`）：
   - 先确保骨架存在（建议内部复用 `novel_scaffold` 的实现）：创建 `manuscript/` 及其标准子目录（`bible/characters/factions/locations/threads/chapters`），并补齐缺失模板（不覆盖既有文件）
   - 创建 `manuscript/chapters/`（如不存在；上一步通常已完成）
   - 写入章节文件（不覆盖既有文件；冲突走 `.import-<hash8>.md`）
6) 生成导入映射与报告（无论 analyze/copy 都生成）：
   - `.opencode/novel/cache/import-map.json`：写入 `ImportMapItem[]`（按 chapter_id 排序）
   - `.opencode/novel/IMPORT_REPORT.md`：写入统计、冲突、未识别文件、下一步建议（固定标题）
7)（可选）生成最小配置：
   - 若 `.opencode/novel.jsonc` 不存在且 `writeConfigJsonc=true`：写入最小配置（manuscriptDir/index/import/compat）
8) 返回 JSON

**IMPORT_REPORT.md 固定结构（必须一致，便于用户与 LLM 读取）**
- `# IMPORT REPORT`
- `## Summary`（文件数、导入章节数、冲突数、未识别数）
- `## Imported Chapters`（表：chapter_id/title/source/output）
- `## Conflicts`（表：chapter_id/existing/written）
- `## Unclassified`（列表：source_path + reason）
- `## Next Steps`（建议：运行 `/novel-index`、补齐角色卡/线程卡等）

### 6.10 `novel_scaffold`（生成/修复小说工程骨架）
职责：以**确定性**方式创建/修复 `manuscript/` 标准目录结构与模板文件（不依赖 LLM），并准备 `.opencode/novel/` 派生目录；用于 `/novel-init`、`novel_import` 以及“把已有工程对齐到本插件结构”的场景。

**Tool 名（OpenCode）**：`novel_scaffold`

**Args（建议 Zod）**：
```ts
export type NovelScaffoldArgs = {
  rootDir?: string              // default: ctx.directory
  manuscriptDir?: string        // default: config.manuscriptDir ("manuscript")
  bookTitle?: string            // default: ""（可空；用于写入 bible/frontmatter）
  writeConfigJsonc?: boolean    // default: true（若 .opencode/novel.jsonc 不存在则生成最小配置）
  writeTemplates?: boolean      // default: true（写入缺失模板；不覆盖）
  forceOverwriteTemplates?: boolean // default: false（谨慎：仅对模板文件允许覆盖）
}
```

**Result JSON（必须固定字段名）**：
```ts
export type NovelScaffoldResultJson = {
  version: 1
  manuscriptDir: string
  createdDirs: string[]         // 相对 rootDir
  writtenFiles: string[]        // 相对 rootDir
  skippedExisting: string[]     // 相对 rootDir
  configPath?: string           // `.opencode/novel.jsonc`（如写入）
  diagnostics: Diagnostic[]
}
```

**实现算法（必须可复现）**：
1) 计算 `rootDir = args.rootDir ?? ctx.directory`
2) 计算 `manuscriptDir = join(rootDir, args.manuscriptDir ?? "manuscript")`
3) 创建标准目录（存在则跳过，写入 `skippedExisting`）：
   - `manuscript/bible`
   - `manuscript/chapters`
   - `manuscript/characters`
   - `manuscript/factions`
   - `manuscript/locations`
   - `manuscript/threads`
   - `manuscript/snapshots`（可选；默认创建）
4) 创建派生目录：
   - `.opencode/novel`
   - `.opencode/novel/cache`
   - `.opencode/novel/CONTEXT_PACKS`
   - `.opencode/novel/GRAPH`
5) 写入模板文件（仅在缺失时写入；除非 `forceOverwriteTemplates=true`）：
   - `manuscript/bible/world.md`
   - `manuscript/bible/rules.md`
   - `manuscript/bible/glossary.md`
   - `manuscript/characters/README.md`（可选：字段说明）
   - `manuscript/threads/README.md`（可选）
6) 写入最小配置（如启用）：
   - 若 `.opencode/novel.jsonc` 不存在：写入最小可运行配置（manuscriptDir/index/import/compat/agents_enabled）
7) 返回 JSON（路径一律相对 rootDir，分隔符用 `/`）

### 6.11 `novel_entity_gaps`（实体缺口盘点 + 可选补 stub）
职责：基于 `novel_scan` 的结构化快照，找出“被引用但未定义”的实体（角色/势力/地点/线程），以及“定义了但从未被引用”的孤儿实体；输出可读报告，并可选自动补齐 stub 文件（不碰正文）。

**Tool 名（OpenCode）**：`novel_entity_gaps`

**Args（建议 Zod）**：
```ts
export type NovelEntityKind = "characters" | "threads" | "factions" | "locations"

export type NovelEntityGapsArgs = {
  rootDir?: string
  manuscriptDir?: string
  outputDir?: string            // default: config.index.outputDir
  writeReport?: boolean         // default: true
  createStubs?: boolean         // default: false（true 时会在 manuscript/* 写入缺失实体 stub）
  stubPolicy?: "skip" | "write" // default: "write"（createStubs=true 时生效）
}
```

**Result JSON（必须固定字段名）**：
```ts
export type MissingEntityRef = {
  kind: NovelEntityKind
  id: string
  referencedBy: { chapter_id: string; path: string }[]
  suggestedPath: string         // 相对 rootDir，例如 `manuscript/characters/<id>.md`
}

export type OrphanEntity = {
  kind: NovelEntityKind
  id: string
  path: string
}

export type NovelEntityGapsResultJson = {
  version: 1
  reportPath?: string
  missing: MissingEntityRef[]
  orphans: OrphanEntity[]
  createdStubs: string[]        // 相对 rootDir
  diagnostics: Diagnostic[]
}
```

**实现算法（必须确定性）**：
1) 获取 scan 快照（复用 `loadOrScan({ mode: "incremental" })`）
2) 构建已定义实体集合：
   - `defined.characters = Set(char.id)`（来自 `manuscript/characters/*.md`）
   - `defined.threads = Set(thread.thread_id)` …
3) 构建被引用实体集合（来自 `chapters/*.md` frontmatter）：
   - `referenced.characters = union(chapters[*].characters)`
   - `referenced.threads = union(opened/advanced/closed)` …
4) 缺口判定：
   - `referenced - defined` → `missing[]`（附带引用来源章节）
   - `defined - referenced` → `orphans[]`
5) 写报告（如启用）：
   - 写入 `${outputDir}/ENTITY_GAPS.md`
   - 文件头 `<!-- novel:derived v1; DO NOT EDIT BY HAND -->`
6) 自动补 stub（仅在 `createStubs=true` 且 `stubPolicy=write`）：
   - 对每个 missing 生成最小实体文件（不覆盖既有文件；冲突按 `.import-<hash8>` 策略落盘）
   - stub 内容固定：最小 frontmatter + `# <id>` + `## TODO` 段落
7) 写入缓存（可选但推荐）：`.opencode/novel/cache/entity-gaps.json`

### 6.12 `novel_graph`（从事实源生成 Mermaid 图）
职责：把“事实源的关系字段”转换为 Mermaid 图（人物关系/势力关系/共现网络），输出到 `.opencode/novel/GRAPH/`，供 LLM 与人查看。

**Tool 名（OpenCode）**：`novel_graph`

**Args（建议 Zod）**：
```ts
export type NovelGraphKind = "relationships" | "factions"

export type NovelGraphArgs = {
  rootDir?: string
  manuscriptDir?: string
  outputDir?: string            // default: config.index.outputDir
  kind: NovelGraphKind
  writeFile?: boolean           // default: true
  preferExplicitRelations?: boolean // default: true（优先使用 metadata.relationships；否则回退共现图）
  cooccurrenceMinWeight?: number    // default: 2（共现边权阈值）
}
```

**Result JSON（必须固定字段名）**：
```ts
export type NovelGraphResultJson = {
  version: 1
  kind: NovelGraphKind
  graphPath?: string
  stats: { nodes: number; edges: number }
  diagnostics: Diagnostic[]
}
```

**实现算法（必须确定性）**：
1) 获取 scan 快照（同上）
2) `relationships` 图：
   - 若 `preferExplicitRelations=true` 且存在 `characters[*].relationships`：按显式关系生成 `graph TD`（节点=角色 id，边=type）
   - 否则回退共现图：遍历每章 `chapter.characters`，对每对角色 `(a,b)` 计数；计数>=阈值才生成边（边权写在 label）
3) `factions` 图：
   - 优先读取 `factions[*].relationships`
   - 若缺失：仅输出节点（无边）并在 diagnostics 提示“缺少 relationships 字段”
4) 写文件（如启用）：`${outputDir}/GRAPH/<KIND>.mmd`（固定命名：`RELATIONSHIPS.mmd`/`FACTIONS.mmd`）

### 6.13 `novel_character_report`（人物曲线/出场与参与度汇总）
职责：把“章节引用 + 角色卡 metadata”聚合成一个可读的 `CHARACTER_REPORT.md`：出场次数、首次/末次出场、涉及线程、弧光（若角色卡提供 arc/arc_beats），以及缺失字段提醒。

**Tool 名（OpenCode）**：`novel_character_report`

**Args（建议 Zod）**：
```ts
export type NovelCharacterReportArgs = {
  rootDir?: string
  manuscriptDir?: string
  outputDir?: string            // default: config.index.outputDir
  writeReport?: boolean         // default: true
}
```

**Result JSON（必须固定字段名）**：
```ts
export type CharacterReportItem = {
  id: string
  path: string
  appearances: number
  first_seen?: string           // chapter_id
  last_seen?: string            // chapter_id
  threads_involved: string[]    // thread_id
  arc_summary?: string          // 从角色卡 arc/arc_beats 拼接（无则空）
  missingFields?: string[]
}

export type NovelCharacterReportResultJson = {
  version: 1
  reportPath?: string
  characters: CharacterReportItem[]
  diagnostics: Diagnostic[]
}
```

**实现算法（必须确定性）**：
1) 获取 scan 快照
2) 对每个角色：
   - `appearances`：统计在 `chapters[*].characters` 的引用次数
   - `first_seen/last_seen`：按章节顺序（by_id）推断
   - `threads_involved`：该角色出现章节的 opened/advanced/closed 线程并集
   - `arc_summary`：从 `characters/<id>.md` 的 `arc/arc_beats` 字段拼接（无则空）
3) 写报告（如启用）：`${outputDir}/CHARACTER_REPORT.md`

### 6.14 `novel_apply_candidates`（把 LLM 产出的 candidates 安全落盘）
职责：将 `.opencode/novel/cache/candidates.json`（由 `/novel-extract-entities` 产出）以**确定性**方式应用到 `manuscript/`：只允许（1）创建缺失实体文件，（2）更新章节/实体的 YAML frontmatter；**绝不修改正文**；并生成可审计的 APPLY_REPORT。

> 目的：让“抽取/建议（LLM）”与“落盘/约束（tool）”解耦，保证结果可复现、可回滚、可 review。

**Tool 名（OpenCode）**：`novel_apply_candidates`

**Candidates JSON（固定结构）**：
```ts
export type NovelCandidatesV1 = {
  version: 1
  generatedAt: string
  scope: { kind: "all" } | { kind: "chapter"; chapter_id: string }
  notes?: string
  ops: CandidateOp[]
}

export type CandidateOp =
  | { op: "ensure_entity"; kind: "character"|"faction"|"location"|"thread"; id: string; name?: string; filePath?: string }
  | { op: "patch_frontmatter"; filePath: string; patch: Record<string, unknown>; mode?: "merge"|"replace" }
```

**Args（建议 Zod）**：
```ts
export type NovelApplyCandidatesArgs = {
  rootDir?: string
  candidatesPath?: string        // default: `.opencode/novel/cache/candidates.json`
  dryRun?: boolean               // default: true（默认只生成报告，不落盘）
  writeReport?: boolean          // default: true
}
```

**Result JSON（必须固定字段名）**：
```ts
export type NovelApplyCandidatesResultJson = {
  version: 1
  dryRun: boolean
  appliedOps: number
  writtenFiles: string[]         // 相对 rootDir
  skippedOps: { index: number; reason: string }[]
  reportPath?: string
  diagnostics: Diagnostic[]
}
```

**实现算法（必须确定性）**：
1) 读取并校验 candidates（version=1；不合法直接 diagnostic error 并停止）
2) 对 `ops[]` 逐条执行：
   - `ensure_entity`：
     - 目标路径默认：`manuscript/<kindPlural>/<id>.md`（kindPlural 映射固定）
     - 若文件已存在：skip（info）
     - 若 `dryRun=false`：写入最小模板（固定 frontmatter：`id/name` 或 `thread_id/type/status`）
   - `patch_frontmatter`：
     - 仅允许目标文件位于 `manuscript/**`（否则 error）
     - 解析 YAML frontmatter；`mode=merge`：深合并对象、数组默认替换；`mode=replace`：直接替换指定 key
     - **不允许**修改正文：frontmatter 下方内容原样保留
3) 写入报告（如启用）：`${config.index.outputDir}/APPLY_REPORT.md`（或 `.opencode/novel/APPLY_REPORT.md`）
4) 返回 JSON（包含 skipped 原因与 writtenFiles 列表）

---

## 7. Built-in Skills（专家能力库）完备设计

目标：Skills 不是“随便一段提示词”，而是 **稳定输出协议**。每个 skill 必须明确：输入要求、输出结构、缺信息时的追问策略。

### 7.1 技能清单（建议全量）
- `novel-oracle`：主线/冲突/主题/承诺兑现诊断；给结构性改造建议
- `novel-entity-extractor`：从正文/摘要/章节计划中抽取实体候选（人/地/势/线程）与建议 metadata（输出机器可用 JSON）
- `novel-character-expert`：人物画像、动机、弧光、关系、台词一致性
- `novel-faction-relations`：势力结构、利益链条、冲突格局（输出 Mermaid 图）
- `novel-worldbible-keeper`：设定条款整理、名词表、规则一致性建议
- `novel-timeline-keeper`：时间线梳理、事件排序、时间矛盾修复建议
- `novel-continuity-sentinel`：以规则报告为输入，给“最小改动修复路径”
- `novel-foreshadowing-unresolved`：伏笔/承诺回收方案（按章节落点）
- `novel-flaw-finder`：节奏/逻辑/视角/信息分配问题清单（含优先级）
- `novel-continuation-expert`：续写/补场景/转场（可给多分支）
- `novel-polish-expert`：润色（保守/重写两档）
- `novel-summary-expert`：章节回顾/梗概/无剧透文案/编辑向梗概

### 7.2 输出协议（统一骨架）
所有技能统一输出以下段落，便于命令复用与后处理：
1) `## Assumptions`：关键假设与风险
2) `## Findings`：结构化条目（问题/亮点/风险）
3) `## Recommendations`：可执行步骤（P0/P1/P2）
4) `## Questions`：最多 3 个追问（只问决定性问题）
5) `## Files To Update`：建议更新的文件与字段（如需落盘）

### 7.3 关键技能的“机器输出”要求（必须落地）

#### 7.3.1 `novel-entity-extractor` 输出 `candidates.json`
目标：把“从正文识别出的候选实体与 metadata 建议”输出为 `NovelCandidatesV1`（见 6.14），由 `novel_apply_candidates` 决定是否落盘。

要求（写死）：
- 必须包含 `## Result (JSON)` 代码块，且内容可被 JSON.parse
- JSON 顶层必须是 `NovelCandidatesV1`：
  - `ops[]` 仅允许使用：`ensure_entity`、`patch_frontmatter`
- `patch_frontmatter` 仅允许 patch 以下字段（默认 merge）：
  - Chapter：`characters`/`factions`/`locations`/`threads_opened`/`threads_advanced`/`threads_closed`/`summary`/`timeline`
  - Character/Faction/Location/Thread：允许补充 `name/alias/relationships/...`，但不得写入大段正文（正文由作者写或由单独命令生成）
- 命名：新增实体 id 必须遵循 5.1.1 的前缀规则；不确定时可用 hash 回退并在 `notes` 说明
- 不确定性处理：不要瞎填事实；用 `Questions` 追问关键缺失，或把条目标记为 “needs_confirmation” 并避免落盘（通过 `dryRun`）

---

## 8. Built-in Commands（固定流程）完备设计

Commands 是“工作流”，必须产出明确文件或报告，并尽量由 tools 生成/校验，skills 负责建议与文本生成。

### 8.1 命令总表（建议全量）
初始化与工程：
- `/novel-init <title>`：创建 manuscript 目录、模板、默认配置、派生目录（建议内部调用 `novel_scaffold`）
- `/novel-import [--from=<path>] [--mode=analyze|copy] [--layout=auto|standard|custom]`：从已有小说目录逆向生成/对齐本插件骨架与配置（默认不改原文，落盘到 `manuscript/`）
- `/novel-bootstrap [--from=<path>]`：一键迁移：scaffold → import → index → entity gaps → graph → character report（默认全程不碰原文）
- `/novel-style-guide`：生成/更新全局写作约束（styleGuide）
- `/novel-bible`：生成/更新 bible（世界观/名词表/规则条款）
- `/novel-index`：运行索引生成（INDEX/TIMELINE/THREADS_REPORT）
- `/novel-entities-audit [--stubs]`：实体缺口盘点（可选补 stub），写入 `ENTITY_GAPS.md`（调用 `novel_entity_gaps`）
- `/novel-graph <relationships|factions>`：输出 Mermaid 图（调用 `novel_graph`）
- `/novel-character-report`：输出人物曲线/出场统计（调用 `novel_character_report`）

规划与设计：
- `/novel-outline [--acts=3]`：大纲（三幕/节拍/冲突升级表）
- `/novel-character <id>`：生成角色卡（含关系建议）
- `/novel-faction <id>`：生成势力卡（可输出关系图）
- `/novel-thread <thread_id>`：创建伏笔线程卡（提出点/回收计划）
- `/novel-chapter-plan <chapter_id>`：章节计划（场景列表、信息分配、伏笔推进点）
- `/novel-extract-entities [--scope=all|chapter:<id>]`：从正文/摘要抽取实体候选（人/地/势/线程）与建议 metadata（使用 `novel-entity-extractor` skill；输出 candidates 到 `.opencode/novel/cache/candidates.json`，默认不直接写回）
- `/novel-apply-candidates`：将 candidates（JSON）应用到 `manuscript/`（仅改 frontmatter/新建实体文件；不改正文；需要显式确认）

写作与改稿：
- `/novel-chapter-draft <chapter_id>`：基于章节计划生成草稿（分场景、POV、timeline）
- `/novel-continuation <chapter_id>`：续写下一段/下一章（使用 context pack）
- `/novel-rewrite <chapter_id> [--goal=...]`：按目标重写（不破坏设定/人设）
- `/novel-polish <chapter_id> [--mode=conservative|rewrite]`：润色输出（默认写入新文件，不覆盖原章；覆盖写入需显式 `--apply`）
- `/novel-summary <chapter_id>`：生成摘要/回顾（写入 frontmatter 或独立文件）

审稿与巡检：
- `/novel-chapter-review <chapter_id>`：审稿问题清单 + 修改方案（引用定位）
- `/novel-continuity-check [--scope=all|chapter:<id>]`：一致性报告
- `/novel-foreshadowing-audit`：伏笔对账报告 + 回收方案
- `/novel-style-check [--scope=chapter:<id>|all]`：风格一致性报告

发布与导出：
- `/novel-export <md|html|epub|docx>`：导出编译
- `/novel-snapshot <tag>`：冻结阶段（汇总关键文件到 snapshots）

### 8.2 命令实现规范（对齐 oh-my-opencode）
- 每个命令一个模板：`src/features/builtin-commands/templates/*.ts`
- `commands.ts` 注册：提供 `description`、`argumentHint`、可选 `agent`
- 命令模板必须明确：
  - 需要读取哪些文件
  - 需要调用哪些 tools
  - 需要写入哪些文件（默认不覆盖用户原文）

### 8.3 关键命令模板的“可执行细节”（必须写进模板）
> 这里不是写 prompt 文案本身，而是写“模板要指导模型做什么、按什么顺序调用工具、最终落哪些文件”。确保用户在 OpenCode 里跑起来是确定的。

#### 8.3.1 `/novel-init <title>`
- 目标：从 0 创建一个可用工程（事实源 + 派生目录 + 最小配置）
- 推荐 agent：`novel-sentinel`（安全、偏流程）
- 模板步骤（写死）：
  1) 调用 `novel_scaffold`：`{ bookTitle: <title>, writeConfigJsonc: true, writeTemplates: true }`
  2) 输出“下一步建议”：运行 `/novel-index`、创建第 1 章 `/novel-chapter-plan ch0001`

#### 8.3.2 `/novel-import [--from] [--mode=analyze|copy]`
- 目标：不改原文，把已有目录导入为 `manuscript/` 标准结构
- 推荐 agent：`novel-sentinel`
- 模板步骤：
  1) 调用 `novel_import`（默认 `mode=copy`、`fromDir=ctx.directory`）
  2) 如果 diagnostics 有 error：先提示用户修复/或改用 analyze
  3) 成功后提示：运行 `/novel-index`、再跑 `/novel-entities-audit --stubs`

#### 8.3.3 `/novel-bootstrap [--from]`
- 目标：一条命令把“已有目录”变成“可用工程”：骨架 → 导入 → 索引 → 缺口 → 图 → 人物曲线（全程不改原文）
- 推荐 agent：`novel-sentinel`
- 模板步骤：
  1) `novel_scaffold`（确保目录/模板存在）
  2) `novel_import`（copy 或 analyze；默认 copy）
  3) `novel_index`
  4) `novel_entity_gaps`（默认只报告；若用户带 `--stubs` 则 `createStubs=true`）
  5) `novel_graph`：`relationships`
  6) `novel_graph`：`factions`
  7) `novel_character_report`
  8) 输出“下一步”：`/novel-extract-entities`（LLM 抽取更丰富 metadata）→ `/novel-apply-candidates`（落盘）

#### 8.3.4 `/novel-extract-entities [--scope]`
- 目标：用 LLM 从“正文/摘要/索引”中提出 candidates（不直接写回事实源）
- 推荐 agent：`novel-entity-extractor`（若启用 full preset；否则用当前 agent + 调用同名 skill）
- 模板步骤：
  1) 调用 `novel_context_pack`（scope=chapter 时优先围绕该章；scope=all 时按章节批处理，避免超上下文）
  2) 调用 `skill`：`novel-entity-extractor`（必须输出 `NovelCandidatesV1`）
  3) 将 JSON 写入 `.opencode/novel/cache/candidates.json`（覆盖写；并在文件头标注生成时间/范围）
  4) 输出提醒：下一步运行 `/novel-apply-candidates`（默认 dryRun）

#### 8.3.5 `/novel-apply-candidates`
- 目标：把 candidates 以受控方式应用到 `manuscript/`（仅 frontmatter / 新建实体文件；不改正文）
- 推荐 agent：`novel-sentinel`
- 模板步骤：
  1) 调用 `novel_apply_candidates`（默认 `dryRun=true`）
  2) 展示 APPLY_REPORT 摘要，并问用户是否执行 `dryRun=false`
  3) 用户确认后再次调用 `novel_apply_candidates { dryRun:false }`
  4) 最后建议运行 `/novel-index` 与 `/novel-continuity-check` 复核

#### 8.3.6 `/novel-bible` / `/novel-character <id>` / `/novel-faction <id>`（生成事实源卡片）
- 原则：这些命令都应当**写入事实源目录**（`manuscript/.../*.md`），但不改章节正文。
- 推荐流程（模板共通）：
  1) 调用 `novel_context_pack`（根据目标实体收集相关章节/线索）
  2) 调用对应 `skill` 生成“卡片正文 + 可选 frontmatter patch”（JSON 可选）
  3) 写入/更新对应文件：
     - `manuscript/bible/*`、`manuscript/characters/<id>.md`、`manuscript/factions/<id>.md`
  4) 建议运行 `/novel-index` 更新派生索引

---

## 9. Background Tasks（后台任务）完备方案（可选但推荐）

目的：把“全书巡检/索引重建/深度审稿”等长任务放后台并流式汇报，不阻塞主对话。

### 9.1 任务类型
- `index_watch`：检测 manuscript 变更后增量更新 INDEX/TIMELINE
- `nightly_continuity`：定期跑全量一致性检查，生成报告
- `threads_staleness`：检查临期未回收线程，生成提醒清单
- `style_drift`：检测主角口吻漂移趋势（统计式）

### 9.2 状态持久化
- 任务 registry：`.opencode/background-tasks.json`（或 `.opencode/novel/background-tasks.json`）
- 记录字段：id、sessionID、description、status、startedAt、completedAt、progress、lastOutput

### 9.3 并发策略
- 任务粒度：建议“1 本书 = 1 任务”或“1 章节 = 1 任务”（按耗时选择）
- 资源控制：并发上限 + 取消机制 + 超时

---

## 10. Agents 与 Hooks（Agents 必做：导出到 OpenCode）

### 10.1 Agents（固定角色，默认导出名带前缀）
默认导出到 OpenCode 的 agent 名称（可通过 `agent_name_prefix` 改前缀；默认 `agents_preset="core"`）：
- `novel-muse`：发散创意（桥段/冲突升级/场景库）
- `novel-editor`：严格审稿（指出问题 + 具体改法）
- `novel-sentinel`：一致性守卫（基于报告给最小修复路径）

当 `agents_preset="full"` 时，额外导出“专家 agent”（与 builtin skills 同名/同职责，便于直接在 OpenCode 里切换角色）：
- `novel-oracle`
- `novel-entity-extractor`
- `novel-character-expert`
- `novel-faction-relations`
- `novel-worldbible-keeper`
- `novel-timeline-keeper`
- `novel-continuity-sentinel`
- `novel-foreshadowing-unresolved`
- `novel-flaw-finder`
- `novel-continuation-expert`
- `novel-polish-expert`
- `novel-summary-expert`

说明：Skills 依然用于“专家能力模板库”，但 Agents 是 OpenCode 的一等公民：导出后可在 OpenCode 中直接选用/切换（像 oh-my-opencode 的 sisyphus/oracle/librarian 一样）。

### 10.2 Agent 实现规范（对齐 oh-my-opencode）
- 每个 agent 一个工厂：`createNovelMuseAgent(model: string): AgentConfig`（返回 `@opencode-ai/sdk` 的 AgentConfig）
- 统一支持 overrides：模型/温度/工具开关/permission/prompt_append（来自 `novel.jsonc`）
- 统一的“工具限制”策略（推荐）：
  - `novel-muse`：默认不写文件（更多是产出大纲/桥段/方案）；需要写入时由 `/novel-*` 命令调用 tools 完成
  - `novel-editor`：默认输出审稿建议与可执行修改清单；不直接改原文（写入 rewrite/polish 文件由命令驱动）
  - `novel-sentinel`：默认读 + 生成报告；不直接改原文

### 10.3 Agent 导出/注册机制（核心：让 OpenCode “看见”这些 agents）
必须实现插件的 `config` handler（参考 oh-my-opencode 的 `config: configHandler`）：
- 输入：OpenCode 当前 config（包含 `config.agent`）
- 处理：
  1) 计算最终 agent 名：`${agent_name_prefix}${baseName}`（默认 `novel-muse`/`novel-editor`/`novel-sentinel`）
  2) 生成内置 agent configs（工厂 + 默认模型策略）并应用 overrides/disabled_agents
  3) 合并注入到 `config.agent`：
     - 若 key 不存在：直接添加
     - 若 key 已存在：默认不覆盖（写日志 + 在报告提示冲突），除非你增加 `agents_force_override`（可选）
  4) **绝不修改**用户的默认 agent（除非你显式设计 `default_agent` 行为；本插件默认不改）
- 输出：修改后的 `config.agent`（OpenCode 重启/刷新后即可在 UI/命令中选择这些 agents）

### 10.4 Hooks（轻量）
- `auto-slash-command`：用户自然语言 → 建议使用某个 `/novel-*` 命令（只做建议/改写提示，不做重活）
- `reminders`：当检测到用户在写章节但未更新 thread/character 时提醒运行索引或创建线程卡

---

## 11. Commands/Skills 发现与合并（扩展点）

目标：像 oh-my-opencode 一样支持多来源：
- builtin：插件内置
- project：项目目录 `.opencode/command`、`.opencode/skills`
- user/global：用户级 skills（若 OpenCode 支持）

合并策略：
- builtin 永远可用（除非禁用）
- project 允许覆盖同名 command/skill（用于团队约束/自定义模板）
- 冲突必须可解释（日志输出：哪个来源覆盖了哪个）

---

## 12. 测试策略（完备）

### 12.1 单元测试（tools）
- parser：frontmatter/links
- rule engine：每条规则独立 fixture
- index/export：golden tests（稳定输出）
- context pack：选择策略 deterministic tests

### 12.2 集成测试（命令/工作流）
- fixtures：多章、多角色、多线程样例工程
- 跑索引/巡检/导出，断言派生文件与报告结构

### 12.3 回归与兼容
- Windows 路径与换行（CRLF/LF）兼容
- 大项目性能基线（扫描大量文件的耗时与内存上限）

---

## 13. 文档与示例（完备）

- `docs/workflow.md`：从 0 到 1 写完一章的流程（命令顺序、推荐实践）
- `docs/data-model.md`：实体字段规范、ID 规则、关系约定
- `docs/commands.md`：每条 `/novel-*` 命令参数、输入依赖、输出文件
- `docs/skills.md`：每个 skill 的触发词、输出协议、最佳搭配
- `docs/rules.md`：一致性规则清单（规则 id、说明、严重级别、示例）
- `assets/templates/*`：可直接用的模板与示例 frontmatter

---

## 14. 构建、分发与发布（完备）

### 14.1 Build
- `bun run build`：`bun build src/index.ts --outdir dist --format esm` + `tsc --emitDeclarationOnly`
- `bun run build:schema`：从 Zod 导出 `dist/novel.schema.json`

### 14.2 包结构
- `package.json`：
  - `"main": "dist/index.js"`
  - `"types": "dist/index.d.ts"`
  - `"exports": { ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" }, "./schema.json": "./dist/novel.schema.json" }`
- `files`：只发布 `dist/` 与必要 assets（模板/示例）

### 14.3 安装/调试
- 发布后：在 OpenCode 配置的 plugin 数组添加插件包名（例如 `"opencode-novel"`）
- 本地调试：用本地安装方式（例如 `file:` 依赖）把包安装到 OpenCode 可解析的 `node_modules` 下（以 OpenCode 的插件加载规则为准）

### 14.4 CI / Release（建议）
- CI（PR）：`bun test` → `bun run build` →（可选）运行 fixtures 集成测试
- Release（workflow_dispatch）：打 tag → 生成 changelog → npm publish → 创建 GitHub Release
- 兼容性门槛：在 release notes 标注最低 OpenCode 版本与已知不兼容点

---

## 15. 安全与隐私（完备）

- 默认不做 web 请求；所有文本处理本地完成
- context pack 支持敏感信息脱敏（redaction）
- 导出默认不包含环境敏感信息（路径、key）

---

## 16. 路线图（从 0 到完备版本）

Phase A：工程与配置（基础设施）
- A1：Bun/TS 工程骨架 + plugin 入口（只导出 default）
- A2：JSONC 读取 + Zod schema + schema 导出
- A3：日志与错误体系（error code、diagnostics 结构）
- A4：Agent registry + config handler 注入（确保 OpenCode 可直接使用 `novel-*` agents）

Phase B：数据模型与索引系统（生产力内核）
- B1：`novel_scan`（全量/增量）
- B2：`novel_index`（INDEX/TIMELINE/THREADS_REPORT）
- B3：模板与 `/novel-init`

Phase C：巡检系统（质量内核）
- C1：一致性规则引擎（基础规则 + 可扩展规则目录）
- C2：伏笔对账（显式字段 + 启发式提醒）
- C3：风格检查（可选）

Phase D：写作工作流（作者体验）
- D1：大纲/角色/势力/线程命令
- D2：章节计划 → 草稿 → 续写 → 重写 → 润色
- D3：审稿（引用定位、最小改动建议）

Phase E：后台任务与自动化（长篇适配）
- E1：后台任务管理与持久化
- E2：watch 模式（变更触发增量索引/巡检）

Phase F：导出与发布（可交付）
- F1：md/html 导出
- F2：epub/docx（择一落地）
- F3：发布流程（CI、版本策略、文档）

---

## 17. 最终验收标准（完备版）

1) 对一个 20 章、30 角色、50 线程的工程：
   - 全量扫描与索引在可接受时间内完成（并提供增量更新）
   - 一致性报告能定位到具体文件与证据
2) 工作流闭环：
   - 从 `/novel-init` 到 `/novel-export` 全流程可跑通
   - 每一步产物都落盘且结构稳定（适合版本控制）
   - OpenCode 中可直接选择/切换 `novel-muse` / `novel-editor` / `novel-sentinel`（agents 由插件注入）
3) 可扩展：
   - 项目级 `.opencode` 可覆盖命令/技能模板
   - 自定义规则可插拔（不改核心代码）
4) 工程质量：
   - 关键 tools 有单测与 golden tests
   - schema 与 docs 完整，用户能自行配置与排错

---

## 18. 风险与对策

- OpenCode 插件 API 变化：将核心能力收敛在 tools 与 schema，入口层薄、便于适配
- 解析容错与用户自由度冲突：提供 strict/loose 两档，并在报告里给出“修复建议而非强制失败”
- 长篇性能：增量扫描 + 缓存 + 后台任务；避免每次全量重算
