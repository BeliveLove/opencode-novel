import path from "node:path";

export function toPosixPath(path: string): string {
  return path.replaceAll("\\", "/");
}

export function toRelativePosixPath(rootDir: string, absoluteOrRelativePath: string): string {
  const absoluteRoot = path.resolve(rootDir);
  const absoluteTarget = path.resolve(absoluteOrRelativePath);
  const relative = path.relative(absoluteRoot, absoluteTarget);
  return toPosixPath(relative);
}

export function fromRelativePosixPath(rootDir: string, relativePosixPath: string): string {
  const segments = relativePosixPath.split("/").filter(Boolean);
  return path.join(rootDir, ...segments);
}
