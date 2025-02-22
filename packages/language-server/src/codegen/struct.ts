import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { generateExpression } from ".";
import { escapeCtorName, escapeDataName } from "./escaping";
import { generateType, generateTypeParameters } from "./type";
import { generateChildren } from "./utils";

export function* generateStruct(node: SyntaxNode): Generator<Code> {
  const name = node.childForFieldName("name")!;
  const typeParameters = node.childForFieldName("type_parameters");
  const body = node.childForFieldName("body");

  const ctorName = escapeCtorName(name.text);
  const dataName = escapeDataName(name.text);

  yield `interface ${ctorName} { (_: ${dataName}): ${name.text}; }\n`;
  yield `var ${name.text}!: ${ctorName};\n`;

  yield `interface `;
  yield dataName;
  yield* generateTypeParameters(typeParameters);
  if (body)
    yield* generateFieldDeclarationList(body);
  else
    yield `{}`;

  yield `\ninterface `;
  yield name;
  yield ` extends ${dataName} {}\n`;
}

export function* generateFieldDeclarationList(node: SyntaxNode): Generator<Code> {
  yield* generateChildren(node, function* (child) {
    if (child.type === "field_declaration") {
      const name = child.childForFieldName("name")!;
      const type = child.childForFieldName("type");

      yield name;
      yield `: `;

      if (type)
        yield* generateType(type);
    }
  });
}

export function* generateStructExpression(node: SyntaxNode): Generator<Code> {
  const name = node.childForFieldName("name")!;
  const body = node.childForFieldName("body")!;

  yield* generateType(name);
  yield "(";
  yield* generateChildren(body, function* (child) {
    if (child.type === "field_initializer") {
      const field = child.childForFieldName("field")!;
      const value = child.childForFieldName("value");

      yield field;
      yield `: `;

      if (value)
        yield* generateExpression(value);
    }
  });
  yield ")";
}
