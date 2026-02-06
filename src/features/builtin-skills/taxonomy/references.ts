import { TAXONOMY_REGISTRY_V1 } from "./registry";
import type { TaxonomyDomain, TaxonomyLabel, TaxonomyRegistry } from "./types";

type ReferenceFile = {
  relativePath: string;
  content: string;
};

const DOMAIN_ORDER: TaxonomyDomain[] = [
  "genre",
  "trope",
  "audience",
  "emotion",
  "structure",
  "market",
];

const DOMAIN_TITLES: Record<TaxonomyDomain, string> = {
  genre: "题材",
  trope: "流派",
  audience: "受众",
  emotion: "情绪",
  structure: "结构",
  market: "商业标签",
};

function formatJsonBlock(data: unknown): string {
  return `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
}

function toAliasRecords(registry: TaxonomyRegistry) {
  const records: Array<{ domain: TaxonomyDomain; alias: string; id: string; name: string }> = [];
  for (const domain of DOMAIN_ORDER) {
    const labels = registry.domains[domain] ?? [];
    for (const label of labels) {
      records.push({
        domain,
        alias: label.name,
        id: label.id,
        name: label.name,
      });
      for (const alias of label.aliases) {
        records.push({
          domain,
          alias,
          id: label.id,
          name: label.name,
        });
      }
    }
  }
  return records.sort(
    (a, b) =>
      a.domain.localeCompare(b.domain) ||
      a.alias.localeCompare(b.alias, "zh-Hans-CN") ||
      a.id.localeCompare(b.id),
  );
}

function toConflictRecords(registry: TaxonomyRegistry) {
  const unique = new Map<string, { domain: TaxonomyDomain; left: string; right: string }>();
  for (const domain of DOMAIN_ORDER) {
    const labels = registry.domains[domain] ?? [];
    for (const label of labels) {
      for (const conflictId of label.conflicts) {
        const sortedPair = [label.id, conflictId].sort((a, b) => a.localeCompare(b));
        const key = `${domain}:${sortedPair[0]}:${sortedPair[1]}`;
        if (!unique.has(key)) {
          unique.set(key, { domain, left: sortedPair[0], right: sortedPair[1] });
        }
      }
    }
  }
  return Array.from(unique.values()).sort(
    (a, b) =>
      a.domain.localeCompare(b.domain) ||
      a.left.localeCompare(b.left) ||
      a.right.localeCompare(b.right),
  );
}

function buildTaxonomyMarkdown(registry: TaxonomyRegistry): string {
  const parts: string[] = [
    "# taxonomy-v1",
    "",
    "## Metadata",
    "",
    `- version: \`${registry.version}\``,
    `- updatedAt: \`${registry.updatedAt}\``,
    `- domains: ${DOMAIN_ORDER.join(", ")}`,
    "",
    "## Full Registry (JSON)",
    "",
    formatJsonBlock(registry),
  ];

  for (const domain of DOMAIN_ORDER) {
    const labels = registry.domains[domain] ?? [];
    parts.push(`## Domain: ${domain}（${DOMAIN_TITLES[domain]}）`, "");
    parts.push("| id | name | status | parentId | conflicts | aliases |");
    parts.push("|---|---|---|---|---|---|");
    for (const label of labels) {
      const conflicts = label.conflicts.length > 0 ? label.conflicts.join(", ") : "-";
      const parentId = label.parentId ?? "null";
      const aliases = label.aliases.length > 0 ? label.aliases.join(" / ") : "-";
      parts.push(
        `| ${label.id} | ${label.name} | ${label.status} | ${parentId} | ${conflicts} | ${aliases} |`,
      );
    }
    parts.push("");
  }

  return `${parts.join("\n").trimEnd()}\n`;
}

function buildAliasesMarkdown(registry: TaxonomyRegistry): string {
  const aliases = toAliasRecords(registry);
  const parts: string[] = [
    "# aliases-v1",
    "",
    "用于输入映射：alias -> canonical label id（仅映射，不用于最终主键）。",
    "",
    "| domain | alias | canonicalId | canonicalName |",
    "|---|---|---|---|",
  ];
  for (const item of aliases) {
    parts.push(`| ${item.domain} | ${item.alias} | ${item.id} | ${item.name} |`);
  }
  parts.push("");
  return parts.join("\n");
}

function findLabel(registry: TaxonomyRegistry, domain: TaxonomyDomain, id: string): TaxonomyLabel {
  const label = registry.domains[domain].find((item) => item.id === id);
  if (!label) {
    throw new Error(`Missing label "${id}" in domain "${domain}".`);
  }
  return label;
}

function buildConflictsMarkdown(registry: TaxonomyRegistry): string {
  const conflicts = toConflictRecords(registry);
  const parts: string[] = [
    "# conflicts-v1",
    "",
    "仅记录明确互斥关系（hard conflicts），弱冲突不收录。",
    "",
    "| domain | leftId | leftName | rightId | rightName | rule |",
    "|---|---|---|---|---|---|",
  ];
  for (const item of conflicts) {
    const left = findLabel(registry, item.domain, item.left);
    const right = findLabel(registry, item.domain, item.right);
    parts.push(
      `| ${item.domain} | ${item.left} | ${left.name} | ${item.right} | ${right.name} | mutual-exclusive |`,
    );
  }
  parts.push("");
  return parts.join("\n");
}

function buildChangelogMarkdown(registry: TaxonomyRegistry): string {
  return [
    "# changelog",
    "",
    "## v1.0.0 - 2026-02-06",
    "",
    "- 首次发布六大域标签字典（genre/trope/audience/emotion/structure/market）。",
    "- 冻结统一字段协议：label/result/profile。",
    "- 引入 aliases 与 conflicts 拆分文件，支持后续增量维护。",
    "",
    "## 维护规则",
    "",
    "1. 新标签必须补齐 `id/name/aliases/parentId/conflicts/status`。",
    "2. 不允许复用既有 `id`；废弃标签仅允许标记为 `deprecated`。",
    "3. 变更时同时更新 `taxonomy-v1.md`、`aliases-v1.md`、`conflicts-v1.md`。",
    `4. 发布后同步更新版本号（当前：${registry.version}）。`,
    "",
  ].join("\n");
}

export function getTaxonomyReferenceFiles(): ReferenceFile[] {
  const registry = TAXONOMY_REGISTRY_V1;
  return [
    {
      relativePath: "references/taxonomy-v1.md",
      content: buildTaxonomyMarkdown(registry),
    },
    {
      relativePath: "references/aliases-v1.md",
      content: buildAliasesMarkdown(registry),
    },
    {
      relativePath: "references/conflicts-v1.md",
      content: buildConflictsMarkdown(registry),
    },
    {
      relativePath: "references/changelog.md",
      content: buildChangelogMarkdown(registry),
    },
  ];
}

export function buildTaxonomyContractMarkdown(): string {
  return [
    "# skills-taxonomy-contract",
    "",
    "## Label Schema",
    "",
    "| field | type | required | description |",
    "|---|---|---|---|",
    "| id | string | yes | 稳定唯一 ID（小写连字符） |",
    "| name | string | yes | 标签展示名 |",
    "| aliases | string[] | yes | 输入映射别名 |",
    "| parentId | string \\| null | yes | 父标签 ID（无父级为 null） |",
    "| conflicts | string[] | yes | 明确互斥标签 ID |",
    "| status | active \\| deprecated | yes | 生命周期状态 |",
    "",
    "## Classifier Output Schema",
    "",
    "| field | type | required | description |",
    "|---|---|---|---|",
    "| domain | enum | yes | 当前判定域（六大域之一） |",
    "| labels | resultLabel[] | yes | 命中标签结果 |",
    "| unmatched | string[] | yes | 未匹配关键词 |",
    "| notes | string[] | yes | 边界说明/风险提示 |",
    "",
    "### resultLabel",
    "",
    "| field | type | required | description |",
    "|---|---|---|---|",
    "| id | string | yes | 标签 ID |",
    "| name | string | yes | 标签名称 |",
    "| confidence | number(0-1) | yes | 置信度 |",
    "| evidence | string[] | yes | 判定证据（至少一条） |",
    "",
    "## Profile Aggregator Schema",
    "",
    "| field | type | required | description |",
    "|---|---|---|---|",
    "| version | string | yes | 引用字典版本 |",
    "| profileMode | compact \\| full | yes | 画像模式（默认 compact） |",
    "| genre/trope/audience/emotion/structure/market | resultLabel[] | no | 各域结果，compact 可缺省 |",
    "| missingDomains | string[] | yes | 未输出维度 |",
    "| coverage | number(0-1) | yes | 覆盖率 |",
    "| conflictWarnings | string[] | yes | 冲突告警 |",
    "| summary | string | yes | 一句话类型画像 |",
    "",
    "## Quality Gates",
    "",
    "- schema gate: 缺字段直接失败。",
    "- enum gate: 输出标签必须来自字典。",
    "- boundary gate: 禁止跨域输出标签。",
    "- conflict gate: 冲突命中必须产生 warning。",
    "- trace gate: 必须携带 version + evidence。",
    "",
  ].join("\n");
}

export function buildTaxonomyIntegrationMarkdown(): string {
  return [
    "# skills-taxonomy-integration",
    "",
    "## 固定编排顺序",
    "",
    "1. 执行六个判定 skill：`genre`、`trope`、`audience`、`emotion`、`structure`、`market`。",
    "2. 执行 `profile-aggregator` 输出 `.opencode/novel/profile.md`。",
    "3. 读取画像后再调用内容专家 skill（例如 `novel-oracle`、`novel-polish-expert`）。",
    "4. 若 `profileMode=compact`，专家输出需声明缺失维度风险。",
    "",
    "## 命令接入策略",
    "",
    "- `/novel-init`：强制生成 profile。",
    "- `/novel-chapter-plan`：默认生成 profile；允许 `--skip-profile`。",
    "- `/novel-outline`：优先消费 profile，不存在时降级并提示风险。",
    "- `/novel-chapter-review`：引用 profile 进行偏离检查。",
    "",
    "## 边界与治理",
    "",
    "- 内容专家 skill 不得维护标签字典；仅可提交候选补充。",
    "- 标签 skill 不得直接做正文改写。",
    "- 命令层若跳过画像流程，必须明确记录 `profile=none`。",
    "- 所有画像输出需兼容 compact，不得因缺失维度直接报错。",
    "",
    "## 自动化建议",
    "",
    "- 优先自动完成判定与聚合；仅在高风险覆盖正文时要求人工确认。",
    "- 可复用最新 profile，若核心输入变化再触发增量重算。",
    "- 记录 `profile.version` + `generatedAt` 便于回溯。",
    "",
  ].join("\n");
}
