import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { UserError } from "../types";
import { codeFeatures } from "../utils/codeFeatures";
import { context } from "./context";
import { generateEnum } from "./enum";
import { FunctionKind, generateFunction } from "./function";
import { generateImpl } from "./impl";
import { generateMacroInvocation } from "./macro";
import { generateMatch, getPatternBindings } from "./match";
import { generatePrelude } from "./prelude";
import { generateStruct, generateStructExpression } from "./struct";
import { generateUse } from "./use";
import { between, generateChildren, wrapWith } from "./utils";

export function* generateRoot(root: SyntaxNode): Generator<Code> {
  yield* generateBlock(root, false);
  yield* generatePrelude();
}

export function* generateBlock(node: SyntaxNode, implicitReturn: boolean): Generator<Code> {
  yield* generateChildren(node, implicitReturn
    ? function* (node, index, array) {
      if (index === array.length - 1) {
        if (node.type.endsWith("_expression")
          || node.type.endsWith("_literal")
          || node.type.endsWith("identifier")
          || (node.type === "expression_statement"
            && (node.namedChildren[0].type === "match_expression"
              || node.namedChildren[0].type === "if_expression"))) {
          yield* wrapWith(node.startIndex, node.endIndex, codeFeatures.verification, "return");
          yield " ";
          yield* generateExpression(node);
        }
        else {
          yield* generateStatement(node);
        }
      }
      else {
        yield* generateStatement(node);
      }
    }
    : generateStatement);
}

export function* generateStatement(node: SyntaxNode): Generator<Code> {
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
      yield* generateStatement(node.namedChildren[0]);
      break;
    case "use_declaration":
      yield* generateUse(node);
      break;
    case "match_expression":
      yield* generateMatch(node);
      break;
    case "block":
      yield* generateBlock(node, false);
      break;
    case "if_expression":
      yield* generateIf(node);
      break;
    case "macro_invocation":
      yield* generateMacroInvocation(node);
      break;
    default:
      yield* generateExpression(node);
  }
  const semi = node.children.at(-1);
  if (semi?.type === ";") {
    yield semi;
  }
}

function* generateLocal(node: SyntaxNode): Generator<Code> {
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

export function* generateExpression(node: SyntaxNode): Generator<Code> {
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
    case "expression_statement":
      yield* generateExpression(node.namedChildren[0]);
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
    case "struct_expression":
      yield* generateStructExpression(node);
      break;

    case "block":
      context.needCaptureReturn++;
      yield "(() => ";
      yield* generateBlock(node, true);
      yield ")()";
      context.needCaptureReturn--;
      break;
    case "match_expression":
    case "if_expression":
      // TODO:
      // yield "(() => ";
      // yield ")()";
      break;

    case "ERROR":
      yield* generateBlock(node, false);
      break;
  }
}

function* generateArrayExpression(node: SyntaxNode): Generator<Code> {
  yield* generateChildren(node, generateExpression, text => text.replace("(", "[").replace(")", "]"));
}

function* generateBinaryExpression(node: SyntaxNode): Generator<Code> {
  const left = node.children[0];
  const right = node.children[2];

  yield* wrapWith(
    node.startIndex,
    node.endIndex,
    codeFeatures.verification,
    ...generateExpression(left),
    ...between(node, left, right),
    ...generateExpression(right),
  );
}

export function* generateIdentifier(node: SyntaxNode): Generator<Code> {
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

export function* generateScopedIdentifier(node: SyntaxNode): Generator<Code> {
  let first = true;
  for (const child of node.namedChildren) {
    if (!first) {
      yield `.`;
    }
    first = false;
    yield* generateIdentifier(child);
  }
}

function* generateUnaryExpression(node: SyntaxNode): Generator<Code> {
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

function* generateAssignmentExpression(node: SyntaxNode): Generator<Code> {
  const left = node.childForFieldName("left")!;
  const right = node.childForFieldName("right")!;

  yield* generateExpression(left);
  yield ` = `;
  yield* generateExpression(right);
}

function* generateCallExpression(node: SyntaxNode): Generator<Code> {
  const func = node.childForFieldName("function")!;
  const args = node.childForFieldName("arguments")!;

  yield* generateExpression(func);
  yield* generateChildren(args, generateExpression);
}

function* generateFieldExpression(node: SyntaxNode): Generator<Code> {
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

function* generateIndexExpression(node: SyntaxNode): Generator<Code> {
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

function* generateParenthesizedExpression(node: SyntaxNode): Generator<Code> {
  const exp = node.namedChildren[0];

  yield `(`;
  yield* generateExpression(exp);
  yield `)`;
}

function* generateRangeExpression(node: SyntaxNode): Generator<Code> {
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

function* generateReferenceExpression(node: SyntaxNode): Generator<Code> {
  const isMut = node.descendantsOfType("mutable_specifier").length > 0;
  const value = node.childForFieldName("value")!;
  yield isMut ? "__JSRS_mutRef(" : "__JSRS_ref(";
  yield* generateExpression(value);
  yield ")";
}

function* generateReturnExpression(node: SyntaxNode): Generator<Code> {
  const [keyword, value] = node.children;

  if (context.needCaptureReturn) {
    const typeCode = context.returnType[context.returnType.length - 1];
    if (typeCode) {
      yield `(`;
      if (value) {
        yield* generateExpression(value);
      }
      yield ` `;
      yield* wrapWith(
        keyword.startIndex,
        keyword.endIndex,
        codeFeatures.verification,
        "satisfies",
      );
      yield ` `;
      yield* typeCode;
      yield `)`;
    }
    else {
      yield new UserError(node, "Return type must be specified explicitly");
    }
  }
  else {
    yield keyword;
    yield " ";
    if (value) {
      yield* generateExpression(value);
    }
    yield `;`;
  }
}

export function* generateSelf(node: SyntaxNode): Generator<Code> {
  yield ["this", node.startIndex];
}

function* generateIf(node: SyntaxNode): Generator<Code> {
  const condition = node.childForFieldName("condition")!;
  const consequence = node.childForFieldName("consequence")!;
  const alternative = node.childForFieldName("alternative");
  if (condition.type === "let_condition") {
    const pattern = condition.childForFieldName("pattern")!;
    const value = condition.childForFieldName("value")!;

    yield "if (__JSRS_any(";
    yield* generateExpression(value);
    yield "))";

    const bindings = [...getPatternBindings(pattern)];
    if (bindings.length) {
      yield "{ const ";
      let isFirst = true;
      for (const binding of bindings) {
        if (!isFirst) {
          yield ", ";
        }
        isFirst = false;
        yield binding;
        yield "!";
      }
      yield "; ";
    }
    yield* generateStatement(consequence);
    if (bindings.length) {
      yield " }";
    }
  }
  else {
    yield "if (";
    yield* generateExpression(condition);
    yield ")";
    yield* generateStatement(consequence);
  }
  if (alternative) {
    yield "else ";
    yield* generateStatement(alternative.namedChildren[0]);
  }
}
