import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type CommandResult = {
  code: number;
  stdout: string;
  stderr: string;
};

/** 执行 git 命令并返回标准化结果。 */
function runGitCommand(args: string[]): CommandResult {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
  return {
    code: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/** 读取 package.json 中的版本号。 */
function readPackageVersion(): string {
  const packagePath = resolve("package.json");
  const raw = readFileSync(packagePath, "utf8");
  const data = JSON.parse(raw) as { version?: unknown };
  if (typeof data.version !== "string" || data.version.trim().length === 0) {
    throw new Error("package.json 缺少有效 version 字段。");
  }
  return data.version.trim();
}

/** 将 tag 规范化为可比较的 semver 版本（去掉可选 v 前缀）。 */
function normalizeSemverTag(tag: string): string | null {
  const trimmed = tag.trim();
  const match = /^(?:v)?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/.exec(trimmed);
  if (!match) return null;
  return match[1];
}

/** 获取按版本倒序排序后的 tag 列表。 */
function readTagsSortedByVersionDesc(): string[] {
  const result = runGitCommand(["tag", "--list", "--sort=-v:refname"]);
  if (result.code !== 0) {
    throw new Error(`读取 git tag 失败：${result.stderr.trim() || "unknown error"}`);
  }
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** 选取最新的 semver tag（支持 v 前缀）。 */
function findLatestSemverTag(tags: string[]): {
  raw: string;
  normalized: string;
} | null {
  for (const tag of tags) {
    const normalized = normalizeSemverTag(tag);
    if (!normalized) continue;
    return { raw: tag, normalized };
  }
  return null;
}

/** 根据最新 tag 风格推导建议 tag（保留 v 前缀习惯）。 */
function buildExpectedTagFromStyle(packageVersion: string, latestRawTag: string): string {
  return latestRawTag.startsWith("v") ? `v${packageVersion}` : packageVersion;
}

/** 执行校验：最新 semver tag 必须与 package.json version 一致。 */
function main() {
  if (process.env.SKIP_TAG_VERSION_CHECK === "1") {
    console.log("[check-tag-version] skipped by SKIP_TAG_VERSION_CHECK=1");
    return;
  }

  const packageVersion = readPackageVersion();
  const tags = readTagsSortedByVersionDesc();
  const latestTag = findLatestSemverTag(tags);

  if (!latestTag) {
    console.error("[check-tag-version] 未找到可用的 semver tag（如 v1.2.3 或 1.2.3）。");
    console.error(
      `[check-tag-version] 请先创建与 package.json version 对应的 tag，例如：git tag v${packageVersion}`,
    );
    process.exit(1);
  }

  if (latestTag.normalized !== packageVersion) {
    const expectedTag = buildExpectedTagFromStyle(packageVersion, latestTag.raw);
    console.error(
      `[check-tag-version] 版本不一致：latestTag=${latestTag.raw} (${latestTag.normalized})，package.json=${packageVersion}`,
    );
    console.error(`[check-tag-version] 期望最新 tag 为：${expectedTag}`);
    console.error(
      `[check-tag-version] 可执行：git tag -f ${expectedTag} && git push --follow-tags（或 git push --tags）`,
    );
    process.exit(1);
  }

  console.log(
    `[check-tag-version] pass (latestTag=${latestTag.raw}, packageVersion=${packageVersion})`,
  );
}

main();
