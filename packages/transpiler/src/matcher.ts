import { SyntaxNode } from "tree-sitter";
import { Context } from "./context";

export declare interface MatcherPrinter extends Context {}
export class MatcherPrinter {
  printPatMatcher(pat: SyntaxNode, target: number) {
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
  }

  printPatTupleStructMatcher(pat: SyntaxNode, target: number) {
    this.push(`if (_m = matches(_m${target}, `);
    const discriminant = this.getDiscriminantId(pat.namedChildren[0].text);
    this.push(String(discriminant));
    this.push(")) {\n");

    this.push("let [");
    for (let i = 1; i < pat.namedChildren.length; i++) {
      this.push(`_m${i},`);
    }
    this.push(`] = _m${target};\n`);

    for (let i = 1; i < pat.namedChildren.length; i++) {
      this.printPatMatcher(pat.namedChildren[i], i);
    }

    this.matcherQuotes++;
  }

  printPatIdentMatcher(pat: SyntaxNode, target: number) {
    this.push("var ");
    this.push(pat.text);
    this.push(` = _m${target};\n`);
  }
}
