import { describe, expect, it } from "bun:test";
import path from "node:path";
import { withTempDir, writeFixtureFile } from "../../../test/utils";
import { discoverAllCommands } from "./loader";

describe("slashcommand loader", () => {
  it("loads commands from legacy .opencode/command", async () => {
    await withTempDir(async (rootDir) => {
      const name = `zz-test-cmd-${path.basename(rootDir)}`;

      writeFixtureFile(
        rootDir,
        `.opencode/command/${name}.md`,
        `---
description: "legacy"
---

<command-instruction>
legacy
</command-instruction>
`,
      );

      const commands = discoverAllCommands({ projectRoot: rootDir });
      const cmd = commands.find((c) => c.name === name);
      expect(cmd).toBeTruthy();
      expect(cmd?.scope).toBe("project");
      expect(cmd?.path).toBe(path.join(rootDir, ".opencode", "command", `${name}.md`));
    });
  });

  it("prefers official .opencode/commands over legacy .opencode/command", async () => {
    await withTempDir(async (rootDir) => {
      const name = `zz-test-cmd-${path.basename(rootDir)}`;

      writeFixtureFile(
        rootDir,
        `.opencode/command/${name}.md`,
        `---
description: "legacy"
---

<command-instruction>
legacy
</command-instruction>
`,
      );

      writeFixtureFile(
        rootDir,
        `.opencode/commands/${name}.md`,
        `---
description: "official"
---

<command-instruction>
official
</command-instruction>
`,
      );

      const commands = discoverAllCommands({ projectRoot: rootDir });
      const cmd = commands.find((c) => c.name === name);
      expect(cmd).toBeTruthy();
      expect(cmd?.scope).toBe("project");
      expect(cmd?.metadata.description).toBe("official");
      expect(cmd?.path).toBe(path.join(rootDir, ".opencode", "commands", `${name}.md`));
    });
  });
});
