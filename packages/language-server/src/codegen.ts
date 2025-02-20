import type Parser from "tree-sitter";
import type { Code } from "./types";
import { between, wrapWith } from "./utils";
import { codeFeatures } from "./utils/codeFeatures";

export function* generateRoot(root: Parser.SyntaxNode): Generator<Code> {
  yield* generateBlock(root);

  yield `
; declare global {
  const __JSRS_rangeSymbol: unique symbol;
  type __JSRS_Range = { [__JSRS_rangeSymbol]: true };

  function __JSRS_index<T, K extends number | __JSRS_Range>(array: T[], index: K): K extends __JSRS_Range ? number[] : number;
  function __JSRS_range(start: number, end: number): __JSRS_Range;
};

export {};
  `;
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
      yield [
        child.text,
        child.startIndex,
      ];
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
    yield [
      semi.text,
      semi.startIndex,
    ];
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
  yield* generateChildren(parameters, generateParameter)

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

  yield [
    pattern.text,
    pattern.startIndex,
  ];
  yield* between(node, pattern, type);
  if (type) {
    yield [
      type.text,
      type.startIndex,
    ];
  }
}

function* generateEnum(node: Parser.SyntaxNode): Generator<Code> {
  // TODO:
}

function* generateStruct(node: Parser.SyntaxNode): Generator<Code> {
  const name = node.childForFieldName("name")!;
  const body = node.childForFieldName("body");

  yield `interface __JSRS_${name.text}Constructor { new(): ${name.text}; }\n`;
  yield `var ${name.text}!: __JSRS_${name.text}Constructor;\n`;
  if (body) {
    yield `interface `;
    yield [
      name.text,
      name.startIndex,
    ];
    yield ` {\n`;
    for (const child of body.namedChildren) {
      if (child.type !== "field_declaration") {
        continue;
      }
      const name = child.childForFieldName("name")!;
      const type = child.childForFieldName("type")!;
      yield [
        name.text,
        name.startIndex,
      ];
      yield `: `;
      yield [
        type.text,
        type.startIndex,
      ];
      yield `,\n`;
    }
    yield `}`;
  }
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
}

function* generateExpression(node: Parser.SyntaxNode): Generator<Code> {
  switch (node.type) {
    case "integer_literal":
    case "boolean_literal":
    case "string_literal":
      yield* generateLiteral(node);
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

function* generateLiteral(node: Parser.SyntaxNode): Generator<Code> {
  yield [
    node.text,
    node.startIndex,
  ];
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
      yield [
        node.text,
        node.startIndex,
      ];
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
      // TODO: throw new Error("Wildcard import is not supported");
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
        return "";
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
        return "";
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
