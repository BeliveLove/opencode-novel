# audience.samples

## Positive

- P01 | input: 强成长线、战力体系、兄弟义气 | expect: male-oriented
- P02 | input: 情感关系驱动、女性视角成长 | expect: female-oriented
- P03 | input: 校园冒险、语言克制、无成人内容 | expect: youth
- P04 | input: 家庭可读、无暴力血腥细节 | expect: all-ages
- P05 | input: 含明确成人描写与限制级桥段 | expect: adult-18-plus
- P06 | input: 章节短平快、轻松可碎片阅读 | expect: light-reading
- P07 | input: 长段心理描写、文学密度高 | expect: hardcore-literary
- P08 | input: 明确日更节奏、章尾追更钩子 | expect: web-serial
- P09 | input: 控制字数与体例，面向实体书出版 | expect: print-market
- P10 | input: 大量圈层梗与同人语境 | expect: fandom-community
- P11 | input: 高频名场面，适合短视频切片 | expect: short-video-friendly
- P12 | input: 剧情结构明显服务影视化改编 | expect: ip-adaptation

## Negative

- N01 | input: 以细腻恋爱为核心，非男性向爽点 | reject: male-oriented
- N02 | input: 硬核军事推演，不以情感关系推进 | reject: female-oriented
- N03 | input: 暴力尺度较大，含成人向内容 | reject: youth
- N04 | input: 大量限制级情节，不适合全年龄 | reject: all-ages
- N05 | input: 亲子共读童话，内容洁净 | reject: adult-18-plus
- N06 | input: 厚重史诗叙事，不适合碎片阅读 | reject: light-reading
- N07 | input: 口语化连载文风，不走文学实验 | reject: hardcore-literary
- N08 | input: 单本完结短篇，无连载设计 | reject: web-serial
- N09 | input: 明显网文日更节奏，非出版体例 | reject: print-market
- N10 | input: 原创世界观，几乎无圈层梗 | reject: fandom-community
- N11 | input: 情节慢热，缺乏切片高光点 | reject: short-video-friendly
- N12 | input: 全文内心流，改编成本高 | reject: ip-adaptation
