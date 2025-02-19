import type { Point } from "tree-sitter";
import base_1 from "./base";

export type Segment = string | [string, Point];

export function generateMap(segments: Iterable<Segment[]>, source: string) {
  const mappings: number[][][] = [];
  let newLineIndex = (0, base_1.toString)(segments).indexOf("\n");
  while (newLineIndex >= 0) {
    onLine((0, base_1.overwrite)(segments, [0, newLineIndex + 1]));
    newLineIndex = (0, base_1.toString)(segments).indexOf("\n");
  }
  onLine((0, base_1.overwrite)(segments, [0, (0, base_1.getLength)(segments)]));
  return {
    mappings,
  };
  function onLine(lineSegments: Segment[]) {
    const lineMapping = [];
    let currentColumn = 0;
    let hasCodeMapping = false;
    for (const s of lineSegments) {
      if (typeof s === "string") {
        if (hasCodeMapping) {
          hasCodeMapping = false;
          // we don't break off last mapping for now
        }
        currentColumn += s.length;
      } else {
        hasCodeMapping = true;
        const { row, column } = s[1];
        lineMapping.push([currentColumn, 0, row, column]);
        currentColumn += s[0].length;
      }
    }
    mappings.push(lineMapping);
  }
}
