import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import ts from "typescript";

type RuleCode = "METHOD_TOO_LONG" | "MISSING_DOC_COMMENT";

type RuleViolation = {
  code: RuleCode;
  file: string;
  line: number;
  name: string;
  kind: string;
  details: string;
  key: string;
};

type RuleBaseline = {
  version: 1;
  generatedAt: string;
  violations: string[];
};

const MAX_METHOD_LINES = 500;
const SOURCE_ROOT = resolve("src");
const BASELINE_PATH = resolve("script/code-rules-baseline.json");

function walkSourceFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkSourceFiles(abs));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
    if (entry.name.endsWith(".test.ts")) continue;
    files.push(abs);
  }
  return files;
}

function hasJsDocComment(sourceFile: ts.SourceFile, node: ts.Node): boolean {
  const comments = ts.getLeadingCommentRanges(sourceFile.text, node.pos) ?? [];
  return comments.some((comment) =>
    sourceFile.text.slice(comment.pos, comment.end).startsWith("/**"),
  );
}

function normalizeNodeName(node: ts.FunctionLikeDeclarationBase): string {
  if ("name" in node && node.name) {
    if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) {
      return node.name.text;
    }
  }
  if (ts.isConstructorDeclaration(node)) return "constructor";
  return "(anonymous)";
}

function functionLikeKind(node: ts.FunctionLikeDeclarationBase): string {
  if (ts.isFunctionDeclaration(node)) return "FunctionDeclaration";
  if (ts.isMethodDeclaration(node)) return "MethodDeclaration";
  if (ts.isConstructorDeclaration(node)) return "ConstructorDeclaration";
  if (ts.isGetAccessorDeclaration(node)) return "GetAccessorDeclaration";
  if (ts.isSetAccessorDeclaration(node)) return "SetAccessorDeclaration";
  return "FunctionLike";
}

function buildViolationKey(options: {
  code: RuleCode;
  file: string;
  line: number;
  name: string;
  kind: string;
}): string {
  return `${options.code}|${options.file}|${options.kind}|${options.name}|${options.line}`;
}

function collectViolations(file: string): RuleViolation[] {
  const content = readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
  const relativeFile = relative(process.cwd(), file).replaceAll("\\", "/");
  const violations: RuleViolation[] = [];

  const visit = (node: ts.Node) => {
    if (
      (ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isConstructorDeclaration(node) ||
        ts.isGetAccessorDeclaration(node) ||
        ts.isSetAccessorDeclaration(node)) &&
      node.body
    ) {
      const startLine =
        sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
      const endLine = sourceFile.getLineAndCharacterOfPosition(node.body.getEnd()).line + 1;
      const lineCount = endLine - startLine + 1;
      const name = normalizeNodeName(node);
      const kind = functionLikeKind(node);

      if (lineCount > MAX_METHOD_LINES) {
        const key = buildViolationKey({
          code: "METHOD_TOO_LONG",
          file: relativeFile,
          line: startLine,
          name,
          kind,
        });
        violations.push({
          code: "METHOD_TOO_LONG",
          file: relativeFile,
          line: startLine,
          name,
          kind,
          details: `method has ${lineCount} lines (> ${MAX_METHOD_LINES})`,
          key,
        });
      }

      if (!hasJsDocComment(sourceFile, node)) {
        const key = buildViolationKey({
          code: "MISSING_DOC_COMMENT",
          file: relativeFile,
          line: startLine,
          name,
          kind,
        });
        violations.push({
          code: "MISSING_DOC_COMMENT",
          file: relativeFile,
          line: startLine,
          name,
          kind,
          details: "missing JSDoc comment (`/** ... */`) before declaration",
          key,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return violations;
}

function readBaseline(): RuleBaseline {
  try {
    const raw = readFileSync(BASELINE_PATH, "utf8");
    const parsed = JSON.parse(raw) as RuleBaseline;
    if (parsed.version !== 1 || !Array.isArray(parsed.violations)) {
      throw new Error("Invalid baseline structure");
    }
    return parsed;
  } catch {
    return { version: 1, generatedAt: "", violations: [] };
  }
}

function writeBaseline(violations: RuleViolation[]) {
  const unique = Array.from(new Set(violations.map((violation) => violation.key))).sort((a, b) =>
    a.localeCompare(b),
  );
  const baseline: RuleBaseline = {
    version: 1,
    generatedAt: new Date().toISOString(),
    violations: unique,
  };
  writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
}

function printViolations(title: string, violations: RuleViolation[]) {
  console.error(title);
  for (const violation of violations) {
    console.error(
      `- ${violation.code} ${violation.file}:${violation.line} ${violation.kind} ${violation.name} -> ${violation.details}`,
    );
  }
}

function main() {
  const shouldUpdateBaseline = Bun.argv.includes("--update-baseline");
  const sourceFiles = walkSourceFiles(SOURCE_ROOT);
  const violations = sourceFiles.flatMap((file) => collectViolations(file));

  if (shouldUpdateBaseline) {
    writeBaseline(violations);
    console.log(
      `[check-code-rules] baseline updated: ${relative(process.cwd(), BASELINE_PATH)} (count=${violations.length})`,
    );
    return;
  }

  const baseline = readBaseline();
  const baselineSet = new Set(baseline.violations);
  const unresolved = violations.filter((violation) => !baselineSet.has(violation.key));

  if (unresolved.length > 0) {
    printViolations("[check-code-rules] New rule violations detected:", unresolved);
    console.error(
      `[check-code-rules] If intentional, run: bun run script/check-code-rules.ts --update-baseline`,
    );
    process.exit(1);
  }

  const violationsSet = new Set(violations.map((violation) => violation.key));
  const staleBaseline = baseline.violations.filter((key) => !violationsSet.has(key));
  if (staleBaseline.length > 0) {
    console.log(
      `[check-code-rules] note: ${staleBaseline.length} stale baseline entries can be cleaned with --update-baseline.`,
    );
  }

  console.log(
    `[check-code-rules] pass (files=${sourceFiles.length}, violations=${violations.length}, baseline=${baseline.violations.length})`,
  );
}

main();
