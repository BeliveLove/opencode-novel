# opencode-novel

把“写小说”工程化为 OpenCode 插件（Bun/TypeScript），提供可复用的 Tools / Commands / Skills，并以项目内 Markdown 作为事实来源，自动生成索引与巡检报告。

## 本地调试（Windows 示例）

1. 构建：
   - `bun install`
   - `bun run build`
2. 在 OpenCode 配置中加入插件（注意 `file:///` 且使用 `/`）：
   ```json
   {
     "plugin": [
       "file:///D:/code/novel/dist/index.js"
     ]
   }
   ```

