import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { context } from "./context";
import { escapeCtorImplName, escapeCtorName } from "./escaping";
import { FunctionKind, generateFunction } from "./function";
import { generateTypeParameters, getTypeParamPlaceholders } from "./type";

function* generateInterfaceExtends(exporting: string, importedModule: string | undefined, name: string, extendsClause: string): Generator<Code> {
  if (importedModule) {
    yield `declare module "${importedModule}" {\n  interface ${name} extends ${extendsClause} {}\n}\n`;
  }
  else {
    yield `${exporting}interface ${name} extends ${extendsClause} {}\n`;
  }
}

export function* generateImpl(node: SyntaxNode): Generator<
  Code
> {
  const typeParams = node.childForFieldName("type_parameters");
  const trait = node.childForFieldName("trait");
  const type = node.childForFieldName("type")!;
  const body = node.childForFieldName("body")!;
  const name = type.text; // FIXME: A::B

  const exporting = context.exportingTypes.has(name) ? "export " : "";

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

  const importedModule = context.importedFrom.get(name);
  const uid = node.startIndex;

  if (trait) {
    const traitName = trait.text;
    const traitModule = context.importedFrom.get(traitName);
    if (traitModule) {
      yield `type ${escapeCtorImplName(traitName)}_${uid} = import("${traitModule}").${escapeCtorImplName(traitName)};\n`;
      yield `type ${escapeCtorName(traitName)}_${uid} = import("${traitModule}").${escapeCtorName(traitName)};\n`;
      yield `type ${traitName}_${uid} = import("${traitModule}").${traitName};\n`;
    }
  }

  if (staticMethods.length > 0) {
    const implName = `__JSRS_impl_${uid}_static`;
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
      const traitModule = context.importedFrom.get(traitName);
      const ctorImplAlias = traitModule ? `${escapeCtorImplName(traitName)}_${uid}` : escapeCtorImplName(traitName);
      const ctorAlias = traitModule ? `${escapeCtorName(traitName)}_${uid}` : escapeCtorName(traitName);
      yield `satisfies ${ctorImplAlias}; }\n`;
      yield* generateInterfaceExtends(exporting, importedModule, escapeCtorName(name), ctorAlias);
    }
    else {
      yield "}\n";
      const typeParamPlaceholders = getTypeParamPlaceholders(typeParams);
      yield `type ${implName}_T${typeParamPlaceholders} = ReturnType<typeof ${implName}${typeParamPlaceholders}>;\n`;
      yield* generateInterfaceExtends(exporting, importedModule, escapeCtorName(name), `${implName}_T${typeParamPlaceholders}`);
    }
  }

  if (instanceMethods.length > 0) {
    const implName = `__JSRS_impl_${uid}`;
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
      const traitModule = context.importedFrom.get(traitName);
      const instanceAlias = traitModule ? `${traitName}_${uid}` : traitName;
      yield `satisfies ${instanceAlias}; }\n`;
      yield* generateInterfaceExtends(exporting, importedModule, name, instanceAlias);
    }
    else {
      yield "}\n";
      const typeParamPlaceholders = getTypeParamPlaceholders(typeParams);
      yield `type ${implName}_T${typeParamPlaceholders} = ReturnType<typeof ${implName}${typeParamPlaceholders}>;\n`;
      yield* generateInterfaceExtends(exporting, importedModule, name, `${implName}_T${typeParamPlaceholders}`);
    }
  }
}
