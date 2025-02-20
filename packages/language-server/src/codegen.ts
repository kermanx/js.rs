import type Parser from "tree-sitter";
import type { Code } from "./types";
import { wrapWith } from "./utils";
import { codeFeatures } from "./utils/codeFeatures";

export function* generateRoot(root: Parser.SyntaxNode): Generator<Code> {
  for (const node of root.children) {
    yield* generateStatement(node);
  }
}

export function* generateStatement(node: Parser.SyntaxNode): Generator<Code> {
  switch (node.type) {
    case "function_item":
      yield* generateFunctionItem(node);
      break;
    case "let_declaration":
      yield* generateLocal(node);
      break;
    case "expression_statement":
      yield* generateExpression(node.namedChildren[0]);
      yield ";";
      break;
    default:
      yield* generateExpression(node);
  }
  yield "\n";
}

export function* generateFunctionItem(
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

  yield `(`;

  const parameters = node.childForFieldName("parameters")!;
  for (const param of parameters.namedChildren) {
    if (param.type === "self_parameter") {
      continue;
    }
    else if (param.type === "parameter") {
      yield [
        param.text,
        param.startIndex,
      ];
    }
    yield `, `;
  }

  yield `)`;

  const type = node.childForFieldName("return_type");
  if (type) {
    yield `: `;
    yield [
      type.text,
      type.startIndex,
    ];
  }

  if (isClosure) {
    yield ` =>`;
  }
  yield ` `;

  const body = node.childForFieldName("body")!;
  if (body.type === "block") {
    yield* generateBlock(body);
  }
}

function* generateBlock(node: Parser.SyntaxNode): Generator<Code> {
  yield `{\n`;
  for (const statement of node.namedChildren) {
    yield* generateStatement(statement);
  }
  yield `}`;
}

function* generateLocal(node: Parser.SyntaxNode): Generator<Code> {
  const mutable = node.namedChildren[0]?.type === "mutable_specifier";
  yield mutable ? "let " : "const ";

  const pattern = node.childForFieldName("pattern")!;
  yield [
    pattern.text,
    pattern.startIndex,
  ];

  const type = node.childForFieldName("type")!;
  if (type) {
    yield `: `;
    yield [
      type.text,
      type.startIndex,
    ];
  }

  const value = node.childForFieldName("value")!;
  if (value) {
    yield ` = `;
    yield* generateExpression(value);
  }
  yield `;`;
}

function* generateExpression(node: Parser.SyntaxNode): Generator<Code> {
  switch (node.type) {
    case "identifier":
      yield* generateIdentifier(node);
      break;
    case "integer_literal":
    case "boolean_literal":
    case "string_literal":
      yield* generateLiteral(node);
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
    case "field_expression":
      yield* generateFieldExpression(node);
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
  }
}

function* generateIdentifier(node: Parser.SyntaxNode): Generator<Code> {
  yield [
    node.text,
    node.startIndex,
  ];
}

function* generateLiteral(node: Parser.SyntaxNode): Generator<Code> {
  yield [
    node.text,
    node.startIndex,
  ];
}

function* generateBinaryExpression(node: Parser.SyntaxNode): Generator<Code> {
  yield* generateExpression(node.children[0]);
  yield ` `;
  yield* generateBinaryOperator(node.children[1]);
  yield ` `;
  yield* generateExpression(node.children[2]);
}

function* generateBinaryOperator(node: Parser.SyntaxNode): Generator<Code> {
  yield [
    node.text,
    node.startIndex,
  ];
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
    yield `.`;
    yield* generateIdentifier(field);
  }
}

function* generateReferenceExpression(_node: Parser.SyntaxNode): Generator<Code> {
  // TODO:
}

function* generateReturnExpression(node: Parser.SyntaxNode): Generator<Code> {
  yield `return `;
  const value = node.namedChildren[0];
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
