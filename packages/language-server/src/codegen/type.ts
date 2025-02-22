import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { generateScopedIdentifier } from ".";

export function* generateTypeParameters(node: SyntaxNode | null): Generator<Code> {
  if (!node)
    return;
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
    case "scoped_type_identifier":
      yield* generateScopedIdentifier(node);
      break;
  }
}
