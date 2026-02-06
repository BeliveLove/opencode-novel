# skills-taxonomy-plan（实现落地版）

> 该文档是仓库内落地执行摘要；详细原始规划见根目录 `skills-taxonomy-plan.md`（本次按用户要求不纳入版本库）。

## 目标范围

- 交付八个标签技能：`taxonomy-registry`、六个分类器、`profile-aggregator`。
- 交付六大域标签字典与 `aliases/conflicts/changelog` 引用文件。
- 交付命令编排接入：`/novel-init`、`/novel-chapter-plan`、`/novel-outline`、`/novel-chapter-review`。
- 交付回归样本与自动化校验，保证 `compact/full` 兼容。

## 阶段分解

### G1 协议冻结

- 固化字段合同：`docs/skills-taxonomy-contract.md`
- 固化六大域边界、命名规则、冲突规则

### G2 字典生成

- 生成 taxonomy 主字典：`taxonomy-v1.md`
- 生成别名字典：`aliases-v1.md`
- 生成冲突字典：`conflicts-v1.md`

### G3 八技能生成

- 新增 8 个技能模板（内置 + 可导出）
- 每个技能都给出触发、输入、输出协议与边界约束

### G4 样本与验证

- 新增 `test/skills-taxonomy/*.samples.md`
- 增加自动化测试：字典结构、技能注册、命令接入提示

### G5 命令接入

- `/novel-init` 强制前置标签判定
- `/novel-chapter-plan` 默认前置判定，可 `--skip-profile`
- `/novel-outline` / `/novel-chapter-review` 读取 profile 降级兼容

## 质量门禁

- 结构字段缺失即失败
- 标签枚举越界即失败
- 跨域输出即失败
- 命中冲突必须给出 warning
- 所有输出可追溯到 `version + evidence`
