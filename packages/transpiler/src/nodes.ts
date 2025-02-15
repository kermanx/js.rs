import { SyntaxNode } from "tree-sitter";
import { Code, Context } from "./context";

export declare interface Printer extends Context {}
export class Printer {
  *printFile(file: SyntaxNode): Code {
    yield "import * as _h from \"@jsrs/helpers\";\n";
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
        yield* this.printItemEnum(item);
        break;
      case "struct_item":
        yield* this.printItemStruct(item);
        break;
      case "impl_item":
        yield* this.printItemImpl(item);
        break;
      case "line_comment":
        break;
      default:
        throw new Error("Not implemented: " + item.type);
    }
    yield "\n";
  }

  *printItemFn(fn: SyntaxNode, isDeclaration = true): Code {
    if (isDeclaration) {
      const vis = fn.childForFieldName("visibility_modifier");
      if (vis) {
        yield* this.printVisibility(vis);
      }

      yield "function ";
    }

    const name = fn.childForFieldName("name")!;

    if (!isDeclaration) {
      yield `"`;
    }
    yield* this.printIdent(name);
    if (!isDeclaration) {
      yield `"`;
    }

    yield "(";

    const parameters = fn.childForFieldName("parameters")!;
    for (const param of parameters.namedChildren) {
      if (param.type === "self_parameter") continue;
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
      case "expression_statement":
        yield* this.printExpr(stmt.namedChildren[0]);
        break;
      case "let_declaration":
        yield* this.printLocal(stmt);
        break;
      default:
        if (stmt.type.endsWith("_expression")) {
          if (stmt.type !== "return_expression") {
            yield "return ";
          }
          yield* this.printExpr(stmt);
        } else {
          throw new Error("Not implemented: " + stmt.type);
        }
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
        yield " = ";
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
      case "unary_expression":
        yield* this.printUnary(expr);
        break;
      case "return_expression":
        yield* this.printReturn(expr);
        break;
      case "struct_expression":
        yield* this.printStruct(expr);
        break;
      case "field_expression":
        yield* this.printFieldExpr(expr);
        break;
      case "self":
        yield "this";
        break;
      case "assignment_expression":
        yield* this.printAssignment(expr);
        break;
      case "call_expression":
        yield* this.printCall(expr);
        break;
      case "reference_expression":
        yield* this.printReference(expr);
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

  *printFieldExpr(expr: SyntaxNode): Code {
    const value = expr.childForFieldName("value")!;
    const field = expr.childForFieldName("field")!;

    yield "(";
    yield* this.printExpr(value);
    yield `)["${field.text}"]`;
  }

  *printTypeIdent(ident: SyntaxNode): Code {
    yield* this.printIdent(ident);
  }

  *printItemImpl(impl: SyntaxNode): Code {
    const type = impl.childForFieldName("type")!;
    yield "_h.impl(";
    yield* this.printTypeIdent(type);
    yield ",{\n";

    const body = impl.childForFieldName("body")!;
    yield* this.printDeclarationList(body);

    yield "})";
  }

  *printDeclarationList(decls: SyntaxNode): Code {
    for (const decl of decls.namedChildren) {
      yield* this.printItemFn(decl, false);
      yield ",\n";
    }
  }

  *printStruct(struct: SyntaxNode): Code {
    yield "({";
    for (const field of struct.childForFieldName("body")!.namedChildren) {
      switch (field.type) {
        case "shorthand_field_initializer":
          yield `${field.text},`;
          break;
        case "field_initializer":
          yield `["${field.childForFieldName("field")!.text}"]:`;
          yield* this.printExpr(field.childForFieldName("value")!);
          yield ",";
          break;
        default:
          throw new Error("Not implemented: " + field.type);
      }
    }
    yield "})";
  }

  *printItemEnum(enm: SyntaxNode): Code {
    yield "class ";
    yield* this.printIdent(enm.childForFieldName("name")!);
    yield " {}";
  }

  *printItemStruct(struct: SyntaxNode): Code {
    yield "class ";
    yield* this.printIdent(struct.childForFieldName("name")!);
    yield " {}";
  }

  *printUnary(unary: SyntaxNode): Code {
    const op = unary.children[0].type;
    if (op === "*") {
      yield "(";
      yield* this.printExpr(unary.children[1]);
      yield ").v";
    } else {
      throw new Error("Not implemented: " + op);
    }
  }

  *printAssignment(assignment: SyntaxNode): Code {
    const left = assignment.childForFieldName("left")!;
    const right = assignment.childForFieldName("right")!;
    yield "(";
    yield* this.printExpr(left);
    yield " = ";
    yield* this.printExpr(right);
    yield ")";
  }

  *printCall(call: SyntaxNode): Code {
    const fn = call.childForFieldName("function")!;
    yield "(";
    yield* this.printExpr(fn);
    yield ")(";
    const args = call.childForFieldName("arguments")!;
    for (const arg of args.namedChildren) {
      yield* this.printExpr(arg);
      yield ",";
    }
    yield ")";
  }

  *printReference(ref: SyntaxNode): Code {
    const isMut = ref.childCount === 3;
    const value = ref.childForFieldName("value")!;

    if (isMut) {
      yield "_h.refMut(() => (";
      yield* this.printExpr(value);
      yield "), v => (";
      yield* this.printExpr(value);
      yield ") = v)";
    } else {
      yield "_h.ref(() => (";
      yield* this.printExpr(value);
      yield "))";
    }
  }
}
