import type { CodeMapping, IScriptSnapshot } from "@volar/language-core";
import type { Code } from "../types";
import { codeFeatures } from "./codeFeatures";

export function resolveCodes(id: string, languageId: string, generator: Generator<Code>) {
  const mappings: CodeMapping[] = [];

  let text = "";
  for (const code of generator) {
    if (typeof code === "string") {
      text += code;
    }
    else {
      const [source, offset, features] = code;
      const mapping: CodeMapping = {
        sourceOffsets: [offset],
        generatedOffsets: [text.length],
        lengths: [source.length],
        data: features ?? codeFeatures.all,
      };
      mappings.push(mapping);
      text += source;
    }
  }

  const snapshot: IScriptSnapshot = {
    getText: (start, end) => text.slice(start, end),
    getLength: () => text.length,
    getChangeRange: () => void 0,
  };

  const newMappings: CodeMapping[] = [];
  for (let i = 0; i < mappings.length; i++) {
    const mapping = mappings[i];
    if (mapping.data.__combineOffset !== undefined) {
      const offsetMapping = mappings[i - mapping.data.__combineOffset];
      if (typeof offsetMapping === "string" || !offsetMapping) {
        throw new Error(`Invalid offset mapping, mappings: ${mappings.length}, i: ${i}, offset: ${mapping.data.__combineOffset}`);
      }
      offsetMapping.sourceOffsets.push(...mapping.sourceOffsets);
      offsetMapping.generatedOffsets.push(...mapping.generatedOffsets);
      offsetMapping.lengths.push(...mapping.lengths);
      continue;
    }
    newMappings.push(mapping);
  }

  return {
    id,
    languageId,
    snapshot,
    mappings: newMappings,
  };
}
