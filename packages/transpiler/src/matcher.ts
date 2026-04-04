import type { SyntaxNode } from "tree-sitter";
import type { Code } from "./transpiler";
import { defineTranspilerComponent } from "./transpiler";

type T = typeof _T;
declare module "./transpiler" {
  interface Transpiler extends T {}
}

const _T = defineTranspilerComponent({
  * PatMatcher(pat: SyntaxNode, target: string): Code {
    this.matchDepth++;
    switch (pat.type) {
      case "_":
        yield `true`;
        break;
      case "mut_pattern":
        yield* this.PatMatcher(pat.namedChildren[0], target);
        break;
      case "identifier":
        yield* this.PatIdentMatcher(pat, target);
        break;
      case "captured_pattern":
        yield* this.PatCapturedMatcher(pat, target);
        break;
      case "ref_pattern":
      case "reference_pattern":
        yield* this.PatReferenceMatcher(pat, target);
        break;
      case "box_pattern":
        yield* this.PatBoxMatcher(pat, target);
        break;
      case "tuple_struct_pattern":
        yield* this.PatTupleStructMatcher(pat, target);
        break;
      case "boolean_literal":
      case "integer_literal":
      case "char_literal":
        yield `(${target} === ${pat.text})`;
        break;
      case "or_pattern":
        yield* this.PatMatcher(pat.namedChildren[0], target);
        yield "||";
        yield* this.PatMatcher(pat.namedChildren[1], target);
        break;
      case "range_pattern":
        yield* this.RangePatternMatcher(pat, target);
        break;
      case "slice_pattern":
      case "tuple_pattern":
        yield* this.SlicePatternMatcher(pat, target);
        break;
      default:
        throw new Error(`Not implemented: ${pat.type}`);
    }
    this.matchDepth--;
  },

  * PatTupleStructMatcher(pat: SyntaxNode, target: string): Code {
    const discriminant = this.getDiscriminantId(pat.namedChildren[0].text);
    yield `((_m${this.matchDepth} = _r.matches(${target}, ${discriminant}))`;

    for (let i = 1; i < pat.namedChildren.length; i++) {
      yield `&&`;
      yield* this.PatMatcher(
        pat.namedChildren[i],
        `_m${this.matchDepth}[${i}]`,
      );
    }

    yield ")";
  },

  * PatIdentMatcher(pat: SyntaxNode, target: string): Code {
    this.matchIdentifiers!.push(pat.text);
    yield `(${pat.text} = ${target})`;
  },

  * PatCapturedMatcher(pat: SyntaxNode, target: string): Code {
    const binding = pat.namedChildren[0];
    const inner = pat.namedChildren[1];

    if (!binding) {
      yield "true";
      return;
    }

    if (!inner) {
      yield* this.PatMatcher(binding, target);
      return;
    }

    yield "(";
    yield* this.PatMatcher(binding, target);
    yield "&&";
    yield* this.PatMatcher(inner, target);
    yield ")";
  },

  * PatReferenceMatcher(pat: SyntaxNode, target: string): Code {
    const inner = pat.namedChildren.find(child => child.type !== "mutable_specifier");
    if (!inner) {
      yield "true";
      return;
    }
    yield* this.PatMatcher(inner, `_r.deref(${target})`);
  },

  * PatBoxMatcher(pat: SyntaxNode, target: string): Code {
    const inner = pat.namedChildren[0];
    if (!inner) {
      yield "true";
      return;
    }
    yield* this.PatMatcher(inner, `_r.deref(${target})`);
  },

  * RangePatternMatcher(pat: SyntaxNode, target: string): Code {
    const [start, end] = pat.namedChildren;
    yield `(${target} >= ${start.text}`;
    if (end) {
      yield ` && ${target} <= ${end.text}`;
    }
    yield ")";
  },

  * SlicePatternMatcher(pat: SyntaxNode, target: string): Code {
    let hasEllipsis = false;
    const elements: [boolean, SyntaxNode][] = [];

    for (const child of pat.children) {
      if ("([,])".includes(child.type)) {
        continue;
      }
      if (child.type === "remaining_field_pattern") {
        if (hasEllipsis) {
          throw new Error("Multiple ellipsis in slice pattern");
        }
        hasEllipsis = true;
      }
      else {
        elements.push([hasEllipsis, child]);
      }
    }

    yield `(${target}.length ${hasEllipsis ? ">=" : "==="} ${elements.length} &&`;
    yield `(_m${this.matchDepth} = ${target})`;

    for (let i = 0; i < elements.length; i++) {
      const [byEnd, element] = elements[i];
      yield `&&`;
      yield* this.PatMatcher(
        element,
        byEnd
          ? `_m${this.matchDepth}.at(${i - elements.length})`
          : `_m${this.matchDepth}[${i}]`,
      );
    }

    yield ")";
  },
});
