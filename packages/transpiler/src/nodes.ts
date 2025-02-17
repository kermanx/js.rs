import { SyntaxNode } from "tree-sitter";
import { Code, Context } from "./context";

export declare interface Printer extends Context {}
export class Printer {
  *printFile(file: SyntaxNode): Code {
    yield 'import * as _r from "@jsrs/runtime";\n';
    for (const item of file.children) {
      yield* this.printItem(item);
    }
    yield "var _m";
    for (let i = 0; i < this.maxMatchDepth; i++) {
      yield ",";
      yield `_m${i}`;
    }
    yield ";\n";
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
      case "use_declaration":
        yield* this.printUse(item);
        break;
      default:
        throw new Error("Not implemented: " + item.type);
    }
    yield "\n";
  }

  *printItemFn(fn: SyntaxNode, isDeclaration = true, isClosure = false): Code {
    if (isDeclaration && fn.namedChildren[0]?.type === "visibility_modifier") {
      yield "export ";
    }

    if (!isClosure) {
      yield "function ";

      if (isDeclaration) {
        const name = fn.childForFieldName("name")!;
        yield* this.printIdent(name);
      }
    }

    yield "(";

    const parameters = fn.childForFieldName("parameters")!;
    for (const param of parameters.namedChildren) {
      if (param.type === "self_parameter") {
        continue;
      } else if (param.type === "parameter") {
        yield* this.printPat(param.childForFieldName("pattern")!);
      } else if (
        param.type === "identifier" ||
        param.type === "type_identifier"
      ) {
        yield* this.printIdent(param);
      }
      yield ",";
    }

    yield ") ";

    if (isClosure) {
      yield "=> ";
    }

    const body = fn.childForFieldName("body")!;
    if (body.type === "block") {
      yield* this.printBlock(body, true);
    } else {
      yield* this.printExpr(body);
    }
  }

  *printPat(pat: SyntaxNode): Code {
    switch (pat.type) {
      case "identifier":
        yield* this.printPatIdent(pat);
        break;
      case "slice_pattern":
      case "tuple_pattern":
        yield* this.printPatTuple(pat);
        break;
      case "struct_pattern":
        yield* this.printPatStruct(pat);
        break;

      default:
        throw new Error("Not implemented: " + pat.type);
    }
  }

  *printPatIdent(ident: SyntaxNode): Code {
    yield* this.printIdent(ident);
  }

  *printPatTuple(pat: SyntaxNode): Code {
    yield "[";
    for (const elem of pat.namedChildren) {
      yield* this.printPat(elem);
      yield ",";
    }
    yield "]";
  }

  *printPatStruct(pat: SyntaxNode): Code {
    yield "{";
    for (const field of pat.namedChildren.slice(1)) {
      if (field.type === "remaining_field_pattern") {
        continue;
      }
      const name = field.childForFieldName("name")!;
      const pattern = field.childForFieldName("pattern");
      if (pattern) {
        yield `"${name.text}":`;
        yield* this.printPat(field.childForFieldName("pattern")!);
      } else {
        yield field.text;
      }
      yield ",";
    }
    yield "}";
  }

  *printIdent(ident: SyntaxNode): Code {
    yield ident.text;
  }

  *printBlock(block: SyntaxNode, implicitReturn = false): Code {
    yield "{\n";
    this.blockPostCbs.push([]);

    for (let i = 0; i < block.namedChildren.length; i++) {
      const child = block.namedChildren[i];
      if (i === block.namedChildren.length - 1 && implicitReturn) {
        if (
          child.type.endsWith("_expression") ||
          child.type.endsWith("_literal") ||
          (child.type === "expression_statement" &&
            (child.namedChildren[0].type === "match_expression" ||
              child.namedChildren[0].type === "if_expression"))
        ) {
          yield "return ";
          yield* this.printExpr(child);
          continue;
        }
      }
      yield* this.printStmt(child);
    }

    for (const append of this.blockPostCbs.pop()!.reverse()) {
      yield* append.call(this);
    }

    yield "\n}";
  }

  *printStmt(stmt: SyntaxNode): Code {
    switch (stmt.type) {
      case "expression_statement":
        yield* this.printStmt(stmt.namedChildren[0]);
        break;
      case "let_declaration":
        yield* this.printLocal(stmt);
        break;
      case "match_expression":
        yield* this.printMatch(stmt);
        break;
      case "block":
        yield* this.printBlock(stmt);
        break;
      case "if_expression":
        yield* this.printIf(stmt);
        break;
      case "empty_statement":
        break;
      default:
        yield* this.printExpr(stmt);
    }
    yield ";\n";
  }

  *printLocal(local: SyntaxNode): Code {
    const pattern = local.childForFieldName("pattern")!;
    const alternative = local.childForFieldName("alternative");
    if (alternative) {
      const value = local.childForFieldName("value")!;
      yield "_m0 = _r.destructure(";
      yield* this.printExpr(value);
      yield ");\n";
      yield "if (";
      this.matchIdentifiers = [];
      this.matchDepth = 0;
      yield* this.as_matcher_printer().printPatMatcher(pattern, "_m0");
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
      yield* this.printPat(pattern);
      const value = local.childForFieldName("value");
      if (value) {
        yield " = ";
        if (pattern.type !== "identifier") {
          yield "_r.destructure(";
        }
        yield* this.printExpr(value);
        if (pattern.type !== "identifier") {
          yield ")";
        }
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
      case "boolean_literal":
        yield expr.text;
        break;
      case "string_literal":
        yield JSON.stringify(expr.text);
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
      case "scoped_identifier":
        yield* this.printScopedIdent(expr);
        break;
      case "array_expression":
      case "tuple_expression":
        yield* this.printArray(expr);
        break;
      case "index_expression":
        yield* this.printIndex(expr);
        break;
      case "range_expression":
        yield* this.printRange(expr);
        break;
      case "closure_expression":
        yield* this.printItemFn(expr, false, true);
        break;

      case "expression_statement":
      case "match_expression":
      case "block":
      case "if_expression":
        yield "(do {";
        yield* this.printStmt(expr);
        yield "})";
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

  *printFieldExpr(expr: SyntaxNode): Code {
    const value = expr.childForFieldName("value")!;
    const field = expr.childForFieldName("field")!;

    yield "(";
    this.insideLValue.push(false);
    yield* this.printExpr(value);
    this.insideLValue.pop();
    yield `)`;

    if (/\d/.test(field.text[0])) {
      yield "[";
      yield field.text;
      yield "]";
    } else {
      yield ".";
      yield field.text;
    }
  }

  *printTypeIdent(ident: SyntaxNode): Code {
    switch (ident.type) {
      case "type_identifier":
        yield* this.printIdent(ident);
        break;
      case "generic_type":
        yield* this.printTypeIdent(ident.childForFieldName("type")!);
        break;
      default:
        throw new Error("Not implemented: " + ident.type);
    }
  }

  *printItemImpl(impl: SyntaxNode): Code {
    const type = impl.childForFieldName("type")!;
    const body = impl.childForFieldName("body")!;
    for (const decl of body.namedChildren) {
      yield* this.printTypeIdent(type);

      const isStatic =
        decl.childForFieldName("parameters")!.namedChildren[0]?.type !==
        "self_parameter";
      if (!isStatic) {
        yield ".prototype";
      }

      yield ".";

      const name = decl.childForFieldName("name")!;
      yield* this.printIdent(name);

      yield " = ";

      yield* this.printItemFn(decl, false);

      yield "\n";
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
    if (enm.namedChildren[0]?.type === "visibility_modifier") {
      yield "export ";
    }
    yield "function ";
    const name = enm.childForFieldName("name")!;
    yield* this.printIdent(name);
    yield "() {}\n";

    const body = enm.childForFieldName("body")!;
    for (const variant of body.namedChildren) {
      yield* this.printIdent(name);
      yield ".";

      const variantName = variant.childForFieldName("name")!;
      yield* this.printIdent(variantName);

      yield " = ";

      const body = variant.childForFieldName("body");
      yield body ? "_r.variant(" : "_r.unitVariant(";
      yield this.getDiscriminantId(variantName.text);
      yield ")";

      yield ";\n";
    }
  }

  *printItemStruct(struct: SyntaxNode): Code {
    if (struct.namedChildren[0]?.type === "visibility_modifier") {
      yield "export ";
    }
    yield "function ";
    yield* this.printIdent(struct.childForFieldName("name")!);
    yield "() {}";
  }

  *printUnary(unary: SyntaxNode): Code {
    const op = unary.children[0].type;
    if (op === "*") {
      if (this.isInsideLValue) {
        yield "(";
        this.insideLValue.push(false);
        yield* this.printExpr(unary.children[1]);
        this.insideLValue.pop();
        yield ")[_r.REF_TARGET]";
      } else {
        yield "_r.deref(";
        yield* this.printExpr(unary.children[1]);
        yield ")";
      }
    } else {
      throw new Error("Not implemented: " + op);
    }
  }

  *printAssignment(assignment: SyntaxNode): Code {
    const left = assignment.childForFieldName("left")!;
    const right = assignment.childForFieldName("right")!;
    yield "(";
    this.insideLValue.push(true);
    yield* this.printExpr(left);
    this.insideLValue.pop();
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
      yield "_r.ref(";
      yield* this.printExpr(value);
      yield ", v => (";
      yield* this.printExpr(value);
      yield ") = v)";
    } else {
      yield* this.printExpr(value);
    }
  }

  *printScopedIdent(ident: SyntaxNode): Code {
    let first = true;
    for (const child of ident.namedChildren) {
      if (!first) {
        yield ".";
      }
      first = false;
      yield* this.printIdent(child);
    }
  }

  *printMatch(match: SyntaxNode): Code {
    const value = match.childForFieldName("value")!;
    yield "_m0 = ";
    yield* this.printExpr(value);
    yield ";\n";

    const body = match.childForFieldName("body")!;
    let isFirst = true;
    for (const arm of body.namedChildren) {
      const pattern = arm.childForFieldName("pattern")!.namedChildren[0];

      if (pattern) {
        yield isFirst ? "if (" : "else if (";
        isFirst = false;

        this.matchDepth = 0;
        this.matchIdentifiers = [];
        yield* this.as_matcher_printer().printPatMatcher(pattern, "_m0");
        yield ") {\n";
        if (this.matchIdentifiers.length > 0) {
          yield `var ${this.matchIdentifiers.join(",")};\n`;
        }
      } else {
        yield "else {\n";
      }

      const value = arm.childForFieldName("value")!;
      yield* this.printStmt(value);

      yield "}";
    }
  }

  *printIf(ifExpr: SyntaxNode): Code {
    const condition = ifExpr.childForFieldName("condition")!;
    if (condition.type === "let_condition") {
      const pattern = condition.childForFieldName("pattern")!;
      const value = condition.childForFieldName("value")!;

      yield "_m0 = ";
      yield* this.printExpr(value);
      yield ";\n";
      yield "if (";
      this.matchIdentifiers = [];
      this.matchDepth = 0;
      yield* this.as_matcher_printer().printPatMatcher(pattern, "_m0");
      yield ") {\n";
      if (this.matchIdentifiers.length > 0) {
        yield `var ${this.matchIdentifiers.join(",")};\n`;
      }
    } else {
      yield "if (";
      yield* this.printExpr(ifExpr.childForFieldName("condition")!);
      yield ") {\n";
    }

    yield* this.printStmt(ifExpr.childForFieldName("consequence")!);
    yield "}";

    const alternative = ifExpr.childForFieldName("alternative");
    if (alternative) {
      yield "else ";
      yield* this.printStmt(alternative.namedChildren[0]);
    }
  }

  *printArray(array: SyntaxNode): Code {
    yield "[";
    for (const elem of array.namedChildren) {
      yield* this.printExpr(elem);
      yield ",";
    }
    yield "]";
  }

  *printIndex(index: SyntaxNode): Code {
    if (index.namedChild(1)!.type.endsWith("_literal")) {
      yield "(";
      yield* this.printExpr(index.namedChild(0)!);
      yield ")[";
      yield* this.printExpr(index.namedChild(1)!);
      yield "]";
    } else {
      yield "_r.index(";
      yield* this.printExpr(index.namedChild(0)!);
      yield ",";
      yield* this.printExpr(index.namedChild(1)!);
      yield ")";
    }
  }

  *printRange(range: SyntaxNode): Code {
    yield "_r.range(";
    yield* this.printExpr(range.child(0)!);
    yield ",";
    yield* this.printExpr(range.child(2)!);
    if (range.child(1)!.type === "..=") {
      yield "+1";
    }
    yield ")";
  }

  *printUse(use: SyntaxNode): Code {
    this.reexportsNamed = [];
    this.reexportsAll = [];
    yield* this.printUseItem(use.childForFieldName("argument")!);
    if (use.namedChildren[0]?.type === "visibility_modifier") {
      if (this.reexportsNamed.length) {
        yield "export {";
        yield this.reexportsNamed.join(", ");
        yield "};\n";
      }
      if (this.reexportsAll.length) {
        for (const path of this.reexportsAll) {
          yield `export * from "${path}";\n`;
        }
      }
    } else {
      if (this.reexportsAll.length) {
        throw new Error("Wildcard import is not supported");
      }
    }
  }

  *printUseItem(item: SyntaxNode, base: string = "", alias?: string): Code {
    switch (item.type) {
      case "scoped_use_list": {
        const path = getPath(item.namedChildren[0]);
        let wildcard: string | undefined;
        const named: [string, string?][] = [];
        for (const child of item.namedChildren[1].namedChildren) {
          if (child.type === "self") {
            wildcard = getSelfName(item.namedChildren[0]);
          } else if (child.type === "identifier") {
            named.push([child.text]);
          } else if (child.type === "use_as_clause") {
            const original = child.namedChildren[0];
            const alias = child.namedChildren[1].text;
            if (original.type === "self") {
              wildcard = alias;
            } else if (original.type === "identifier") {
              named.push([original.text, alias]);
            } else {
              yield* this.printUseItem(original, path, alias);
            }
          } else {
            yield* this.printUseItem(child, path);
          }
        }
        if (wildcard) {
          this.reexportsNamed.push(wildcard);
          yield `import * as ${wildcard} from "${path}";\n`;
        }
        if (named.length > 0) {
          yield "import {";
          for (const [name, alias] of named) {
            this.reexportsNamed.push(alias || name);
            yield ` ${name}${alias ? ` as ${alias}` : ""},`;
          }
          yield ` } from "${path}";\n`;
        }
        break;
      }
      case "scoped_identifier": {
        const path = getPath(item.namedChildren[0]);
        const name = item.namedChildren[1].text;
        if (name === "self") {
          const name = alias || getSelfName(item.namedChildren[0]);
          this.reexportsNamed.push(name);
          yield `import * as ${name} from "${path}";\n`;
        } else {
          this.reexportsNamed.push(alias || name);
          yield `import { ${name}${alias ? ` as ${alias}` : ""} } from "${path}";\n`;
        }
        break;
      }
      case "use_as_clause": {
        const original = item.namedChildren[0];
        yield* this.printUseItem(original, "", alias);
        break;
      }
      case "use_wildcard": {
        const path = getPath(item.namedChildren[0]);
        this.reexportsAll.push(path);
        break;
      }
      default:
        throw new Error("Not implemented: " + item.type);
    }

    function getPath(path: SyntaxNode): string {
      return base ? `${base}/${getPathImpl(path)}` : getPathImpl(path);
    }

    function getPathImpl(path: SyntaxNode): string {
      if (path.type === "identifier") {
        return `${path.text}`;
      } else if (path.type === "scoped_identifier") {
        return `${getPathImpl(path.namedChildren[0])}/${path.namedChildren[1].text}`;
      } else if (path.type === "crate") {
        return `@`;
      } else {
        throw new Error("Not implemented: " + path.type);
      }
    }

    function getSelfName(path: SyntaxNode): string {
      if (path.type === "identifier") {
        return path.text;
      } else if (path.type === "scoped_identifier") {
        return path.namedChildren[1].text;
      } else if (path.type === "crate") {
        return "crate";
      } else {
        throw new Error("Not implemented: " + path.type);
      }
    }
  }
}
