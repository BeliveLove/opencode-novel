export function createWorldTemplate(bookTitle?: string): string {
  const title = bookTitle?.trim() ? `《${bookTitle.trim()}》` : "（未命名）"
  return `# 世界观（World Bible）

> 项目：${title}

## 规则条款
1. R-001：在此补充世界规则（示例：宵禁时间、地理限制、超凡代价）。

## 名词表
- 词条：解释
`
}

export const RULES_TEMPLATE = `# 规则条款（Rules）

## 规则条款
1. R-001：……
2. R-002：……
`

export const GLOSSARY_TEMPLATE = `# 名词表（Glossary）

- 词条：解释
`

export const CHARACTERS_README_TEMPLATE = `# 角色目录说明

每个角色一个文件：\`<id>.md\`，建议包含 frontmatter：

- id（必填）
- name / alias
- motivation / desire
- arc（阶段与转折）
- voice（口癖/句式/禁用词）
- relationships（关系）
`

export const THREADS_README_TEMPLATE = `# 线程目录说明

每个伏笔/承诺一个文件：\`<thread_id>.md\`，建议包含 frontmatter：

- thread_id（必填）
- type / status
- opened_in / expected_close_by / close_plan / closed_in
`

