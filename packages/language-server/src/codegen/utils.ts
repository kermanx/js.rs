import type { CodeInformation } from "@volar/language-core";
import type Parser from "tree-sitter";
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
  node: Parser.SyntaxNode,
  left: Parser.SyntaxNode | null,
  right: Parser.SyntaxNode | null,
): Generator<Code> {
  const start = left?.endIndex ?? node.startIndex;
  const end = right?.startIndex ?? node.endIndex;
  yield [
    node.text.slice(start - node.startIndex, end - node.startIndex),
    start,
  ];
}

export function* generateChildren(
  node: Parser.SyntaxNode,
  generate: (node: Parser.SyntaxNode) => Generator<Code>,
): Generator<Code> {
  let prev: Parser.SyntaxNode | null = null;
  for (const child of node.children) {
    yield* between(node, prev, child);
    if (child.isNamed && child.type !== "ERROR") {
      yield* generate(child);
    }
    else {
      yield child;
    }
    prev = child;
  }
  yield* between(node, prev, null);
}
