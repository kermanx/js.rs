import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { escapeCtorName } from "./escaping";
import { FunctionKind, generateFunction } from "./function";
import { generateTypeParameters, getTypeParamPlaceholders } from "./type";

export function* generateImpl(node: SyntaxNode): Generator<
  Code
> {
  const typeParams = node.childForFieldName("type_parameters");
  const trait = node.childForFieldName("trait");
  const type = node.childForFieldName("type")!;
  const body = node.childForFieldName("body")!;
  const name = type.text; // FIXME: A::B

  const staticMethods: SyntaxNode[] = [];
  const instanceMethods: SyntaxNode[] = [];
  for (const child of body.namedChildren) {
    if (child.type === "function_item") {
      const isStatic = child.childForFieldName("parameters")?.namedChildren[0]?.type !== "self_parameter";
      if (isStatic)
        staticMethods.push(child);
      else
        instanceMethods.push(child);
    }
  }

  if (staticMethods.length > 0) {
    const implName = `__JSRS_impl_${node.startIndex}_static`;
    yield `function ${implName}`;
    yield* generateTypeParameters(typeParams);
    yield `() { return {\n`;
    for (const method of staticMethods) {
      yield* generateFunction(method, FunctionKind.Implementation, type);
      yield ",\n";
    }
    yield `} `;

    if (trait) {
      const traitName = trait.text;
      yield `satisfies ${escapeCtorName(traitName)}; }\n`;
      // TODO: declare module "..." {
      yield `interface ${escapeCtorName(name)} extends ${escapeCtorName(traitName)} {}\n`;
    }
    else {
      yield "}\n";
      const typeParamPlaceholders = getTypeParamPlaceholders(typeParams);
      yield `type ${implName}_T${typeParamPlaceholders} = ReturnType<typeof ${implName}${typeParamPlaceholders}>;\n`;
      yield `interface ${escapeCtorName(name)} extends ${implName}_T${typeParamPlaceholders} {}\n`;
    }
  }

  if (instanceMethods.length > 0) {
    const implName = `__JSRS_impl_${node.startIndex}`;
    yield `function ${implName}`;
    yield* generateTypeParameters(typeParams);
    yield `() { return {\n`;
    for (const method of instanceMethods) {
      yield* generateFunction(method, FunctionKind.Implementation, type);
      yield ",\n";
    }
    yield `} `;

    if (trait) {
      const traitName = trait.text;
      yield `satisfies ${traitName}; }\n`;
      // TODO: declare module "..." {
      yield `interface ${name} extends ${traitName} {}\n`;
    }
    else {
      yield "}\n";
      const typeParamPlaceholders = getTypeParamPlaceholders(typeParams);
      yield `type ${implName}_T${typeParamPlaceholders} = ReturnType<typeof ${implName}${typeParamPlaceholders}>;\n`;
      yield `interface ${name} extends ${implName}_T${typeParamPlaceholders} {}\n`;
    }
  }
}
