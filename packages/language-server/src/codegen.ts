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
    case "use_declaration":
      yield* generateUse(node);
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
    case "ERROR":
      for (const child of node.children) {
        yield* generateStatement(child);
      }
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

function* generateUse(node: Parser.SyntaxNode): Generator<Code> {
  const reexportsNamed: Code[] = [];
  const reexportsAll: string[] = [];
  yield* generateUseItem(node.childForFieldName("argument")!);
  if (node.namedChildren[0]?.type === "visibility_modifier") {
    if (reexportsNamed.length) {
      yield "export {";
      yield* reexportsNamed;
      yield "};\n";
    }
    if (reexportsAll.length) {
      for (const path of reexportsAll) {
        yield `export * from "`;
        yield path;
        yield `";\n`;
      }
    }
  }
  else {
    if (reexportsAll.length) {
      throw new Error("Wildcard import is not supported");
    }
  }

  function* generateUseItem(node: Parser.SyntaxNode, base = "", alias?: Code): Generator<Code> {
    switch (node.type) {
      case "scoped_use_list": {
        const path = getPath(node.namedChildren[0]);
        let wildcard: Code[] | undefined;
        const named: [original: Code, alias?: Code][] = [];
        for (const child of node.namedChildren[1].namedChildren) {
          if (child.type === "self") {
            wildcard = [...wrapWith(
              child.startIndex,
              child.endIndex,
              codeFeatures.verification,
              getSelfName(node.namedChildren[0]),
            )];
          }
          else if (child.type === "identifier") {
            named.push([[child.text, child.startIndex]]);
          }
          else if (child.type === "use_as_clause") {
            const original = child.namedChildren[0];
            const alias = child.namedChildren[1];
            if (original.type === "self") {
              wildcard = [[alias.text, alias.startIndex]];
            }
            else if (original.type === "identifier") {
              named.push([[original.text, original.startIndex], [alias.text, alias.startIndex]]);
            }
            else {
              yield* generateUseItem(original, path, [alias.text, alias.startIndex]);
            }
          }
          else {
            yield* generateUseItem(child, path);
          }
        }
        if (wildcard) {
          reexportsNamed.push(...wildcard, ", ");
          yield `import * as `;
          yield* wildcard;
          yield ` from `;
          yield* generatePath(node, path);
          yield `;\n`;
        }
        if (named.length > 0) {
          yield "import { ";
          let isFirst = true;
          for (const [name, alias] of named) {
            if (!isFirst)
              yield `, `;
            isFirst = false;

            reexportsNamed.push(alias || name, ", ");
            yield name;
            if (alias) {
              yield ` as `;
              yield alias;
            }
          }
          yield ` } from `;
          yield* generatePath(node, path);
          yield `;\n`;
        }
        break;
      }
      case "scoped_identifier": {
        const path = getPath(node.namedChildren[0]);
        const name = node.namedChildren[1];
        if (name.text === "self") {
          const nameCode = alias
            ? [alias]
            : [...wrapWith(
                name.startIndex,
                name.endIndex,
                codeFeatures.verification,
                getSelfName(node.namedChildren[0]),
              )];
          reexportsNamed.push(...nameCode, ", ");
          yield `import * as `;
          yield* nameCode;
          yield ` from `;
          yield* generatePath(node, path);
          yield `;\n`;
        }
        else {
          reexportsNamed.push(alias || [name.text, name.startIndex], ", ");
          yield `import { `;
          yield [name.text, name.startIndex];
          if (alias) {
            yield ` as `;
            yield alias;
          }
          yield ` } from `;
          yield* generatePath(node, path);
          yield `;\n`;
        }
        break;
      }
      case "identifier": {
        yield `import * as `;
        yield [node.text, node.startIndex];
        yield ` from `;
        yield* generatePath(node, node.text);
        yield `;\n`;
        break;
      }
      case "use_as_clause": {
        const original = node.namedChildren[0];
        yield* generateUseItem(original, base, alias);
        break;
      }
      case "use_wildcard": {
        const path = getPath(node.namedChildren[0]);
        reexportsAll.push(path);
        break;
      }
      default:
        throw new Error(`Not implemented: ${node.type}`);
    }

    function getPath(path: Parser.SyntaxNode): string {
      return base ? `${base}/${getPathImpl(path)}` : getPathImpl(path);
    }

    function getPathImpl(path: Parser.SyntaxNode): string {
      if (path.type === "identifier") {
        return `${path.text}`;
      }
      else if (path.type === "scoped_identifier") {
        return `${getPathImpl(path.namedChildren[0])}/${path.namedChildren[1].text}`;
      }
      else if (path.type === "crate") {
        return `@`;
      }
      else {
        throw new Error(`Not implemented: ${path.type}`);
      }
    }

    function getSelfName(path: Parser.SyntaxNode): string {
      if (path.type === "identifier") {
        return path.text;
      }
      else if (path.type === "scoped_identifier") {
        return getSelfName(path.namedChildren[1]);
      }
      else if (path.type === "crate") {
        return "crate";
      }
      else {
        throw new Error(`Not implemented: ${path.type}`);
      }
    }
  }

  function generatePath(node: Parser.SyntaxNode, path: string): Generator<Code> {
    return wrapWith(
      node.startIndex,
      node.endIndex,
      codeFeatures.verification,
      `"`,
      path,
      `"`,
    );
  }
}
