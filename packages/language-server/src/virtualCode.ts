import type { CodeMapping, VirtualCode } from "@volar/language-core";
import type { Language } from "tree-sitter";
import type ts from "typescript";
import Parser from "tree-sitter";
import _Rust from "tree-sitter-rust";
import { generateRoot } from "./codegen";
import { resolveCodes } from "./utils/resolveCodes";

// eslint-disable-next-line ts/no-require-imports
const Rust: Language = typeof _Rust === "string" ? require(_Rust) : _Rust;

let parser: Parser | undefined;

export class JsrsVirtualCode implements VirtualCode {
  id = "root";
  languageId = "jsrs";
  embeddedCodes: VirtualCode[] = [];
  mappings: CodeMapping[];
  tree: Parser.Tree;

  constructor(public snapshot: ts.IScriptSnapshot) {
    this.mappings = [
      {
        sourceOffsets: [0],
        generatedOffsets: [0],
        lengths: [snapshot.getLength()],
        data: {
          completion: true,
          format: true,
          navigation: true,
          semantic: true,
          structure: true,
          verification: true,
        },
      },
    ];

    parser ??= new Parser();
    parser.setLanguage(Rust);

    const content = snapshot.getText(0, snapshot.getLength());
    this.tree = parser.parse(content);

    this.embeddedCodes = [
      resolveCodes("jsrs", "typescript", generateRoot(this.tree.rootNode)),
    ];
  }
}
