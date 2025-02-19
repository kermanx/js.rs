import type { CodeMapping, VirtualCode } from "@volar/language-core";
import Parser, { Language } from "tree-sitter";
import Rust from "tree-sitter-rust";
import type ts from "typescript";

let parser: Parser | undefined;

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

    parser ??= new Parser();
    parser.setLanguage(Rust as unknown as Language);

    const content = snapshot.getText(0, snapshot.getLength());
    const tree = parser.parse(content);
    tree;
  }
}
