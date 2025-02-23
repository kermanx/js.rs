import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { generateBlock, generateExpression, generateIdentifier, generateSelf } from ".";
import { context } from "./context";
import { generateType, generateTypeParameters } from "./type";
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
  if (kind !== FunctionKind.Closure) {
    if (kind === FunctionKind.Declaration) {
      if (node.namedChildren[0]?.type === "visibility_modifier") {
        yield `export `;
      }
      yield `function `;
    }

    const name = node.childForFieldName("name")!;
    yield* generateIdentifier(name);

    const typeParams = node.childForFieldName("type_parameters");
    yield* generateTypeParameters(typeParams);
  }

  const parameters = node.childForFieldName("parameters")!;
  yield* generateChildren(parameters, child => generateParameter(child, selfType));

  const type = node.childForFieldName("return_type");
  if (type) {
    const typeCode = [...generateType(type)];
    yield `: `;
    yield* typeCode;
    context.returnType.push(typeCode);
  }
  else {
    context.returnType.push(null);
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
    yield* generateType(type);
  }
}
