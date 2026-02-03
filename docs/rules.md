# 一致性规则（novel_continuity_check）

## 时间类

- `CONT_TIME_REVERSE`：同章 `timeline.start > timeline.end`（error）
- `CONT_TIME_PARSE`：日期/时间无法解析（warn）
- `CONT_TIME_OVERLAP_SAME_CHAR`：同一角色在重叠时间出现在不同地点（warn/error）

## 引用类

- `CONT_REF_CHARACTER_UNDEFINED`：章节引用角色不存在（warn/error）
- `CONT_REF_THREAD_UNDEFINED`：章节引用线程不存在（warn）
- `CONT_REF_LOCATION_UNDEFINED`：章节 timeline.location 引用地点不存在（warn）

## 线程类

- `CONT_THREAD_STATUS_MISMATCH`：thread.status 与 closed_in 不一致，或 closed_in 指向不存在章节（warn/error）
- `CONT_THREAD_CLOSE_BEFORE_OPEN`：线程 closed_in 早于 opened_in（error）

## POV（简单策略）

- `CONT_POV_POLICY_VIOLATION`：章节 pov 与全局 styleGuide.pov 不一致（warn/error）

## 世界观条款（静态）

- `CONT_BIBLE_RULE_VIOLATION`：正文引用了不存在的条款编号（info）

