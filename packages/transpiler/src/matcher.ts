import { SyntaxNode } from "tree-sitter";
import { Code, Context } from "./context";

export declare interface MatcherPrinter extends Context {}
export class MatcherPrinter {
  *printPatMatcher(pat: SyntaxNode, target: string): Code {
    this.matchDepth++;
    switch (pat.type) {
      case "_":
        yield `true`;
        break;
      case "identifier":
        yield* this.printPatIdentMatcher(pat, target);
        break;
      case "tuple_struct_pattern":
        yield* this.printPatTupleStructMatcher(pat, target);
        break;
      case "boolean_literal":
      case "integer_literal":
      case "char_literal":
        yield `(${target} === ${pat.text})`;
        break;
      case "or_pattern":
        yield* this.printPatMatcher(pat.namedChildren[0], target);
        yield "||";
        yield* this.printPatMatcher(pat.namedChildren[1], target);
        break;
      case "range_pattern":
        yield* this.printRangePatternMatcher(pat, target);
        break;
      case "slice_pattern":
      case "tuple_pattern":
        yield* this.printSlicePatternMatcher(pat, target);
        break;
      default:
        throw new Error("Not implemented: " + pat.type);
    }
    this.matchDepth--;
  }

  *printPatTupleStructMatcher(pat: SyntaxNode, target: string): Code {
    const discriminant = this.getDiscriminantId(pat.namedChildren[0].text);
    yield `((_m${this.matchDepth} = _r.matches(${target}, ${discriminant}))`;

    for (let i = 1; i < pat.namedChildren.length; i++) {
      yield `&&`;
      yield* this.printPatMatcher(
        pat.namedChildren[i],
        `_m${this.matchDepth}[${i}]`
      );
    }

    yield ")";
  }

  *printPatIdentMatcher(pat: SyntaxNode, target: string): Code {
    this.matchIdentifiers!.push(pat.text);
    yield `(${pat.text} = ${target})`;
  }

  *printRangePatternMatcher(pat: SyntaxNode, target: string): Code {
    const [start, end] = pat.namedChildren;
    yield `(${target} >= ${start.text} && ${target} <= ${end.text})`;
  }

  *printSlicePatternMatcher(pat: SyntaxNode, target: string): Code {
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
      } else {
        elements.push([hasEllipsis, child]);
      }
    }

    yield `(${target}.length ${hasEllipsis ? ">=" : "==="} ${elements.length} &&`;
    yield `(_m${this.matchDepth} = ${target})`;

    for (let i = 0; i < elements.length; i++) {
      const [byEnd, element] = elements[i];
      yield `&&`;
      yield* this.printPatMatcher(
        element,
        byEnd
          ? `_m${this.matchDepth}.at(${i - elements.length})`
          : `_m${this.matchDepth}[${i}]`
      );
    }

    yield ")";
  }
}
