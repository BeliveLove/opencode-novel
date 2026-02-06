import {
  buildTaxonomyContractMarkdown,
  buildTaxonomyIntegrationMarkdown,
  getTaxonomyReferenceFiles,
} from "./taxonomy";
import { buildSkillMarkdown } from "../../shared/opencode/artifacts";
import type { SkillDefinition } from "./types";

type SkillExtraFile = {
  relativePath: string;
  content: string;
};

export type SkillInstallFile = {
  relativePath: string;
  content: string;
};

export function getBuiltinSkillExtraFiles(skillName: string): SkillExtraFile[] {
  if (skillName !== "taxonomy-registry") {
    return [];
  }
  return getTaxonomyReferenceFiles();
}

export function getBuiltinSkillInstallFiles(definition: SkillDefinition): SkillInstallFile[] {
  const files: SkillInstallFile[] = [
    {
      relativePath: `${definition.name}/SKILL.md`,
      content: buildSkillMarkdown(definition),
    },
  ];
  const extras = getBuiltinSkillExtraFiles(definition.name);
  for (const extra of extras) {
    files.push({
      relativePath: `${definition.name}/${extra.relativePath}`,
      content: extra.content,
    });
  }
  return files;
}

export function getBuiltinTaxonomyDocs(): Array<{ path: string; content: string }> {
  return [
    {
      path: "docs/skills-taxonomy-contract.md",
      content: buildTaxonomyContractMarkdown(),
    },
    {
      path: "docs/skills-taxonomy-integration.md",
      content: buildTaxonomyIntegrationMarkdown(),
    },
  ];
}
