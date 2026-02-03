import { hash8 } from "../hashing/hash8";

export function slugify(input: string): string {
  const trimmed = input.trim();
  const collapsed = trimmed.replace(/\s+/g, "-");
  const stripped = collapsed
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return stripped.length > 0 ? stripped : hash8(input);
}
