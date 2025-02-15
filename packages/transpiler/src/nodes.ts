import { SyntaxNode } from "tree-sitter";
import { Code, Context } from "./context";

export declare interface Printer extends Context {}
export class Printer {
  *printFile(file: SyntaxNode): Code {
    for (const item of file.children) {
      yield* this.printItem(item);
    }
  }

  *printItem(item: SyntaxNode): Code {
    switch (item.type) {
      case "function_item":
        yield* this.printItemFn(item);
        break;
      case "enum_item":
        // Do nothing for now
        break;
      default:
        throw new Error("Not implemented: " + item.type);
    }
    yield "\n";
  }

  *printItemFn(fn: SyntaxNode): Code {
    const vis = fn.childForFieldName("visibility_modifier");
    if (vis) {
      yield* this.printVisibility(vis);
    }

    yield "function ";

    const name = fn.childForFieldName("name")!;
    yield* this.printIdent(name);

    yield "(";

    const parameters = fn.childForFieldName("parameters")!;
    for (const param of parameters.namedChildren) {
      yield* this.printPatType(param.childForFieldName("pattern")!);
      yield ",";
    }

    yield ") ";

    const body = fn.childForFieldName("body")!;
    yield* this.printBlock(body);
  }

  *printVisibility(vis: SyntaxNode): Code {
    if (vis.type === "public" || vis.type === "restricted") {
      yield "export ";
    }
  }

  *printPatType(pat: SyntaxNode): Code {
    yield* this.printPat(pat);
  }

  *printPat(pat: SyntaxNode): Code {
    switch (pat.type) {
      case "identifier":
        yield* this.printPatIdent(pat);
        break;
      case "tupleStruct":
        yield* this.printPatTupleStruct(pat);
        break;
      default:
        throw new Error("Not implemented: " + pat.type);
    }
  }

  *printPatTupleStruct(pat: SyntaxNode): Code {
    yield "[";
    for (const elem of pat.namedChildren) {
      yield* this.printPat(elem);
      yield ",";
    }
    yield "]";
  }

  *printPatIdent(ident: SyntaxNode): Code {
    yield* this.printIdent(ident);
  }

  *printIdent(ident: SyntaxNode): Code {
    yield ident.text;
  }

  *printBlock(block: SyntaxNode): Code {
    yield "{\n";
    this.blockPostCbs.push([]);

    for (const stmt of block.namedChildren) {
      yield* this.printStmt(stmt);
    }

    for (const append of this.blockPostCbs.pop()!.reverse()) {
      yield* append.call(this);
    }

    yield "\n}";
  }

  *printStmt(stmt: SyntaxNode): Code {
    switch (stmt.type) {
      case "local":
        yield* this.printLocal(stmt);
        break;
      default:
        yield* this.printExpr(stmt);
    }
    yield ";\n";
  }

  *printLocal(local: SyntaxNode): Code {
    const alternative = local.childForFieldName("alternative");
    if (alternative) {
      const value = local.childForFieldName("value")!;
      yield "_m0 = ";
      yield* this.printExpr(value);
      yield ";\n";
      yield "if (";
      this.matchIdentifiers = [];
      this.matchDepth = 0;
      yield* this.as_matcher_printer().printPatMatcher(
        local.childForFieldName("pattern")!,
        "_m0"
      );
      yield ") {\n";
      if (this.matchIdentifiers.length > 0) {
        yield `var ${this.matchIdentifiers.join(",")};\n`;
      }

      this.blockPost(function* () {
        yield "} else";
        yield* this.printBlock(alternative.namedChildren[0]);
      });
    } else {
      yield "var ";
      yield* this.printPat(local.childForFieldName("pattern")!);
      const value = local.childForFieldName("value");
      if (value) {
        yield* this.printExpr(value);
      }
      yield ";";
    }
  }

  *printExpr(expr: SyntaxNode): Code {
    switch (expr.type) {
      case "identifier":
        yield* this.printIdent(expr);
        break;
      case "integer_literal":
        yield expr.text;
        break;
      case "binary_expression":
        yield* this.printBinary(expr);
        break;
      case "return_expression":
        yield* this.printReturn(expr);
        break;
      case "expression_statement":
        yield* this.printExprBlock(expr);
        break;
      case "let_declaration":
        yield* this.printLocal(expr);
        break;
      default:
        throw new Error("Not implemented: " + expr.type);
    }
  }

  *printBinary(binary: SyntaxNode): Code {
    yield* this.printExpr(binary.children[0]);
    yield* this.printBinOp(binary.children[1]);
    yield* this.printExpr(binary.children[2]);
  }

  *printBinOp(op: SyntaxNode): Code {
    yield op.type;
  }

  *printReturn(ret: SyntaxNode): Code {
    yield "return ";
    const value = ret.namedChildren[0];
    if (value) {
      yield* this.printExpr(value);
    }
    yield ";";
  }

  *printExprBlock(block: SyntaxNode): Code {
    yield "(() => {";
    yield* this.printBlock(block);
    yield "})()";
  }
}
