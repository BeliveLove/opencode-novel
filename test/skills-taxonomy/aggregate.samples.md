# aggregate.samples

## Combination Cases

- C01 | genre:xianxia + trope:system-upgrade + structure:three-act | expect summary: 升级型仙侠三幕
- C02 | genre:kehuan + trope:investigation + emotion:suspense-tense | expect summary: 科幻悬疑推理
- C03 | genre:yanqing + audience:female-oriented + market:cp-driven | expect summary: 女频关系驱动言情
- C04 | genre:xuanyi + structure:case-of-week + market:twist-dense | expect summary: 单元悬疑反转流
- C05 | genre:dushi + trope:business-empire + market:premium-subscription | expect summary: 都市经营订阅向
- C06 | genre:lishi + trope:court-politics + structure:long-arc | expect summary: 历史权谋长弧
- C07 | genre:qihuan + trope:academy + emotion:hot-blooded | expect summary: 奇幻学院热血
- C08 | genre:kongbu + emotion:dark-depressive + market:high-hook | expect summary: 惊悚黑暗高钩子
- C09 | genre:junshi + structure:linear-chronological + market:fast-paced | expect summary: 军事线性快节奏
- C10 | genre:erciyuan + audience:fandom-community + market:short-video-friendly | expect summary: 圈层二次元传播向
- C11 | genre:wuxia + emotion:epic-majestic + structure:multi-thread-weave | expect summary: 武侠史诗多线程
- C12 | genre:kehuan + market:adaptation-ready + audience:ip-adaptation | expect summary: 科幻改编潜力向

## Conflict Cases

- X01 | audience:all-ages + audience:adult-18-plus | expect warning: audience/all-ages vs adult-18-plus
- X02 | audience:youth + audience:adult-18-plus | expect warning: audience/youth vs adult-18-plus
- X03 | emotion:healing-warm + emotion:dark-depressive | expect warning: emotion/healing-warm vs dark-depressive
- X04 | emotion:comedy-light + emotion:tragic-fate | expect warning: emotion/comedy-light vs tragic-fate
- X05 | emotion:romance-sweet + emotion:romance-angst | expect warning: emotion/romance-sweet vs romance-angst
- X06 | structure:single-protagonist + structure:ensemble-multi-line | expect warning: structure/single-protagonist vs ensemble-multi-line
- X07 | structure:linear-chronological + structure:nonlinear-time | expect warning: structure/linear-chronological vs nonlinear-time
- X08 | structure:first-person + structure:third-omniscient | expect warning: structure/first-person vs third-omniscient
- X09 | structure:third-limited + structure:third-omniscient | expect warning: structure/third-limited vs third-omniscient
- X10 | market:fast-paced + market:slow-burn | expect warning: market/fast-paced vs slow-burn
- X11 | market:daily-serial + market:short-complete | expect warning: market/daily-serial vs short-complete
- X12 | trope:rebirth + trope:transmigration | expect warning: trope/rebirth vs transmigration
