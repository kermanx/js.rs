import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";

export function* generateMatch(_node: SyntaxNode): Generator<Code> {
  // TODO:
}

export function* getPatternBindings(node: SyntaxNode): Generator<Code> {
  switch (node.type) {
    case "identifier":
      yield node;
      break;
    case "tuple_struct_pattern":
      for (const child of node.namedChildren.slice(1)) {
        yield* getPatternBindings(child);
      }
      break;
    case "or_pattern": {
      const [left, right] = node.namedChildren;
      const leftBindings = getPatternBindings(left);
      const _rightBindings = getPatternBindings(right);
      // TODO: Check equality of bindings
      yield* leftBindings;
      break;
    }
    case "slice_pattern":
    case "tuple_pattern":
      for (const child of node.namedChildren) {
        yield* getPatternBindings(child);
      }
      break;
    default:
  }
}
