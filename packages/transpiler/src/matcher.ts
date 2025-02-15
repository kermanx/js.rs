import { SyntaxNode } from "tree-sitter";
import { Code, Context } from "./context";

export declare interface MatcherPrinter extends Context {}
export class MatcherPrinter {
  *printPatMatcher(pat: SyntaxNode, target: string): Code {
    this.matchDepth++;
    switch (pat.type) {
      case "identifier":
        yield* this.printPatIdentMatcher(pat, target);
        break;
      case "tuple_struct_pattern":
        yield* this.printPatTupleStructMatcher(pat, target);
        break;
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
      yield* this.printPatMatcher(pat.namedChildren[i], `_m${this.matchDepth}[${i}]`);
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
}
