import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";

export function* generateMatch(node: SyntaxNode): Generator<Code> {
  const value = node.childForFieldName("value");
  const body = node.childForFieldName("body");

  yield "(() => { const __jsrs_match = ";
  if (value) {
    yield value;
  }
  else {
    yield "undefined";
  }
  yield ";\n";

  if (body) {
    for (const arm of body.namedChildren) {
      if (arm.type !== "match_arm")
        continue;
      const pattern = arm.childForFieldName("pattern")?.namedChildren[0];
      const armValue = arm.childForFieldName("value");

      yield "if (";
      if (pattern) {
        yield* generatePatternCondition(pattern, "__jsrs_match");
      }
      else {
        yield "true";
      }
      yield ") return ";
      if (armValue) {
        if (armValue.type === "block") {
          yield "(() => ";
          yield armValue;
          yield ")()";
        }
        else {
          yield armValue;
        }
      }
      else {
        yield "undefined as any";
      }
      yield ";\n";
    }
  }

  yield "return undefined as any; })()";
}

function* generatePatternCondition(pattern: SyntaxNode, valueCode: string): Generator<Code> {
  switch (pattern.type) {
    case "wildcard_pattern":
      yield "true";
      break;
    case "or_pattern": {
      const conditions = pattern.namedChildren;
      if (!conditions.length) {
        yield "false";
        return;
      }
      let first = true;
      for (const child of conditions) {
        if (!first)
          yield " || ";
        first = false;
        yield "(";
        yield* generatePatternCondition(child, valueCode);
        yield ")";
      }
      break;
    }
    case "tuple_pattern":
    case "slice_pattern":
    case "tuple_struct_pattern":
    case "struct_pattern":
      yield `__JSRS_any(${valueCode})`;
      break;
    case "range_pattern": {
      const left = pattern.childForFieldName("left");
      const right = pattern.childForFieldName("right");
      const inclusive = pattern.text.includes("..=");
      if (left && right) {
        yield `(${valueCode} >= `;
        yield left;
        yield ` && ${valueCode} ${inclusive ? "<=" : "<"} `;
        yield right;
        yield ")";
      }
      else {
        yield "true";
      }
      break;
    }
    case "reference_pattern":
    case "ref_pattern":
    case "mut_pattern":
    case "captured_pattern": {
      const inner = pattern.namedChildren[0];
      if (inner) {
        yield* generatePatternCondition(inner, valueCode);
      }
      else {
        yield "true";
      }
      break;
    }
    default:
      yield `${valueCode} === `;
      yield pattern;
      break;
  }
}

export function* getPatternBindings(node: SyntaxNode): Generator<Code> {
  switch (node.type) {
    case "identifier":
      yield node;
      break;
    case "field_pattern": {
      const pattern = node.childForFieldName("pattern");
      if (pattern) {
        yield* getPatternBindings(pattern);
      }
      else {
        const name = node.childForFieldName("name");
        if (name)
          yield name;
      }
      break;
    }
    case "struct_pattern":
      for (const child of node.namedChildren) {
        yield* getPatternBindings(child);
      }
      break;
    case "tuple_struct_pattern":
      for (const child of node.namedChildren.slice(1)) {
        yield* getPatternBindings(child);
      }
      break;
    case "or_pattern": {
      const [left, right] = node.namedChildren;
      const leftBindings = getPatternBindings(left);
      const _rightBindings = getPatternBindings(right);
      // TODO: Check equality of bindings
      yield* leftBindings;
      break;
    }
    case "slice_pattern":
    case "tuple_pattern":
      for (const child of node.namedChildren) {
        yield* getPatternBindings(child);
      }
      break;
    default:
  }
}
