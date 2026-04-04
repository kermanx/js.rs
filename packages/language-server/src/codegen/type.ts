import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { generateScopedIdentifier } from ".";
import { codeFeatures } from "../utils/codeFeatures";
import { generateChildren, wrapWith } from "./utils";

export function* generateTypeParameters(node: SyntaxNode | null): Generator<Code> {
  if (!node?.namedChildren.length)
    return;
  yield "<";
  let first = true;
  for (const child of node.namedChildren) {
    if (!first)
      yield ", ";
    first = false;
    if (child.type === "type_parameter") {
      const name = child.childForFieldName("name") ?? child.namedChildren[0];
      if (name) {
        yield name;
      }
      else {
        yield child;
      }
    }
    else {
      yield* generateType(child);
    }
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
    case "primitive_type":
      yield node;
      break;
    case "type_identifier":
    case "null_type":
    case "undefined_type":
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
    case "array_type":
      yield* generateArrayType(node);
      break;
    case "union_type":
      yield* generateUnionType(node);
      break;
    case "never_type":
      yield "never";
      break;
    case "unit_type":
      yield "void";
      break;
    case "tuple_type":
      yield* generateTupleType(node);
      break;
    default:
      // Fallback to avoid dropping type text in snapshots when new node kinds appear.
      yield node;
  }
}

function* generateUnionType(node: SyntaxNode): Generator<Code> {
  const left = node.childForFieldName("left")!;
  const right = node.childForFieldName("right")!;
  yield* generateType(left);
  yield " | ";
  yield* generateType(right);
}

function* generateTupleType(node: SyntaxNode): Generator<Code> {
  yield "[";
  let first = true;
  for (const child of node.namedChildren) {
    if (!first) {
      yield ", ";
    }
    first = false;
    yield* generateType(child);
  }
  yield "]";
}

function* generateArrayType(node: SyntaxNode): Generator<Code> {
  const element = node.childForFieldName("element");
  yield "Array<";
  if (element) {
    yield* generateType(element);
  }
  else {
    yield "unknown";
  }
  yield ">";
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
