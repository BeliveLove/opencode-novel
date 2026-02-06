export const NOVEL_INDEX_TEMPLATE = `目标：生成 INDEX/TIMELINE/THREADS_REPORT（派生文件）。

步骤：
1) 调用 tool: novel_index（writeDerivedFiles=true；默认 scanMode=incremental，会输出 cache hits/misses）
   - 可选：用 scanMode=full 对比全量耗时（用于设定性能 SLA）
2) 输出结果摘要与下一步建议：
   - /novel-continuity-check
   - /novel-foreshadowing-audit`;
