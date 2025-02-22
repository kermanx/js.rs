import type { CodeInformation } from "@volar/language-core";
import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";

export function wrapWith(
  start: number,
  end: number,
  features: CodeInformation,
  ...codes: Code[]
): Generator<Code>;
export function wrapWith(
  start: number,
  end: number,
  features: CodeInformation,
  codes: () => Iterable<Code>
): Generator<Code>;
export function* wrapWith(
  start: number,
  end: number,
  features: CodeInformation,
  ...codes: Code[] | [() => Iterable<Code>]
): Generator<Code> {
  yield [``, start, features];
  let offset = 1;

  let normalized: Iterable<Code>;
  if (codes.length === 1 && typeof codes[0] === "function") {
    normalized = codes[0]();
  }
  else {
    normalized = codes as Code[];
  }

  for (const code of normalized) {
    if (typeof code !== "string") {
      offset++;
    }
    yield code;
  }
  yield [``, end, { __combineOffset: offset }];
}

export function* between(
  node: SyntaxNode,
  left: SyntaxNode | null,
  right: SyntaxNode | null,
): Generator<Code> {
  const start = left?.endIndex ?? node.startIndex;
  const end = right?.startIndex ?? node.endIndex;
  yield [
    node.text.slice(start - node.startIndex, end - node.startIndex),
    start,
  ];
}

export function* generateChildren(
  node: SyntaxNode,
  mapNamed: (node: SyntaxNode, index: number, array: SyntaxNode[]) => Iterable<Code>,
  mapUnnamed: (node: SyntaxNode) => Code = node => node,
): Generator<Code> {
  let prev: SyntaxNode | null = null;
  for (let i = 0; i < node.namedChildren.length; i++) {
    const child = node.namedChildren[i];
    yield* between(node, prev, child);
    if (child.isNamed && child.type !== "ERROR") {
      yield* mapNamed(child, i, node.namedChildren);
    }
    else {
      yield mapUnnamed(node);
    }
    prev = child;
  }
  yield* between(node, prev, null);
}
