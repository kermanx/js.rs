import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { generateBlock, generateExpression, generateIdentifier, generateSelf } from ".";
import { generateType } from "./type";
import { between, generateChildren } from "./utils";

export enum FunctionKind {
  Declaration,
  Closure,
  // inside impl block
  Implementation,
}

export function* generateFunction(
  node: SyntaxNode,
  kind: FunctionKind,
  selfType?: SyntaxNode,
): Generator<Code> {
  if (kind === FunctionKind.Declaration && node.namedChildren[0]?.type === "visibility_modifier") {
    yield `export `;
  }

  if (kind !== FunctionKind.Closure) {
    yield `function `;
    const name = node.childForFieldName("name")!;
    yield* generateIdentifier(name);
  }

  const parameters = node.childForFieldName("parameters")!;
  yield* generateChildren(parameters, child => generateParameter(child, selfType));

  const type = node.childForFieldName("return_type");
  if (type) {
    yield `: `;
    yield type;
  }

  if (kind === FunctionKind.Closure) {
    yield ` =>`;
  }
  yield ` `;

  const body = node.childForFieldName("body")!;
  if (body.type === "block") {
    yield* generateBlock(body, true);
  }
  else {
    yield* generateExpression(body);
  }
}

function* generateParameter(node: SyntaxNode, selfType: SyntaxNode | undefined): Generator<Code> {
  if (node.type === "self_parameter") {
    yield* generateSelf(node.namedChildren[0]);
    yield ":";
    if (selfType)
      yield* generateType(selfType);
    else
      yield "unknown";
    return;
  }

  if (node.type === "identifier" || node.type === "type_identifier") {
    yield* generateIdentifier(node);
    return;
  }

  const pattern = node.childForFieldName("pattern")!;
  const type = node.childForFieldName("type");

  yield pattern;
  yield* between(node, pattern, type);
  if (type) {
    yield type;
  }
}
