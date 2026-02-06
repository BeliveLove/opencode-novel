import {
  buildTaxonomyContractMarkdown,
  buildTaxonomyIntegrationMarkdown,
  getTaxonomyReferenceFiles,
} from "./taxonomy";

type SkillExtraFile = {
  relativePath: string;
  content: string;
};

export function getBuiltinSkillExtraFiles(skillName: string): SkillExtraFile[] {
  if (skillName !== "taxonomy-registry") {
    return [];
  }
  return getTaxonomyReferenceFiles();
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
