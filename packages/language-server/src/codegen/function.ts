import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { generateBlock, generateExpression, generateIdentifier, generatePattern, generateSelf } from ".";
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
      const modifiers = node.namedChildren.find(c => c.type === "function_modifiers");
      if (modifiers?.text.includes("async")) {
        yield `async `;
      }
      yield `function `;
    }

    const name = node.childForFieldName("name")!;
    yield* generateIdentifier(name);

    const typeParams = node.childForFieldName("type_parameters");
    yield* generateTypeParameters(typeParams);
  }

  const parameters = node.childForFieldName("parameters")!;
  if (kind === FunctionKind.Closure) {
    yield "(";
    let first = true;
    for (const child of parameters.namedChildren) {
      if (!first)
        yield ", ";
      first = false;
      yield* generateParameter(child, selfType);
    }
    yield ")";
  }
  else {
    yield* generateChildren(parameters, child => generateParameter(child, selfType));
  }

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

  yield* generatePattern(pattern);
  yield* between(node, pattern, type);
  if (type) {
    yield* generateType(type);
  }
}
