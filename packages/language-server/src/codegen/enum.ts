import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { context } from "./context";
import { escapeCtorName } from "./escaping";
import { generateFieldDeclarationList } from "./struct";
import { generateType, generateTypeParameters } from "./type";

export function* generateEnum(node: SyntaxNode): Generator<Code> {
  const exporting = node.namedChildren[0]?.type === "visibility_modifier" ? "export " : "";
  const name = node.childForFieldName("name")!;
  const typeParameters = node.childForFieldName("type_parameters");
  const body = node.childForFieldName("body")!;

  if (exporting)
    context.exportingTypes.add(name.text);

  const symbolName = `__JSRS_${name.text}_Symbol`;
  yield `const ${symbolName} = Symbol();\n`;

  const enumType = [
    name,
    ...generateTypeParameters(typeParameters),
  ];

  yield `${exporting}interface `;
  yield* enumType;
  yield ` { [${symbolName}]: typeof ${symbolName} }\n`;

  const ctorName = escapeCtorName(name.text);
  yield `${exporting}interface ${ctorName}`;
  if (typeParameters)
    yield* generateTypeParameters(typeParameters);
  yield ` {\n`;
  if (body) {
    for (const child of body.namedChildren) {
      if (child.type === "enum_variant") {
        yield* generateEnumVariant(child, enumType);
      }
    }
  }
  yield `}\n`;
  yield `${exporting}var `;
  yield name;
  yield `!: ${ctorName}\n`;
}

function* generateEnumVariant(node: SyntaxNode, enumType: Code[]): Generator <Code> {
  if (node.type === "enum_variant") {
    const name = node.childForFieldName("name")!;
    const body = node.childForFieldName("body");

    yield `  `;
    yield name;
    if (body) {
      yield "(";
      if (body.type === "ordered_field_declaration_list") {
        let index = 0;
        for (const type of body.childrenForFieldName("type")) {
          yield `_${index++}: `;
          yield* generateType(type);
          yield ",";
        }
      }
      else if (body.type === "field_declaration_list") {
        yield `_: `;
        yield* generateFieldDeclarationList(body);
      }
      yield `)`;
    }
    yield `: `;
    yield* enumType;
    yield `;\n`;
  }
}
