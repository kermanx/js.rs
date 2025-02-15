import { SyntaxNode } from "tree-sitter";
import { Context } from "./context";

export declare interface MatcherPrinter extends Context {}
export class MatcherPrinter {
  printPatMatcher(pat: SyntaxNode, target: string) {
    this.matchDepth++;
    switch (pat.type) {
      case "identifier":
        this.printPatIdentMatcher(pat, target);
        break;
      case "tuple_struct_pattern":
        this.printPatTupleStructMatcher(pat, target);
        break;
      default:
        throw new Error("Not implemented: " + pat.type);
    }
    this.matchDepth--;
  }

  printPatTupleStructMatcher(pat: SyntaxNode, target: string) {
    const discriminant = this.getDiscriminantId(pat.namedChildren[0].text);
    this.push(`(_m${this.matchDepth} = matches(${target}, ${discriminant})`);

    for (let i = 1; i < pat.namedChildren.length; i++) {
      this.push(`&&`);
      this.printPatMatcher(pat.namedChildren[i], `_m${this.matchDepth}[${i}]`);
    }

    this.push(")");
  }

  printPatIdentMatcher(pat: SyntaxNode, target: string) {
    this.matchIdentifiers!.push(pat.text);
    this.push(`(${pat.text} = ${target})`);
  }
}
