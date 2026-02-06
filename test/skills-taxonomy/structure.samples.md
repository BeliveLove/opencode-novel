# structure.samples

## Positive

- P01 | input: 全书围绕唯一主角成长推进 | expect: single-protagonist
- P02 | input: 多角色群像并行推进多条主线 | expect: ensemble-multi-line
- P03 | input: 时间顺序推进，基本无倒叙插叙 | expect: linear-chronological
- P04 | input: 倒叙开场与多时空来回切换 | expect: nonlinear-time
- P05 | input: “我”视角叙述占绝对主导 | expect: first-person
- P06 | input: 第三人称紧贴主角认知信息 | expect: third-limited
- P07 | input: 叙述者可覆盖所有人物心理 | expect: third-omniscient
- P08 | input: 多个 POV 章节交替切换 | expect: multi-pov
- P09 | input: 每卷一个案件，卷末闭环 | expect: case-of-week
- P10 | input: 单一大主线跨越全书持续推进 | expect: long-arc
- P11 | input: 明确第一幕建置、第二幕对抗、第三幕决战 | expect: three-act
- P12 | input: 线程并行推进并在高潮汇合 | expect: multi-thread-weave

## Negative

- N01 | input: 典型群像并线，不是单主角结构 | reject: single-protagonist
- N02 | input: 只跟随一个主角认知，不是群像 | reject: ensemble-multi-line
- N03 | input: 开场倒叙后多次插叙，非线性 | reject: linear-chronological
- N04 | input: 从头到尾顺叙推进，无时序跳转 | reject: nonlinear-time
- N05 | input: 全文第三人称叙述，无“我”视角 | reject: first-person
- N06 | input: 叙述者全知全能，不是限知 | reject: third-limited
- N07 | input: 仅单角色有限视角，不是全知 | reject: third-omniscient
- N08 | input: 单 POV 叙事，无视角切换 | reject: multi-pov
- N09 | input: 只有一条连续主线，不是单元案 | reject: case-of-week
- N10 | input: 每卷独立故事，缺乏长弧主线 | reject: long-arc
- N11 | input: 非幕式自由结构，节拍无三幕划分 | reject: three-act
- N12 | input: 单线推进，无线程编织设计 | reject: multi-thread-weave
