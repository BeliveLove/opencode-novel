# emotion.samples

## Positive

- P01 | input: 连续逆袭胜利、战斗情绪高涨 | expect: hot-blooded
- P02 | input: 邻里温情、互相救赎、结尾温暖 | expect: healing-warm
- P03 | input: 末世绝境、牺牲与压抑氛围 | expect: dark-depressive
- P04 | input: 每章结尾留悬念，阅读持续紧绷 | expect: suspense-tense
- P05 | input: 误会喜剧与轻松对白密集 | expect: comedy-light
- P06 | input: 宿命悲剧收束，主要角色陨落 | expect: tragic-fate
- P07 | input: 双向奔赴、甜宠互动、高糖场景 | expect: romance-sweet
- P08 | input: 反复错过与情感拉扯，虐点突出 | expect: romance-angst
- P09 | input: 国家命运叙事，宏大群像推进 | expect: epic-majestic
- P10 | input: 日常琐事推进，低冲突平和 | expect: slice-calm
- P11 | input: 高速逃亡与倒计时，肾上腺素飙升 | expect: adrenaline
- P12 | input: 老照片与旧城回忆，情绪含蓄忧伤 | expect: nostalgic-melancholy

## Negative

- N01 | input: 细水长流生活片段，非高燃对抗 | reject: hot-blooded
- N02 | input: 黑暗权谋连环背叛，缺少治愈落点 | reject: healing-warm
- N03 | input: 轻喜剧团宠叙事，无压抑基调 | reject: dark-depressive
- N04 | input: 抒情散文式推进，几乎无悬念 | reject: suspense-tense
- N05 | input: 全篇悲剧压抑，无轻松桥段 | reject: comedy-light
- N06 | input: HE 大团圆收尾，不走悲剧宿命 | reject: tragic-fate
- N07 | input: 主要情绪为虐恋纠葛，不是甜宠 | reject: romance-sweet
- N08 | input: 治愈恋爱日常，无重度情感撕扯 | reject: romance-angst
- N09 | input: 小镇家庭故事，不是史诗格局 | reject: epic-majestic
- N10 | input: 高密度战斗与追逃，非平和日常 | reject: slice-calm
- N11 | input: 慢节奏心理描写，缺少高压刺激 | reject: adrenaline
- N12 | input: 爽文快节奏，不走怀旧惆怅路线 | reject: nostalgic-melancholy
