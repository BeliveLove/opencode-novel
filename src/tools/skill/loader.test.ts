import { describe, expect, it } from "bun:test";
import path from "node:path";
import { withTempDir, writeFixtureFile } from "../../../test/utils";
import { discoverAllSkills } from "./loader";

describe("skill loader", () => {
  it("loads skills from legacy .opencode/skills", async () => {
    await withTempDir(async (rootDir) => {
      const name = `zz-test-skill-${path.basename(rootDir)}`;

      writeFixtureFile(
        rootDir,
        `.opencode/skills/${name}.md`,
        `---
name: "${name}"
description: "legacy"
---

<skill-instruction>
legacy
</skill-instruction>
`,
      );

      const skills = discoverAllSkills({ projectRoot: rootDir });
      const skill = skills.find((s) => s.name === name);
      expect(skill).toBeTruthy();
      expect(skill?.scope).toBe("project");
      expect(skill?.path).toBe(path.join(rootDir, ".opencode", "skills", `${name}.md`));
    });
  });

  it("prefers official .opencode/skill over legacy .opencode/skills", async () => {
    await withTempDir(async (rootDir) => {
      const name = `zz-test-skill-${path.basename(rootDir)}`;

      writeFixtureFile(
        rootDir,
        `.opencode/skills/${name}.md`,
        `---
name: "${name}"
description: "legacy"
---

<skill-instruction>
legacy
</skill-instruction>
`,
      );

      writeFixtureFile(
        rootDir,
        `.opencode/skill/${name}/SKILL.md`,
        `---
name: "${name}"
description: "official"
---

<skill-instruction>
official
</skill-instruction>
`,
      );

      const skills = discoverAllSkills({ projectRoot: rootDir });
      const skill = skills.find((s) => s.name === name);
      expect(skill).toBeTruthy();
      expect(skill?.scope).toBe("project");
      expect(skill?.definition.description).toBe("official");
      expect(skill?.path).toBe(path.join(rootDir, ".opencode", "skill", name, "SKILL.md"));
    });
  });
});
