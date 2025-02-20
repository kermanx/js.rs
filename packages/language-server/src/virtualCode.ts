import type { CodeMapping, VirtualCode } from "@volar/language-core";
import type { Language, Tree } from "tree-sitter";
import type ts from "typescript";
import type { Position } from "vscode-languageserver-textdocument";
import Parser from "tree-sitter";
import _Rust from "tree-sitter-rust";
import { TextDocument } from "vscode-languageserver-textdocument";
import { generateRoot } from "./codegen";
import { resolveCodes } from "./utils/resolveCodes";

let parser: Parser | undefined;
function getRustParser() {
  if (!parser) {
    // eslint-disable-next-line ts/no-require-imports
    const Rust: Language = typeof _Rust === "string" ? require(_Rust) : _Rust;
    parser = new Parser();
    parser.setLanguage(Rust);
  }
  return parser;
}

export class JsrsVirtualCode implements VirtualCode {
  id = "root";
  languageId = "jsrs";
  embeddedCodes!: VirtualCode[];
  snapshot: ts.IScriptSnapshot;
  mappings: CodeMapping[];
  tree: Tree;
  document: TextDocument;

  constructor(snapshot: ts.IScriptSnapshot) {
    this.snapshot = snapshot;
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

    const content = snapshot.getText(0, snapshot.getLength());
    this.tree = getRustParser().parse(content);
    this.document = TextDocument.create("file://temp.jsrs", "jsrs", 0, content);
    this.updateEmbeddedCodes();
  }

  update(newSnapshot: ts.IScriptSnapshot) {
    const newContent = newSnapshot.getText(0, newSnapshot.getLength());
    const changeRange = newSnapshot.getChangeRange(this.snapshot);
    this.snapshot = newSnapshot;
    if (changeRange) {
      const newDocument = TextDocument.create("file://temp.jsrs", "jsrs", 0, newContent);
      this.tree.edit({
        startIndex: changeRange.span.start,
        oldEndIndex: changeRange.span.start + changeRange.span.length,
        newEndIndex: changeRange.span.start + changeRange.newLength,
        startPosition: positionToPoint(this.document.positionAt(changeRange.span.start)),
        oldEndPosition: positionToPoint(this.document.positionAt(changeRange.span.start + changeRange.span.length)),
        newEndPosition: positionToPoint(newDocument.positionAt(changeRange.span.start + changeRange.newLength)),
      });
      this.tree = getRustParser().parse(newContent, this.tree);
      this.document = newDocument;
    }
    else {
      // Cannot be incrementally updated, just recreate the tree
      this.tree = getRustParser().parse(newContent);
      this.document = TextDocument.create("file://temp.jsrs", "jsrs", 0, newContent);
    }
    this.updateEmbeddedCodes();
  }

  updateEmbeddedCodes() {
    this.embeddedCodes = [
      resolveCodes("jsrs", "typescript", generateRoot(this.tree.rootNode)),
    ];
  }
}

function positionToPoint(position: Position) {
  return { row: position.line, column: position.character };
}
