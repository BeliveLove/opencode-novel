export const NOVEL_BOOTSTRAP_TEMPLATE = `目标：一键迁移并生成派生产物（deterministic）。

步骤：
1) 解析参数：
   - 可选：--from=<path> 作为 fromDir
   - 可选：--stubs 作为 createStubs=true
2) 调用 tool: novel_bootstrap（一次性编排，不要手工串联多个 tool）：
   - args: { fromDir?, createStubs? }
3) 输出：
   - 本次 writtenFiles / durationMs
   - 下一步：/novel-extract-entities → /novel-apply-candidates → /novel-continuity-check

约束：
- 严禁修改 fromDir 下原始文件（只读）。只允许写入 manuscript/ 与 .opencode/novel/ 等派生目录。`;
