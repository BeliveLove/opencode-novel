export function yamlQuote(value: string): string {
  // JSON string is valid YAML scalar in practice and handles escaping safely.
  return JSON.stringify(value);
}

export function buildCommandMarkdown(def: {
  description?: string;
  agent?: string;
  argumentHint?: string;
  template: string;
}): string {
  const fm: string[] = ["---"];
  if (def.description) fm.push(`description: ${yamlQuote(def.description)}`);
  if (def.agent) fm.push(`agent: ${yamlQuote(def.agent)}`);
  if (def.argumentHint) fm.push(`argument-hint: ${yamlQuote(def.argumentHint)}`);
  fm.push("---", "");

  return [...fm, def.template.trimEnd(), ""].join("\n");
}

export function buildSkillMarkdown(def: {
  name: string;
  description: string;
  template: string;
}): string {
  return [
    "---",
    `name: ${yamlQuote(def.name)}`,
    `description: ${yamlQuote(def.description)}`,
    "---",
    "",
    def.template.trimEnd(),
    "",
  ].join("\n");
}
