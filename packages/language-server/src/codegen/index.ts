import type Parser from "tree-sitter";
import type { Code } from "../types";
import { codeFeatures } from "../utils/codeFeatures";
import { escapeCtorName } from "./escaping";
import { FunctionKind, generateFunction } from "./function";
import { generatePrelude } from "./prelude";
import { generateTypeParameters } from "./type";
import { generateUse } from "./use";
import { between, generateChildren, wrapWith } from "./utils";

export function* generateRoot(root: Parser.SyntaxNode): Generator<Code> {
  yield* generateBlock(root);
  yield* generatePrelude();
}

export function* generateBlock(node: Parser.SyntaxNode): Generator<Code> {
  yield* generateChildren(node, generateStatement);
}

export function* generateStatement(node: Parser.SyntaxNode): Generator<Code> {
  switch (node.type) {
    case "function_item":
      yield* generateFunction(node, FunctionKind.Declaration);
      break;
    case "enum_item":
      yield* generateEnum(node);
      break;
    case "struct_item":
      yield* generateStruct(node);
      break;
    case "impl_item":
      yield* generateImpl(node);
      break;
    case "let_declaration":
      yield* generateLocal(node);
      break;
    case "expression_statement":
      yield* generateExpression(node.namedChildren[0]);
      break;
    case "use_declaration":
      yield* generateUse(node);
      break;
    default:
      yield* generateExpression(node);
  }
  const semi = node.children.at(-1);
  if (semi?.type === ";") {
    yield semi;
  }
}

function* generateEnum(_node: Parser.SyntaxNode): Generator<Code> {
  // TODO:
}

function* generateStruct(node: Parser.SyntaxNode): Generator<Code> {
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

function* generateLocal(node: Parser.SyntaxNode): Generator<Code> {
  const mutable = node.namedChildren[0]?.type === "mutable_specifier";
  yield mutable ? "let " : "const ";

  const pattern = node.childForFieldName("pattern")!;
  yield pattern;

  const type = node.childForFieldName("type")!;
  if (type) {
    yield `: `;
    yield type;
  }

  const value = node.childForFieldName("value")!;
  if (value) {
    yield ` = `;
    yield* generateExpression(value);
  }
}

export function* generateExpression(node: Parser.SyntaxNode): Generator<Code> {
  switch (node.type) {
    case "integer_literal":
    case "boolean_literal":
    case "string_literal":
      yield node;
      break;
    case "identifier":
    case "scoped_identifier":
      yield* generateIdentifier(node);
      break;
    case "array_expression":
    case "tuple_expression":
      yield* generateArrayExpression(node);
      break;
    case "binary_expression":
      yield* generateBinaryExpression(node);
      break;
    case "unary_expression":
      yield* generateUnaryExpression(node);
      break;
    case "assignment_expression":
      yield* generateAssignmentExpression(node);
      break;
    case "call_expression":
      yield* generateCallExpression(node);
      break;
    case "closure_expression":
      yield* generateFunction(node, FunctionKind.Closure);
      break;
    case "field_expression":
      yield* generateFieldExpression(node);
      break;
    case "index_expression":
      yield* generateIndexExpression(node);
      break;
    case "parenthesized_expression":
      yield* generateParenthesizedExpression(node);
      break;
    case "range_expression":
      yield* generateRangeExpression(node);
      break;
    case "reference_expression":
      yield* generateReferenceExpression(node);
      break;
    case "return_expression":
      yield* generateReturnExpression(node);
      break;
    case "self":
      yield* generateSelf(node);
      break;
    case "ERROR":
      yield* generateBlock(node);
      break;
  }
}

function* generateArrayExpression(node: Parser.SyntaxNode): Generator<Code> {
  yield `[`;
  for (const child of node.namedChildren) {
    yield* generateExpression(child);
    yield `, `;
  }
  yield `]`;
}

function* generateBinaryExpression(node: Parser.SyntaxNode): Generator<Code> {
  const left = node.children[0];
  const right = node.children[2];

  yield* generateExpression(left);
  yield* between(node, left, right);
  yield* generateExpression(right);
}

export function* generateIdentifier(node: Parser.SyntaxNode): Generator<Code> {
  switch (node.type) {
    case "identifier":
    case "field_identifier":
    case "type_identifier":
      yield node;
      break;
    case "scoped_identifier":
      yield* generateScopedIdentifier(node);
      break;
  }
}

function* generateScopedIdentifier(node: Parser.SyntaxNode): Generator<Code> {
  let first = true;
  for (const child of node.namedChildren) {
    if (!first) {
      yield `.`;
    }
    first = false;
    yield* generateIdentifier(child);
  }
}

function* generateUnaryExpression(node: Parser.SyntaxNode): Generator<Code> {
  const operator = node.children[0].text;
  if (operator === "*") {
    // TODO:
    yield* generateExpression(node.children[1]);
  }
  else {
    yield operator;
    yield* generateExpression(node.children[1]);
  }
}

function* generateAssignmentExpression(node: Parser.SyntaxNode): Generator<Code> {
  const left = node.childForFieldName("left")!;
  const right = node.childForFieldName("right")!;

  yield* generateExpression(left);
  yield ` = `;
  yield* generateExpression(right);
}

function* generateCallExpression(node: Parser.SyntaxNode): Generator<Code> {
  const func = node.childForFieldName("function")!;
  const args = node.childForFieldName("arguments")!;

  yield* generateExpression(func);
  yield `(`;
  for (const arg of args.namedChildren) {
    yield* generateExpression(arg);
    yield `, `;
  }
  yield `)`;
}

function* generateFieldExpression(node: Parser.SyntaxNode): Generator<Code> {
  const value = node.childForFieldName("value")!;
  const field = node.childForFieldName("field")!;

  if (value.type === "identifier") {
    yield* generateIdentifier(value);
  }
  else {
    yield* generateExpression(value);
  }

  if (/\d/.test(field.text[0])) {
    yield* wrapWith(
      field.startIndex,
      field.endIndex,
      codeFeatures.verification,
      `[`,
      field.text,
      `]`,
    );
  }
  else {
    yield* between(node, value, field);
    yield* generateIdentifier(field);
  }
}

function* generateIndexExpression(node: Parser.SyntaxNode): Generator<Code> {
  const target = node.namedChild(0)!;
  const index = node.namedChild(1)!;

  if (target.type.endsWith("_liternal")) {
    yield* generateExpression(target);
    yield* `[`;
    yield* generateExpression(index);
    yield* `]`;
  }
  else {
    yield `__JSRS_index(`;
    yield* generateExpression(target);
    yield `, `;
    yield* generateExpression(index);
    yield `)`;
  }
}

function* generateParenthesizedExpression(node: Parser.SyntaxNode): Generator<Code> {
  const exp = node.namedChildren[0];

  yield `(`;
  yield* generateExpression(exp);
  yield `)`;
}

function* generateRangeExpression(node: Parser.SyntaxNode): Generator<Code> {
  const from = node.namedChild(0)!;
  const to = node.namedChild(1);

  yield `__JSRS_range(`;
  yield* generateExpression(from);
  yield `, `;
  if (to) {
    yield* generateExpression(to);
    if (node.child(1)!.text === "..=") {
      yield `+ 1`;
    }
  }
  yield `)`;
}

function* generateReferenceExpression(_node: Parser.SyntaxNode): Generator<Code> {
  // TODO:
}

function* generateReturnExpression(node: Parser.SyntaxNode): Generator<Code> {
  const value = node.namedChildren[0];

  yield `return `;
  if (value) {
    yield* generateExpression(value);
  }
  yield `;`;
}

export function* generateSelf(node: Parser.SyntaxNode): Generator<Code> {
  yield ["this", node.startIndex]
}

function* generateImpl(node: Parser.SyntaxNode): Generator<Code> {
  const trait = node.childForFieldName("trait");
  const type = node.childForFieldName("type")!;
  const body = node.childForFieldName("body")!;

  const staticMethods: Parser.SyntaxNode[] = [];
  const instanceMethods: Parser.SyntaxNode[] = [];

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
