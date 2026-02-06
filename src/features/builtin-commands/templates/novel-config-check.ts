export const NOVEL_CONFIG_CHECK_TEMPLATE = `目标：检查配置来源合并结果并输出结构化诊断。
步骤：
1) 调用 tool: novel_config_check（rootDir=当前项目）。
2) 若存在错误，按 source/path/message 修复配置后重试。
3) 配置通过后再继续执行 /novel-index 与 /novel-export。`;
