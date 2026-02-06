# genre.samples

## Positive

- P01 | input: 修炼宗门、灵根、飞升体系 | expect: xianxia
- P02 | input: 斗气大陆、异火、等级晋升 | expect: xuanhuan
- P03 | input: 江湖门派、刀剑恩仇、侠义 | expect: wuxia
- P04 | input: 星际舰队、曲率航行、殖民星球 | expect: kehuan
- P05 | input: 魔法学院、龙与地下城、法师议会 | expect: qihuan
- P06 | input: 都市异能、职场逆袭、商业资本 | expect: dushi
- P07 | input: 王朝更替、朝堂博弈、边疆战事 | expect: lishi
- P08 | input: 军旅营连、战区推演、特战行动 | expect: junshi
- P09 | input: 连环杀人案、线索推演、嫌疑反转 | expect: xuanyi
- P10 | input: 废弃医院、诡异录像、夜间追逐 | expect: kongbu
- P11 | input: 先婚后爱、情感拉扯、甜虐并存 | expect: yanqing
- P12 | input: 同人社团、校园轻小说语气、番剧梗 | expect: erciyuan

## Negative

- N01 | input: 只有恋爱日常，没有修炼体系 | reject: xianxia
- N02 | input: 现实刑侦报告体，无超自然设定 | reject: xuanhuan
- N03 | input: 星际政治阴谋，非江湖武学 | reject: wuxia
- N04 | input: 古代王朝宅斗，不含科技母题 | reject: kehuan
- N05 | input: 都市职场复仇，无魔法体系 | reject: qihuan
- N06 | input: 异世界地牢冒险，不是现代都市 | reject: dushi
- N07 | input: 现代创业纪实，非历史叙事 | reject: lishi
- N08 | input: 校园青春恋爱，不含军事行动 | reject: junshi
- N09 | input: 纯甜宠叙事，无谜题链条 | reject: xuanyi
- N10 | input: 轻喜剧治愈风，无惊悚压迫 | reject: kongbu
- N11 | input: 纯战争策略，不以情感主线驱动 | reject: yanqing
- N12 | input: 严肃历史纪实，无二次元圈层语汇 | reject: erciyuan
