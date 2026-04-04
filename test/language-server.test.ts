import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, it } from "vitest";
import { JsrsVirtualCode } from "../packages/language-server/src/virtualCode";

function lineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      starts.push(i + 1);
    }
  }
  return starts;
}

function offsetToLine(offset: number, starts: number[]): number {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= offset) {
      lo = mid + 1;
    }
    else {
      hi = mid - 1;
    }
  }
  return Math.max(0, hi);
}

function buildAnnotatedSnapshot(source: string, generated: string, mappings: any[]): string {
  const sourceText = source.replace(/\r\n/g, "\n");
  const generatedText = generated.replace(/\r\n/g, "\n");

  const sourceLines = sourceText.split("\n");
  const generatedLines = generatedText.split("\n");
  const sourceStarts = lineStarts(sourceText);
  const generatedStarts = lineStarts(generatedText);
  const sourceLinesWithNL = sourceText.split("\n");
  const maxCommentIndent = 40;
  const maxAllowedShift = 10;

  // Fine-grained: map each source line to the earliest generated line reachable
  // by character-level offset mapping.
  const mappedGeneratedBySourceLine = new Map<number, number>();
  const mappedGeneratedColumnBySourceLine = new Map<number, number>();

  for (let s = 0; s < sourceLines.length; s++) {
    const lineStart = sourceStarts[s];
    const lineEndExclusive = s + 1 < sourceStarts.length ? sourceStarts[s + 1] : sourceText.length;

    let bestGeneratedOffset: number | undefined;
    let bestNonWsGeneratedOffset: number | undefined;
    const lineText = sourceLinesWithNL[s] ?? "";
    const nonWs = lineText.search(/\S/);
    const nonWsOffset = nonWs >= 0 ? lineStart + nonWs : undefined;

    for (const mapping of mappings) {
      const sourceOffsets = mapping.sourceOffsets as number[];
      const generatedOffsets = mapping.generatedOffsets as number[];
      const lengths = mapping.lengths as number[];

      for (let i = 0; i < sourceOffsets.length; i++) {
        const sourceOffset = sourceOffsets[i];
        const generatedOffset = generatedOffsets[i];
        const length = lengths[i];
        if (length <= 0)
          continue;

        const sourceEndExclusive = sourceOffset + length;
        const overlapStart = Math.max(lineStart, sourceOffset);
        const overlapEnd = Math.min(lineEndExclusive, sourceEndExclusive);
        if (overlapStart >= overlapEnd)
          continue;

        const delta = overlapStart - sourceOffset;
        const mappedGeneratedOffset = generatedOffset + delta;
        if (bestGeneratedOffset === undefined || mappedGeneratedOffset < bestGeneratedOffset) {
          bestGeneratedOffset = mappedGeneratedOffset;
        }

        if (nonWsOffset !== undefined && nonWsOffset >= sourceOffset && nonWsOffset < sourceEndExclusive) {
          const nonWsMappedGeneratedOffset = generatedOffset + (nonWsOffset - sourceOffset);
          if (bestNonWsGeneratedOffset === undefined || nonWsMappedGeneratedOffset < bestNonWsGeneratedOffset) {
            bestNonWsGeneratedOffset = nonWsMappedGeneratedOffset;
          }
        }
      }
    }

    if (bestGeneratedOffset !== undefined) {
      const line = offsetToLine(bestGeneratedOffset, generatedStarts);
      mappedGeneratedBySourceLine.set(s, Math.min(Math.max(line, 0), generatedLines.length));

      const colOffset = bestNonWsGeneratedOffset ?? bestGeneratedOffset;
      const col = colOffset - generatedStarts[Math.max(0, Math.min(line, generatedStarts.length - 1))];
      mappedGeneratedColumnBySourceLine.set(s, Math.max(0, col));
    }
  }

  // Place unmapped source lines near neighbors (before next mapped line),
  // instead of dumping them at the end.
  const insertionBuckets = new Map<number, number[]>();
  const mappedSourceLines = [...mappedGeneratedBySourceLine.keys()].sort((a, b) => a - b);

  for (let s = 0; s < sourceLines.length; s++) {
    const lineText = sourceLines[s] ?? "";
    if (!lineText.trim())
      continue;

    let insertAt = mappedGeneratedBySourceLine.get(s);
    if (insertAt === undefined) {
      const nextMapped = mappedSourceLines.find(ms => ms > s);
      if (nextMapped !== undefined) {
        insertAt = mappedGeneratedBySourceLine.get(nextMapped)!;
      }
      else {
        insertAt = generatedLines.length;
      }
    }

    const bucket = insertionBuckets.get(insertAt) ?? [];
    bucket.push(s);
    insertionBuckets.set(insertAt, bucket);
  }

  const out: string[] = [];
  for (let g = 0; g < generatedLines.length; g++) {
    const sourceGroup = insertionBuckets.get(g);
    if (sourceGroup) {
      for (const s of sourceGroup) {
        const raw = sourceLines[s] ?? "";
        const trimmed = raw.trimStart();
        if (!trimmed)
          continue;
        const sourceIndent = raw.length - trimmed.length;
        const mappedCol = mappedGeneratedColumnBySourceLine.get(s);
          const chosenIndent = mappedCol === undefined
          ? sourceIndent
          : mappedCol > sourceIndent + maxAllowedShift
              ? sourceIndent
            : Math.max(sourceIndent, mappedCol - 2);
          const indent = " ".repeat(Math.min(maxCommentIndent, Math.max(0, chosenIndent)));
        out.push(`//${indent}${trimmed}`);
      }
    }
    out.push(generatedLines[g]);
  }

  const tailGroup = insertionBuckets.get(generatedLines.length);
  if (tailGroup) {
    for (const s of tailGroup) {
      const raw = sourceLines[s] ?? "";
      const trimmed = raw.trimStart();
      if (!trimmed)
        continue;
      const sourceIndent = raw.length - trimmed.length;
      const mappedCol = mappedGeneratedColumnBySourceLine.get(s);
      const chosenIndent = mappedCol === undefined
        ? sourceIndent
        : mappedCol > sourceIndent + maxAllowedShift
            ? sourceIndent
        : Math.max(sourceIndent, mappedCol - 2);
      const indent = " ".repeat(Math.min(maxCommentIndent, Math.max(0, chosenIndent)));
      out.push(`//${indent}${trimmed}`);
    }
  }

  return `${out.join("\n")}\n`;
}

describe("language-server", () => {
  it("virtual code snapshots", async ({ expect }) => {
    const transpilerFixturesDir = fileURLToPath(new URL("./fixtures", import.meta.url));
    const snapshotsDir = fileURLToPath(new URL("./fixtures", import.meta.url));

    const fixtureFiles = readdirSync(transpilerFixturesDir)
      .filter(file => file.endsWith(".jsrs"))
      .sort((a, b) => a.localeCompare(b));

    for (const fixture of fixtureFiles) {
      const source = readFileSync(join(transpilerFixturesDir, fixture), "utf8");
      const snapshot = ts.ScriptSnapshot.fromString(source);
      const virtualCode = new JsrsVirtualCode(snapshot);
      const embedded = (virtualCode.embeddedCodes.find(code => code.id === "jsrs") ?? virtualCode.embeddedCodes[0]) as any;
      const generated = embedded.snapshot.getText(0, embedded.snapshot.getLength());
      const normalized = generated.replace(/\r\n/g, "\n");
      const withoutPrelude = normalized.replace(/\n*; declare global \{[\s\S]*?\n\};\n\nexport \{\};\s*$/m, "\n");
      const annotated = buildAnnotatedSnapshot(source, withoutPrelude, embedded.mappings ?? []);

      const nonEmptySourceLines = source
        .replace(/\r\n/g, "\n")
        .split("\n")
        .filter(line => line.trim().length > 0);
      for (const line of nonEmptySourceLines) {
        const escaped = line.trimStart().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        await expect(annotated).toMatch(new RegExp(`(^|\\n)//\\s*${escaped}(?=\\n|$)`));
      }
      await expect(annotated).not.toMatch(/(^|\n)\/\/\s*\n/g);

      await expect(annotated).toMatchFileSnapshot(
        join(snapshotsDir, `${basename(fixture, ".jsrs")}.ts`),
      );
    }
  });
});
