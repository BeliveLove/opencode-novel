# opencode-novel

`opencode-novel` 是一个面向中文小说创作流程的 OpenCode 插件。  
它通过 `/novel-*` 命令把「初始化 → 导入 → 索引 → 巡检 → 写作 → 导出」串成可重复执行的工程化流程。

## 核心能力

- 命令式写作工作流：`/novel-*`
- 可复现工具链：`novel_*` tools（索引、连续性、伏笔、风格、导出等）
- 受控落盘机制：支持 `dryRun`、候选应用、快照
- 多格式导出：`md` / `html` / `epub` / `docx`
- 导出前预检：可在导出前执行质量门禁（continuity/style 等）

## 快速开始

### 1) 安装依赖并构建

```bash
bun install
bun run build
```

### 2) 安装到 OpenCode

```bash
bun run script/install-opencode.ts -- --target=global
```

安装后重启 OpenCode。

### 3) 常用命令顺序

```text
/novel-init "书名"
/novel-config-check
/novel-index
/novel-chapter-plan ch0001
/novel-chapter-draft ch0001
/novel-continuity-check
/novel-export docx
```

## 输出协议（对接方）

所有 `/novel-*` 工具命令统一输出四段：

1. `Summary`
2. `Result (JSON)`
3. `Diagnostics`
4. `Next Steps`

其中 `Result (JSON)` 会包含：

- `version`
- `schemaVersion`（当前与 `version` 值一致）

建议对接程序优先按 `schemaVersion` 做兼容分支，缺失时回退到 `version`。

## 项目目录（简版）

```text
src/                    # 插件与工具实现
script/                 # 构建/安装/性能脚本
assets/                 # 模板资源（bible/chapter 等）
dist/                   # 构建产物
.opencode/              # 命令/技能/派生输出目录（运行时）
manuscript/             # 小说事实源（运行时）
```

## 配置说明

配置按以下顺序合并（后者覆盖前者）：

1. 内置默认配置
2. 用户级配置（以下路径命中其一即可）
   - `~/.config/opencode/novel.jsonc`
   - `%USERPROFILE%\\.config\\opencode\\novel.jsonc`
   - `%APPDATA%\\opencode\\novel.jsonc`
3. 项目级配置：`<project>/.opencode/novel.jsonc`

构建后会生成配置 schema：

- `dist/novel.schema.json`

## 开发命令

- `bun run lint`：静态检查
- `bun run typecheck`：类型检查
- `bun test`：运行测试
- `bun run check`：完整检查（lint + typecheck + test + build）
- `bun run benchmark:index`：索引性能基准测试

## npm 发布（自动流）

仓库已配置 GitHub Actions 发布流程。触发方式：

1. 确保 `package.json` 版本号正确
2. 推送匹配版本的标签（格式：`v<version>`）
3. 仓库 Secret 中配置 `NPM_TOKEN`

示例：

```bash
bun pm version patch
git push --follow-tags
```

## 许可证

如需开源发布，请补充 `LICENSE` 文件并在此声明许可证类型。
