import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";

export function* generateTypeParameters(node: SyntaxNode): Generator<Code> {
  yield "<";
  for (const child of node.children) {
    if (child.type === ",")
      yield child;
    else
      yield* generateType(child);
  }
  yield ">";
}

export function* generateType(node: SyntaxNode): Generator<Code> {
  switch (node.type) {
    case "type_identifier":
      yield node;
      break;
  }
}
