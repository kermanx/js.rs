import type { Point, SyntaxNode } from "tree-sitter";
// @ts-expect-error
import { encode } from "vlq";

export type Segment = string | [string, Point] | SyntaxNode;

export function generateMap(segments: Iterable<Segment>) {
  let code = "";
  let mappings = "";
  let genColumn = 0;
  let lastGenColumn: number | null = null;
  let lastSrcLine = 0;
  let lastSrcColumn = 0;

  for (const segmentOrNode of segments) {
    const segment = typeof segmentOrNode === "string" || Array.isArray(segmentOrNode)
      ? segmentOrNode
      : [
          segmentOrNode.text,
          segmentOrNode.startPosition,
        ] as const;
    const s = typeof segment === "string" ? segment : segment[0];
    code += s;

    const lines = s.split("\n");
    const newGenLines = lines.length - 1;

    if (typeof segment !== "string") {
      if (lastGenColumn !== null) {
        mappings += ",";
      }

      mappings += encode([
        genColumn - (lastGenColumn ?? 0),
        0,
        segment[1].row - lastSrcLine,
        segment[1].column - lastSrcColumn,
      ]);

      lastSrcLine = segment[1].row;
      lastSrcColumn = segment[1].column;
      lastGenColumn = genColumn;
    }

    if (newGenLines > 0) {
      mappings += ";".repeat(newGenLines);
      genColumn = lines[lines.length - 1].length;
      lastGenColumn = null;
    }
    else {
      genColumn += s.length;
    }
  }

  return {
    code,
    mappings,
  };
}
