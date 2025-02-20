import type Parser from "tree-sitter";
import type { Code } from "../types";
import { between, wrapWith } from "../utils";
import { codeFeatures } from "../utils/codeFeatures";
import { generatePrelude } from "./prelude";
import { generateUse } from "./use";

export function* generateRoot(root: Parser.SyntaxNode): Generator<Code> {
  yield* generateBlock(root);
  yield* generatePrelude();
}

function* generateChildren(
  node: Parser.SyntaxNode,
  generate: (node: Parser.SyntaxNode) => Generator<Code> = generateStatement,
): Generator<Code> {
  let prev: Parser.SyntaxNode | null = null;
  for (const child of node.children) {
    yield* between(node, prev, child);
    if (child.isNamed && child.type !== "ERROR") {
      yield* generate(child);
    }
    else {
      yield child;
    }
    prev = child;
  }
  yield* between(node, prev, null);
}

function* generateBlock(node: Parser.SyntaxNode): Generator<Code> {
  yield* generateChildren(node, generateStatement);
}

export function* generateStatement(node: Parser.SyntaxNode): Generator<Code> {
  switch (node.type) {
    case "function_item":
      yield* generateFunction(node);
      break;
    case "enum_item":
      yield* generateEnum(node);
      break;
    case "struct_item":
      yield* generateStruct(node);
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

function* generateFunction(
  node: Parser.SyntaxNode,
  isDeclaration = true,
  isClosure = false,
): Generator<Code> {
  if (isDeclaration && node.namedChildren[0]?.type === "visibility_modifier") {
    yield `export `;
  }

  if (!isClosure) {
    yield `function `;

    if (isDeclaration) {
      const name = node.childForFieldName("name")!;
      yield* generateIdentifier(name);
    }
  }

  const parameters = node.childForFieldName("parameters")!;
  yield* generateChildren(parameters, generateParameter);

  const type = node.childForFieldName("return_type");
  if (type) {
    yield `: `;
    yield type;
  }

  if (isClosure) {
    yield ` =>`;
  }
  yield ` `;

  const body = node.childForFieldName("body")!;
  if (body.type === "block") {
    yield* generateBlock(body);
  }
  else {
    yield* generateExpression(body);
  }
}

function* generateParameter(node: Parser.SyntaxNode): Generator<Code> {
  if (node.type === "self_parameter") {
    // TODO: codegen error
    yield `this: unknown`;
    return;
  }

  if (node.type === "identifier" || node.type === "type_identifier") {
    yield* generateIdentifier(node);
    return;
  }

  const pattern = node.childForFieldName("pattern")!;
  const type = node.childForFieldName("type");

  yield pattern;
  yield* between(node, pattern, type);
  if (type) {
    yield type;
  }
}

function* generateEnum(_node: Parser.SyntaxNode): Generator<Code> {
  // TODO:
}

function* generateStruct(node: Parser.SyntaxNode): Generator<Code> {
  const name = node.childForFieldName("name")!;
  const body = node.childForFieldName("body");

  yield `interface __JSRS_${name.text}Constructor { new(): ${name.text}; }\n`;
  yield `var ${name.text}!: __JSRS_${name.text}Constructor;\n`;
  if (body) {
    yield `interface `;
    yield name;
    yield ` {\n`;
    for (const child of body.namedChildren) {
      if (child.type !== "field_declaration") {
        continue;
      }
      yield child.childForFieldName("name")!;
      yield `: `;
      yield child.childForFieldName("type")!;
      yield `,\n`;
    }
    yield `}`;
  }
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

function* generateExpression(node: Parser.SyntaxNode): Generator<Code> {
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
      yield* generateFunction(node, false, true);
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

function* generateIdentifier(node: Parser.SyntaxNode): Generator<Code> {
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

function* generateSelf(node: Parser.SyntaxNode): Generator<Code> {
  yield* wrapWith(
    node.startIndex,
    node.endIndex,
    codeFeatures.all,
    `this`,
  );
}
