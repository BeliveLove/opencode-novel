export function renderMermaidGraphTd(options: { title: string; nodes: string[]; edges: string[] }): string {
  const header = "<!-- novel:derived v1; DO NOT EDIT BY HAND -->"
  return [
    header,
    "",
    `%% ${options.title}`,
    "graph TD",
    ...options.nodes.map((n) => `  ${n}`),
    ...options.edges.map((e) => `  ${e}`),
    "",
  ].join("\n")
}

