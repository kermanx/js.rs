import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { context } from "./context";

export function* generateMacroInvocation(node: SyntaxNode): Generator<Code> {
  const macro = node.childForFieldName("macro")!;
  if (macro.text === "import") {
    const text = node.text;
    const fromMatch = text.match(/from\s+"([^"]+)"/);
    if (fromMatch) {
      const path = fromMatch[1];
      const namedMatch = text.match(/\{([^}]*)\}/);
      if (namedMatch) {
        for (const part of namedMatch[1].split(",")) {
          const name = part.trim().split(/\s+as\s+/).pop()!.trim();
          if (name)
            context.importedFrom.set(name, path);
        }
      }
    }
    yield [
      node.text.replaceAll(/[!()]/g, " "),
      node.startIndex,
    ];
  }
}
