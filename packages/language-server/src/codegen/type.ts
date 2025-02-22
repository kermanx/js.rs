import type Parser from "tree-sitter";
import type { Code } from "../types";

export function* generateTypeParameters(node: Parser.SyntaxNode): Generator<Code> {
  yield "<";
  for (const child of node.children) {
    if (child.type === ",")
      yield child;
    else
      yield* generateType(child);
  }
  yield ">";
}

export function* generateType(node: Parser.SyntaxNode): Generator<Code> {
  switch (node.type) {
    case "type_identifier":
      yield node;
      break;
  }
}
