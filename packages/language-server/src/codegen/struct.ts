import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { escapeCtorName } from "./escaping";
import { generateTypeParameters } from "./type";

export function* generateStruct(node: SyntaxNode): Generator<Code> {
  const name = node.childForFieldName("name")!;
  const typeParameters = node.childForFieldName("type_parameters");
  const body = node.childForFieldName("body");

  const ctorName = escapeCtorName(name.text);
  yield `interface ${ctorName} { new(): ${name.text}; }\n`;
  yield `var ${name.text}!: ${ctorName};\n`;

  yield `interface `;
  yield name;

  if (typeParameters)
    yield* generateTypeParameters(typeParameters);

  yield ` {\n`;
  if (body) {
    for (const child of body.namedChildren) {
      if (child.type !== "field_declaration") {
        continue;
      }
      yield child.childForFieldName("name")!;
      yield `: `;
      yield child.childForFieldName("type")!;
      yield `,\n`;
    }
  }
  yield `}`;
}
