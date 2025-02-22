import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { escapeCtorName } from "./escaping";
import { FunctionKind, generateFunction } from "./function";

export function* generateImpl(node: SyntaxNode): Generator<
  Code
> {
  const trait = node.childForFieldName("trait");
  const type = node.childForFieldName("type")!;
  const body = node.childForFieldName("body")!;

  const staticMethods: SyntaxNode[] = [];
  const instanceMethods: SyntaxNode[] = [];

  for (const child of body.namedChildren) {
    if (child.type === "function_item") {
      yield* generateFunction(child, FunctionKind.Implementation, type);
      yield "\n";

      const name = child.childForFieldName("name")!;
      const isStatic = child.childForFieldName("parameters")?.namedChildren[0]?.type !== "self_parameter";
      if (isStatic)
        staticMethods.push(name);
      else
        instanceMethods.push(name);
    }
  }

  // TODO: declare module "..." {

  const name = type.text; // FIXME: A::B
  if (trait) {
    const traitName = trait.text;
    if (staticMethods.length) {
      yield `;({ `;
      for (const methodName of staticMethods) {
        yield methodName;
        yield ", ";
      }
      yield `} satisfies ${escapeCtorName(traitName)})\n`;
      yield `interface ${escapeCtorName(name)} extends ${escapeCtorName(traitName)} {}\n`;
    }
    if (instanceMethods.length) {
      yield `;({ `;
      for (const methodName of instanceMethods) {
        yield methodName;
        yield ", ";
      }
      yield `} satisfies ${traitName})\n`;
      yield `interface ${name} extends ${traitName} {}\n`;
    }
  }
  else {
    if (staticMethods.length) {
      yield `interface ${escapeCtorName(name)} { `;
      for (const methodName of staticMethods) {
        yield methodName;
        yield ": typeof ";
        yield methodName;
        yield "; ";
      }
      yield "}\n";
    }
    yield `interface ${name} { `;
    for (const methodName of instanceMethods) {
      yield methodName;
      yield ": typeof ";
      yield methodName;
      yield "; ";
    }
    yield "}\n";
  }
}
