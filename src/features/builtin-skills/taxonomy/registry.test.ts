import { describe, expect, it } from "bun:test";
import { getBuiltinSkillInstallFiles } from "../artifacts";
import { loadBuiltinSkills } from "../skills";
import { getTaxonomyReferenceFiles } from "./references";
import { TAXONOMY_REGISTRY_V1 } from "./registry";
import type { TaxonomyDomain } from "./types";

const DOMAINS: TaxonomyDomain[] = ["genre", "trope", "audience", "emotion", "structure", "market"];

describe("taxonomy registry", () => {
  it("keeps labels structurally valid and conflict IDs resolvable", () => {
    for (const domain of DOMAINS) {
      const labels = TAXONOMY_REGISTRY_V1.domains[domain];
      const ids = labels.map((label) => label.id);
      const idSet = new Set(ids);
      expect(idSet.size).toBe(ids.length);

      for (const label of labels) {
        expect(label.id.length).toBeGreaterThan(0);
        expect(label.name.length).toBeGreaterThan(0);
        expect(Array.isArray(label.aliases)).toBeTrue();
        expect(label.status === "active" || label.status === "deprecated").toBeTrue();

        if (label.parentId !== null) {
          expect(idSet.has(label.parentId)).toBeTrue();
        }

        for (const conflictId of label.conflicts) {
          expect(idSet.has(conflictId)).toBeTrue();
        }
      }
    }
  });

  it("exposes four reference markdown files", () => {
    const refs = getTaxonomyReferenceFiles();
    expect(refs.length).toBe(4);
    const paths = refs.map((item) => item.relativePath);
    expect(paths).toContain("references/taxonomy-v1.md");
    expect(paths).toContain("references/aliases-v1.md");
    expect(paths).toContain("references/conflicts-v1.md");
    expect(paths).toContain("references/changelog.md");
    expect(refs[0].content).toContain(TAXONOMY_REGISTRY_V1.version);
  });
});

describe("taxonomy skill install files", () => {
  it("installs taxonomy-registry with references bundle", () => {
    const skills = loadBuiltinSkills();
    const taxonomy = skills["taxonomy-registry"];
    const installFiles = getBuiltinSkillInstallFiles(taxonomy);
    const outputPaths = installFiles.map((file) => file.relativePath);

    expect(outputPaths).toContain("taxonomy-registry/SKILL.md");
    expect(outputPaths).toContain("taxonomy-registry/references/taxonomy-v1.md");
    expect(outputPaths).toContain("taxonomy-registry/references/aliases-v1.md");
    expect(outputPaths).toContain("taxonomy-registry/references/conflicts-v1.md");
    expect(outputPaths).toContain("taxonomy-registry/references/changelog.md");
  });
});
