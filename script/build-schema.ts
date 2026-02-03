#!/usr/bin/env bun
import * as z from "zod";
import { NovelConfigSchema } from "../src/config/schema";

const SCHEMA_OUTPUT_PATH = "dist/novel.schema.json";

async function main() {
  console.log("Generating JSON Schema...");

  const jsonSchema = z.toJSONSchema(NovelConfigSchema, {
    io: "input",
    target: "draft-7",
  });

  const finalSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://opencode.ai/schema/opencode-novel.schema.json",
    title: "OpenCode Novel Configuration",
    description: "Configuration schema for opencode-novel plugin",
    ...jsonSchema,
  };

  await Bun.write(SCHEMA_OUTPUT_PATH, `${JSON.stringify(finalSchema, null, 2)}\n`);
  console.log(`OK: JSON Schema generated: ${SCHEMA_OUTPUT_PATH}`);
}

main();
