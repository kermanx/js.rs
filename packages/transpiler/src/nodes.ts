import { SyntaxNode } from "tree-sitter";
import { Context } from "./context";

export declare interface Printer extends Context {}
export class Printer {
  printFile(file: SyntaxNode) {
    for (const item of file.children) {
      this.printItem(item);
    }
  }

  printItem(item: SyntaxNode) {
    switch (item.type) {
      case "function_item":
        this.printItemFn(item);
        break;
      case "enum_item":
        // Do nothing for now
        break;
      default:
        throw new Error("Not implemented: " + item.type);
    }
    this.push("\n");
  }

  printItemFn(fn: SyntaxNode) {
    const vis = fn.childForFieldName("visibility_modifier");
    vis && this.printVisibility(vis);

    this.push("function ");

    const name = fn.childForFieldName("name")!;
    this.printIdent(name);

    this.push("(");

    const parameters = fn.childForFieldName("parameters")!;
    for (const param of parameters.namedChildren) {
      this.printPatType(param.childForFieldName("pattern")!);
      this.push(",");
    }

    this.push(") ");

    const body = fn.childForFieldName("body")!;
    this.printBlock(body);
  }

  printVisibility(vis: SyntaxNode) {
    if (vis.type === "public" || vis.type === "restricted") {
      this.push("export ");
    }
  }

  printPatType(pat: SyntaxNode) {
    this.printPat(pat);
  }

  printPat(pat: SyntaxNode) {
    switch (pat.type) {
      case "identifier":
        this.printPatIdent(pat);
        break;
      case "tupleStruct":
        this.printPatTupleStruct(pat);
        break;
      default:
        throw new Error("Not implemented: " + pat.type);
    }
  }

  printPatTupleStruct(pat: SyntaxNode) {
    this.push("[");
    for (const elem of pat.namedChildren) {
      this.printPat(elem);
      this.push(",");
    }
    this.push("]");
  }

  printPatIdent(ident: SyntaxNode) {
    this.printIdent(ident);
  }

  printIdent(ident: SyntaxNode) {
    this.push(ident.text);
  }

  printBlock(block: SyntaxNode) {
    this.push("{\n");
    this.blockPostCbs.push([]);

    for (const stmt of block.namedChildren) {
      this.printStmt(stmt);
    }

    for (const append of this.blockPostCbs.pop()!.reverse()) {
      append();
    }

    this.push("\n}");
  }

  printStmt(stmt: SyntaxNode) {
    switch (stmt.type) {
      case "local":
        this.printLocal(stmt);
        break;
      default:
        this.printExpr(stmt);
    }
    this.push(";\n");
  }

  printLocal(local: SyntaxNode) {
    const alternative = local.childForFieldName("alternative");
    if (alternative) {
      const value = local.childForFieldName("value")!;
      this.push("_m0 = ");
      this.printExpr(value);
      this.push(";\n");
      this.push("if (");
      this.matchIdentifiers = [];
      this.matchDepth = 0;
      this.as_matcher_printer().printPatMatcher(
        local.childForFieldName("pattern")!,
        "_m0"
      );
      this.push(") {\n");
      if (this.matchIdentifiers.length > 0) {
        this.push(`var ${this.matchIdentifiers.join(",")};\n`);
      }

      this.blockPost(() => {
        this.push("} else");
        this.printBlock(alternative.namedChildren[0]);
      });
    } else {
      this.push("var ");
      this.printPat(local.childForFieldName("pattern")!);
      const value = local.childForFieldName("value");
      if (value) {
        this.printExpr(value);
      }
      this.push(";");
    }
  }

  printExpr(expr: SyntaxNode) {
    switch (expr.type) {
      case "identifier":
        this.printIdent(expr);
        break;
      case "integer_literal":
        this.push(expr.text);
        break;
      case "binary_expression":
        this.printBinary(expr);
        break;
      case "return_expression":
        this.printReturn(expr);
        break;
      case "expression_statement":
        this.printExprBlock(expr);
        break;
      case "let_declaration":
        this.printLocal(expr);
        break;
      default:
        throw new Error("Not implemented: " + expr.type);
    }
  }

  printBinary(binary: SyntaxNode) {
    this.printExpr(binary.children[0]);
    this.printBinOp(binary.children[1]);
    this.printExpr(binary.children[2]);
  }

  printBinOp(op: SyntaxNode) {
    this.push(op.type);
  }

  printReturn(ret: SyntaxNode) {
    this.push("return ");
    const value = ret.namedChildren[0];
    if (value) {
      this.printExpr(value);
    }
    this.push(";");
  }

  printExprBlock(block: SyntaxNode) {
    this.push("(() => {");
    this.printBlock(block);
    this.push("})()");
  }
}
