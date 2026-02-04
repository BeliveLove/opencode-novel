# 极致低门槛 + 高效创作体验：代码层缺陷清单（opencode-novel）

> 范围声明：本报告**仅基于代码**推断（`src/**`、`script/**`），**未参考**任何其他文档内容（如 `README.md`、`docs/**` 等）。
>
> 时间：2026-02-04

## 0. 从代码可见的产品形态（用于对齐讨论上下文）

- 这是一个 OpenCode 插件（Bun/TypeScript），入口 `src/index.ts`。
- 核心能力以“确定性工具（tool）”为主：导入、扫描、索引、缺口盘点、图谱、连续性检查、伏笔审计、导出等（均读写本地文件）。
- 数据模型以“Markdown + YAML frontmatter”作为**事实源**：章节/角色/线索/势力/地点存放于 `manuscript/**`；派生文件输出到 `.opencode/novel/**`。
- LLM 相关能力主要通过“命令模板（command template）+ 技能模板（skill template）”去驱动工具调用或生成候选变更（`candidates.json`）再受控落盘（`novel_apply_candidates`）。

> 评价维度：以“**极致低门槛**（首次使用/导入就能跑通）+ **高效创作体验**（少手工、少重复、少等待、低误伤）”为目标，指出代码层面的短板。

---

## 1. 缺陷清单（按优先级）

### P0（直接阻塞低门槛 / 高风险误伤 / 显著拖慢）

#### P0-1 `novel_context_pack` 强制必填 `budget.maxChars`，没有默认值

- 现象：工具参数要求 `budget` 必填；但“命令模板”中多处只口头提到“使用 config.contextPack.maxChars”，缺少强约束/默认兜底。
- 影响：
  - 用户直接调用 tool 时**极易因缺参失败**，增加心智负担；
  - 依赖该工具的上层流程（章节计划/草稿/审阅等）稳定性下降，削弱“低门槛一键跑通”。
- 代码证据：
  - `src/tools/novel-context-pack/tool.ts:88`（`budget` 未 `.optional()`）
  - `src/tools/novel-context-pack/types.ts:11`（类型层也要求必填）
- 建议方向：
  - 让 `budget` 变为可选：缺省时用 `deps.config.contextPack.maxChars`；
  - 在输出 `Result(JSON)` 中回显最终采用的预算（便于用户理解“为什么被截断”）。

#### P0-2 编码策略“名存实亡”：配置里有 `encoding`，但只允许 `utf8`，且读文件处硬编码 UTF-8

- 现象：
  - 配置 schema 里 `encoding` 只支持 `utf8`（等于没有给用户选择空间）。
  - `novel_import` / `novel_scan` 等读文件处直接 `readFileSync(..., "utf8")`。
- 影响：
  - 中文写作常见的 `.txt` 可能是 **GBK/UTF-16**；当前实现会导致导入内容乱码或失败，属于“低门槛”硬阻塞。
  - `encoding` 配置字段存在但无实际价值，降低用户信任。
- 代码证据：
  - `src/config/schema.ts:4`（`NovelEncodingSchema = z.enum(["utf8"])`）
  - `src/tools/novel-import/tool.ts:293`（`readFileSync(absPath, "utf8")`）
  - `src/tools/novel-scan/scan.ts:205`（`readFileSync(file.path, "utf8")`）
- 建议方向：
  - 至少支持 `utf8-bom`/`utf16le`/`gbk`（或导入时做 BOM/编码探测 + 可覆盖参数）。
  - 将 `config.encoding` 真正接入导入/扫描等所有读取点，避免“配置项摆设”。

#### P0-3 `novel_import` 性能风险：先全量遍历 `fromDir` 再 glob 过滤（不剪枝）

- 现象：`walkFiles(fromDir)` 递归遍历整个目录树，之后才基于 `includeGlobs/excludeGlobs` 过滤。对于包含 `node_modules/`、大仓库、网络盘目录等，这一步可能非常慢。
- 影响：
  - “导入第一步就卡死/等待很久”，直接打断新用户体验；
  - 会让“高效创作”变成“高频等待”。
- 代码证据：
  - `src/tools/novel-import/tool.ts:34`（`walkFiles` 递归遍历实现）
  - `src/tools/novel-import/tool.ts:262`（先 `walkFiles(fromDir)` 再 `.filter(...)`）
- 建议方向：
  - 遍历阶段做目录剪枝：基于 `excludeGlobs`（至少对 `.git/`、`node_modules/`、`dist/` 等常见大目录硬编码快速跳过）；
  - 或提供更“收敛”的默认策略：强制用户显式指定 `fromDir`，或默认只扫 `drafts/**` 之类的子目录（减少误扫与等待）。

#### P0-4 `novel_scan` 的 “incremental” 仍然全量读文件 + 计算 SHA256：IO 成本没有降下来

- 现象：即便增量模式，扫描仍会对每个文件 `readFileSync` + `sha256`，仅在“复用实体解析/诊断结果”上省一点 CPU。
- 影响：
  - 对长篇章节（单文件几十 KB~数百 KB）项目，`/novel-index`、`/novel-continuity-check` 等依赖 scan 的命令会频繁触发“全量读文件”，效率不佳。
- 代码证据：
  - `src/tools/novel-scan/scan.ts:205`（读文件）
  - `src/tools/novel-scan/scan.ts:207`（计算 `sha256`）
  - `src/tools/novel-scan/scan.ts:217`（用 `sha256` 判断 unchanged）
- 建议方向：
  - 先用 `stat(mtimeMs,size)` 快速判断是否可能变化；只有变化时再读文件做 hash/解析；
  - 或把 hash 只算 frontmatter 区域（更贴合“事实源”用途）。

#### P0-5 `novel_apply_candidates` 的“merge”对数组是覆盖，不是追加/去重；`mode:"replace"` 命名也容易误导

- 现象：
  - `deepMerge` 在数组上直接 `return override`（覆盖）。
  - `patch_frontmatter` 的 `mode:"replace"` 分支只是 `{...currentData, ...patch}` 的浅层覆盖，并非“整体替换”。
- 影响：
  - 一旦 dryRun=false，LLM 给出 `characters: ["char-x"]` 这类补丁，可能把既有 `characters` 全部覆盖掉，造成事实源损坏；
  - 语义不清会增加用户对“是否安全可用”的担忧，降低效率（不敢点 apply）。
- 代码证据：
  - `src/tools/novel-apply-candidates/tool.ts:26`（数组覆盖）
  - `src/tools/novel-apply-candidates/tool.ts:250`（`mode === "replace"` 分支）
- 建议方向：
  - 为数组引入更安全的操作语义：`append_unique` / `remove` / `set`；
  - 将 `mode` 改为更准确的命名（例如 `shallow_merge` / `deep_merge`），避免“replace”误解；
  - 在 APPLY_REPORT 中对“会覆盖数组字段”给出高亮提示（降低误伤）。

#### P0-6 高层流程主要靠 LLM 模板串联，缺少确定性的“编排工具（orchestrator tool）”

- 现象：例如 `/novel-bootstrap` 是一个模板，要求 LLM 自己按步骤调用多个 tool、解析 `--stubs` 等参数；但插件并未提供一个真正的 `novel_bootstrap` tool 来一次性完成编排。
- 影响：
  - 低门槛不稳定：模型偶发漏步骤/参数解析偏差；
  - 高效体验不稳：每次都要“说一遍流程”，token 与时间消耗更高。
- 代码证据：
  - `src/features/builtin-commands/commands.ts:43`（`"novel-bootstrap": { template: ... }`）
  - `src/index.ts:21` 起（工具列表中没有 `novel_bootstrap` 这类编排型 tool）
- 建议方向：
  - 增加编排型 tool：`novel_bootstrap` / `novel_init` / `novel_snapshot` 等，让常见路径“1 次调用就结束”，并做真实参数校验与错误提示。

---

### P1（明显摩擦 / 容易踩坑 / 让用户反复返工）

#### P1-1 扫描不递归：章节/实体目录必须“扁平化”

- 现象：`listMarkdownFiles` 只扫描目录下一级文件，不递归。
- 影响：
  - 用户按卷/幕/场景分目录组织章节时会被“扫描不到”，需要强制扁平化，增加迁移与维护成本；
  - 降低大型项目的可用性与扩展性。
- 代码证据：`src/tools/novel-scan/scan.ts:22`（`readdirSync(dir, { withFileTypes: true })`，只收集 `entry.isFile()`）
- 建议方向：
  - 递归扫描 `manuscript/chapters/**.md`（同理 characters/threads 等也可递归）；
  - 或至少在 diagnostics 中明确提示“当前不支持子目录”，避免用户误解为 bug。

#### P1-2 Frontmatter 解析对文件开头过于苛刻：必须从第 1 字节开始就是 `---`

- 现象：frontmatter 只有在 `content.startsWith("---\n")` 才会解析；文件开头的 BOM、空行、注释都会导致 frontmatter 被忽略。
- 影响：
  - 用户从其他编辑器/平台拷贝来的 Markdown（含 BOM/空行）会被当成“没有 frontmatter”，进而触发一堆 `*_ID_MISSING` 警告；
  - 属于“隐性门槛”：用户不知道为什么工具说缺字段。
- 代码证据：`src/shared/markdown/frontmatter.ts:23`
- 建议方向：
  - 允许跳过 UTF-8 BOM 与前置空行；
  - diagnostics 给出更明确的提示（比如检测到 `---` 但不在开头时提示“frontmatter 必须置顶”）。

#### P1-3 “稳定排序”配置存在但未使用：`stableSortLocale`、`naming.*Pattern` 等多字段未落地

- 现象：配置 schema 定义了不少看起来“影响行为”的字段，但在 `src/**` 中找不到引用点（或只出现在 schema/模板字符串中）。
- 影响：
  - 用户尝试调整配置却发现“没有效果”，会认为产品不可靠；
  - 无法通过配置保证输出稳定性/规范性，导致协作与回溯成本升高。
- 代码证据（字段定义处）：
  - `src/config/schema.ts:28`（`naming.*Pattern`）
  - `src/config/schema.ts:48`（`stableSortLocale`）
  - `src/config/schema.ts:86`（`export.formats`）
  - `src/config/schema.ts:77`（`threads.staleDaysWarn`）
  - `src/config/schema.ts:206`（`import.multiChapterFiles` / `import.manuscriptExistsPolicy`）
  - `src/config/schema.ts:281`（`customTemplatesDir` / `customRulesDir` / `skills`）
- 建议方向：
  - 要么真正接入（例如所有 `localeCompare` 统一使用 `stableSortLocale`；扫描时按 `*Pattern` 校验并给出修复建议）；
  - 要么删减/隐藏未实现字段，避免“配置幻觉”。

#### P1-4 `threads.openThreads` 命名与实现不一致：实际会包含已关闭线索

- 现象：context pack 的 `include.openThreads` 会把 `threads_closed` 也打包进去。
- 影响：用户以为“只拿开放线索”，实际上下文更嘈杂、更耗预算，降低“高效创作”的上下文质量。
- 代码证据：`src/tools/novel-context-pack/tool.ts:286`（集合包含 `threads_closed`）
- 建议方向：
  - 改名为 `include.threadsReferencedInChapter`；或实现真正“仅 open/in_progress”筛选（需读取 thread 卡状态）。

---

### P2（体验增强 / 质量与效率的进一步优化）

#### P2-1 `novel_bible` 解析编号列表规则的正则疑似写错（`\\.`）

- 现象：规则解析试图匹配 `1.` 这类编号列表，但使用了 `\\.`，在 JS 正则中意味着“反斜杠 + 任意字符”，不是“字面点号”。
- 影响：用户用编号列表写 rules 时可能被完全忽略，需要改成 `-` 或显式 `R-xxx:`，增加写作摩擦。
- 代码证据：`src/tools/novel-bible/tool.ts:40`
- 建议方向：改为 `\d+\.`；并补一个单测覆盖 `1. xxx`。

#### P2-2 角色口癖统计的实现可能在大项目上变慢（重复读章节语料）

- 现象：对每个角色构建语料时会读取并解析其相关章节；角色多时 IO 次数会非常高。
- 影响：风格检查变成“昂贵操作”，用户不愿频繁运行，削弱“高频反馈”的效率优势。
- 代码证据：`src/tools/novel-style-check/tool.ts:156`（相关章节过滤）与 `src/tools/novel-style-check/tool.ts:159`（构建 corpus 读文件）
- 建议方向：
  - 复用 scan 缓存（至少复用章节 body，不要对每个角色重复读文件）；
  - 或提供按 scope 限制（只对目标角色/章节运行）。

#### P2-3 图谱可读性偏低：节点默认只显示 id，不显示 name

- 现象：Mermaid 节点 label 直接用 id（`id["id"]`）。
- 影响：图谱对人类阅读不友好，降低“快速理解/快速决策”效率。
- 代码证据：`src/tools/novel-graph/tool.ts:119`
- 建议方向：节点 label 使用 `name` 优先（需要从 scan/entities 或再读 frontmatter 取 name）。

---

## 2. 建议的“低门槛 + 高效”修复路线（仅基于上述缺陷推导）

1) **先打通“不会失败”的最小链路（P0）**
   - context pack 预算默认值（避免缺参失败）
   - import 遍历剪枝（避免卡死）
   - apply-candidates 数组安全语义（避免事实源误伤）
   - 编码支持（GBK/UTF-16/BOM）
2) **再降低“事实源维护成本”（P1）**
   - 递归扫描/更宽容 frontmatter
   - 落地 `stableSortLocale` 与 `naming.*Pattern`（或删减无效配置）
3) **最后做“体验增量”（P2）**
   - bible 编号列表修复
   - 图谱 label 优化、style-check 性能优化

