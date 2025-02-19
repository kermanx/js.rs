import type { CodeMapping, VirtualCode } from "@volar/language-core";
import type ts from "typescript";

export class JsrsVirtualCode implements VirtualCode {
  id = "root";
  languageId = "jsrs";
  embeddedCodes: VirtualCode[] = [];
  mappings: CodeMapping[];

  constructor(
    public snapshot: ts.IScriptSnapshot
  ) {
    this.mappings = [{
      sourceOffsets: [0],
      generatedOffsets: [0],
      lengths: [snapshot.getLength()],
      data: {
        completion: true,
        format: true,
        navigation: true,
        semantic: true,
        structure: true,
        verification: true
      }
    }];
  }
}
