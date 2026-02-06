# skills-taxonomy-integration

## 固定编排顺序

1. 执行六个判定 skill：`genre`、`trope`、`audience`、`emotion`、`structure`、`market`。
2. 执行 `profile-aggregator` 输出 `.opencode/novel/profile.md`。
3. 读取画像后再调用内容专家 skill（例如 `novel-oracle`、`novel-polish-expert`）。
4. 若 `profileMode=compact`，专家输出需声明缺失维度风险。

## 命令接入策略

- `/novel-init`：强制生成 profile。
- `/novel-chapter-plan`：默认生成 profile；允许 `--skip-profile`。
- `/novel-outline`：优先消费 profile，不存在时降级并提示风险。
- `/novel-chapter-review`：引用 profile 进行偏离检查。

## 边界与治理

- 内容专家 skill 不得维护标签字典；仅可提交候选补充。
- 标签 skill 不得直接做正文改写。
- 命令层若跳过画像流程，必须明确记录 `profile=none`。
- 所有画像输出需兼容 compact，不得因缺失维度直接报错。

## 自动化建议

- 优先自动完成判定与聚合；仅在高风险覆盖正文时要求人工确认。
- 可复用最新 profile，若核心输入变化再触发增量重算。
- 记录 `profile.version` + `generatedAt` 便于回溯。
