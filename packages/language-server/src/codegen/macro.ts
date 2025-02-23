import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";

export function* generateMacroInvocation(node: SyntaxNode): Generator<Code> {
  const macro = node.childForFieldName("macro")!;
  if (macro.text === "import") {
    yield [
      node.text.replaceAll(/[!()]/g, " "),
      node.startIndex,
    ];
  }
}
