import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { generateScopedIdentifier } from ".";
import { codeFeatures } from "../utils/codeFeatures";
import { generateChildren, wrapWith } from "./utils";

export function* generateTypeParameters(node: SyntaxNode | null): Generator<Code> {
  if (!node?.namedChildren.length)
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

export function getTypeParamPlaceholders(node: SyntaxNode | null): string {
  if (!node?.namedChildren.length)
    return "";
  return `<${node.namedChildren.map((param) => {
    // FIXME: complex param
    return param.text;
  }).join(", ")}>`;
}

export function* generateType(node: SyntaxNode): Generator<Code> {
  switch (node.type) {
    case "type_identifier":
      yield node;
      break;
    case "scoped_type_identifier":
      yield* generateScopedIdentifier(node);
      break;
    case "generic_type":
      yield* generateGenericType(node);
      break;
    case "lifetime":
      yield* generateLifetime(node);
      break;
    case "reference_type":
      yield* generateReferenceType(node);
      break;
  }
}

function* generateGenericType(node: SyntaxNode): Generator<Code> {
  const type = node.childForFieldName("type")!;
  const args = node.childForFieldName("type_arguments")!;

  yield* generateType(type);
  yield* generateChildren(args, generateType);
}

function* generateLifetime(node: SyntaxNode): Generator<Code> {
  yield* wrapWith(
    node.startIndex,
    node.endIndex,
    codeFeatures.verification,
    `__JSRS_lifetime_${node.namedChildren[0].text}`,
  );
}

function* generateReferenceType(node: SyntaxNode): Generator<Code> {
  const isMut = node.descendantsOfType("mutable_specifier").length > 0;
  const type = node.childForFieldName("type")!;
  yield isMut ? "__JSRS_MutRef<" : "__JSRS_Ref<";
  yield* generateType(type);
  yield ">";
}
