# skills-taxonomy-contract

## Label Schema

| field | type | required | description |
|---|---|---|---|
| id | string | yes | 稳定唯一 ID（小写连字符） |
| name | string | yes | 标签展示名 |
| aliases | string[] | yes | 输入映射别名 |
| parentId | string \| null | yes | 父标签 ID（无父级为 null） |
| conflicts | string[] | yes | 明确互斥标签 ID |
| status | active \| deprecated | yes | 生命周期状态 |

## Classifier Output Schema

| field | type | required | description |
|---|---|---|---|
| domain | enum | yes | 当前判定域（六大域之一） |
| labels | resultLabel[] | yes | 命中标签结果 |
| unmatched | string[] | yes | 未匹配关键词 |
| notes | string[] | yes | 边界说明/风险提示 |

### resultLabel

| field | type | required | description |
|---|---|---|---|
| id | string | yes | 标签 ID |
| name | string | yes | 标签名称 |
| confidence | number(0-1) | yes | 置信度 |
| evidence | string[] | yes | 判定证据（至少一条） |

## Profile Aggregator Schema

| field | type | required | description |
|---|---|---|---|
| version | string | yes | 引用字典版本 |
| profileMode | compact \| full | yes | 画像模式（默认 compact） |
| genre/trope/audience/emotion/structure/market | resultLabel[] | no | 各域结果，compact 可缺省 |
| missingDomains | string[] | yes | 未输出维度 |
| coverage | number(0-1) | yes | 覆盖率 |
| conflictWarnings | string[] | yes | 冲突告警 |
| summary | string | yes | 一句话类型画像 |

## Quality Gates

- schema gate：缺字段直接失败。
- enum gate：输出标签必须来自字典。
- boundary gate：禁止跨域输出标签。
- conflict gate：冲突命中必须产生 warning。
- trace gate：必须携带 version + evidence。
