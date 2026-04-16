import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { generateIdentifier, generatePattern } from ".";
import { escapeCtorImplName, escapeCtorName } from "./escaping";
import { generateType, generateTypeParameters } from "./type";

export function* generateTrait(node: SyntaxNode): Generator<Code> {
  const nameNode = node.childForFieldName("name")!;
  const name = nameNode.text;
  const typeParams = node.childForFieldName("type_parameters");
  const body = node.childForFieldName("body")!;
  const exporting = node.namedChildren[0]?.type === "visibility_modifier" ? "export " : "";
  const typeParamSuffix = typeParams ? `<${typeParams.namedChildren.map(c => c.text).join(", ")}>` : "";

  const staticMembers: SyntaxNode[] = [];
  const instanceMembers: SyntaxNode[] = [];

  for (const child of body.namedChildren) {
    if (child.type === "function_item" || child.type === "function_signature_item") {
      const params = child.childForFieldName("parameters");
      const isInstance = params?.namedChildren[0]?.type === "self_parameter";
      if (isInstance)
        instanceMembers.push(child);
      else
        staticMembers.push(child);
    }
    else if (child.type === "const_item") {
      staticMembers.push(child);
    }
  }

  // type __JSRS_Trait__CtorImpl = { optional?(): void; required(): void; }
  const ctorImplName = escapeCtorImplName(name);
  yield `${exporting}type ${ctorImplName}`;
  yield* generateTypeParameters(typeParams);
  yield ` = {\n`;
  for (const member of staticMembers) {
    if (member.type === "function_item" || member.type === "function_signature_item") {
      const hasDefault = member.type === "function_item";
      yield* generateMethodSignature(member, false, hasDefault);
    }
    else if (member.type === "const_item") {
      const hasDefault = !!member.childForFieldName("value");
      yield `  `;
      yield* generateIdentifier(member.childForFieldName("name")!);
      if (hasDefault)
        yield `?`;
      const type = member.childForFieldName("type");
      if (type) {
        yield `: `;
        yield* generateType(type);
      }
      yield `;\n`;
    }
  }
  yield `};\n`;

  // type __JSRS_Trait__Ctor = Required<__JSRS_Trait__CtorImpl>
  yield `${exporting}type ${escapeCtorName(name)}${typeParamSuffix} = Required<${ctorImplName}${typeParamSuffix}>;\n`;

  // interface Trait { method(this: unknown): void; }
  yield `${exporting}interface ${name}`;
  yield* generateTypeParameters(typeParams);
  yield ` {\n`;
  for (const member of instanceMembers) {
    const hasDefault = member.type === "function_item";
    yield* generateMethodSignature(member, true, hasDefault);
  }
  yield `}\n`;
}

function* generateMethodSignature(node: SyntaxNode, isInstance: boolean, optional: boolean): Generator<Code> {
  const name = node.childForFieldName("name")!;
  const typeParams = node.childForFieldName("type_parameters");
  const parameters = node.childForFieldName("parameters")!;
  const returnType = node.childForFieldName("return_type");

  yield `  `;
  yield* generateIdentifier(name);
  if (optional)
    yield `?`;
  yield* generateTypeParameters(typeParams);
  yield `(`;

  let first = true;
  if (isInstance) {
    yield `this: unknown`;
    first = false;
  }

  for (const param of parameters.namedChildren) {
    if (param.type === "self_parameter")
      continue;
    if (!first)
      yield `, `;
    first = false;
    if (param.type === "parameter") {
      yield* generatePattern(param.childForFieldName("pattern")!);
      const type = param.childForFieldName("type");
      if (type) {
        yield `: `;
        yield* generateType(type);
      }
    }
    else if (param.type === "identifier" || param.type === "type_identifier") {
      yield* generateIdentifier(param);
    }
  }

  yield `)`;
  if (returnType) {
    yield `: `;
    yield* generateType(returnType);
  }
  else {
    yield `: void`;
  }
  yield `;\n`;
}
