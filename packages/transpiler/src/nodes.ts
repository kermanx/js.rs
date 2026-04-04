import type { SyntaxNode } from "tree-sitter";
import type { Code } from "./transpiler";
import { defineTranspilerComponent } from "./transpiler";

type T = typeof _T;
declare module "./transpiler" {
  interface Transpiler extends T {}
}

const IDENTIFIER_RE = /^[a-z_$][\w$]*$/i;

const _T = defineTranspilerComponent({
  * File(file: SyntaxNode): Code {
    yield "import * as _r from \"@jsrs/runtime\";\n";
    for (const item of file.children) {
      yield* this.Stmt(item);
    }
  },

  * ItemFn(fn: SyntaxNode, isDeclaration = true, isClosure = false): Code {
    if (isDeclaration && fn.namedChildren[0]?.type === "visibility_modifier") {
      yield "export ";
    }

    const modifiers = fn.namedChildren.find(child => child.type === "function_modifiers")?.text || "";
    const isAsync = modifiers.includes("async");

    if (!isClosure) {
      if (isAsync) {
        yield "async ";
      }
      yield "function ";

      if (isDeclaration) {
        const name = fn.childForFieldName("name")!;
        yield* this.Ident(name);
      }
    }
    else if (isAsync) {
      yield "async ";
    }

    yield "(";

    const parameters = fn.childForFieldName("parameters")!;
    for (const param of parameters.namedChildren) {
      let emitted = false;
      if (param.type === "self_parameter") {
        continue;
      }
      else if (param.type === "parameter") {
        yield* this.Pat(param.childForFieldName("pattern")!);
        emitted = true;
      }
      else if (param.type === "identifier") {
        yield* this.Ident(param);
        emitted = true;
      }
      else if (param.type === "type_identifier") {
        yield* this.Ident(param);
        emitted = true;
      }
      if (emitted) {
        yield ",";
      }
    }

    yield ") ";

    if (isClosure) {
      yield "=> ";
    }

    const body = fn.childForFieldName("body")!;
    if (body.type === "block") {
      yield* this.Block(body, true);
    }
    else {
      yield* this.Expr(body);
    }
  },

  * Pat(pat: SyntaxNode): Code {
    switch (pat.type) {
      case "identifier":
        yield* this.PatIdent(pat);
        break;
      case "slice_pattern":
      case "tuple_pattern":
        yield* this.PatTuple(pat);
        break;
      case "struct_pattern":
        yield* this.PatStruct(pat);
        break;

      default:
        throw new Error(`Not implemented: ${pat.type}`);
    }
  },

  * PatIdent(ident: SyntaxNode): Code {
    yield* this.Ident(ident);
  },

  * PatTuple(pat: SyntaxNode): Code {
    yield "[";
    for (const elem of pat.namedChildren) {
      yield* this.Pat(elem);
      yield ",";
    }
    yield "]";
  },

  * PatStruct(pat: SyntaxNode): Code {
    yield "{";
    for (const field of pat.namedChildren.slice(1)) {
      if (field.type === "remaining_field_pattern") {
        continue;
      }
      const name = field.childForFieldName("name")!;
      const pattern = field.childForFieldName("pattern");
      if (pattern) {
        yield name;
        yield ": ";
        yield* this.Pat(field.childForFieldName("pattern")!);
      }
      else {
        yield field;
      }
      yield ",";
    }
    yield "}";
  },

  * Ident(ident: SyntaxNode): Code {
    yield ident;
  },

  * Block(block: SyntaxNode, implicitReturn = false): Code {
    yield "{\n";
    this.blockPostCbs.push([]);

    for (let i = 0; i < block.namedChildren.length; i++) {
      const child = block.namedChildren[i];
      if (i === block.namedChildren.length - 1 && implicitReturn) {
        if (
          child.type.endsWith("_expression")
          || child.type.endsWith("_literal")
          || child.type.endsWith("identifier")
          || (child.type === "expression_statement"
            && (child.namedChildren[0].type === "match_expression"
              || child.namedChildren[0].type === "if_expression"))
        ) {
          yield "return ";
          yield* this.Expr(child);
          continue;
        }
      }
      yield* this.Stmt(child);
    }

    for (const append of this.blockPostCbs.pop()!.reverse()) {
      yield* append.call(this);
    }

    yield "\n}";
  },

  * Stmt(node: SyntaxNode): Code {
    switch (node.type) {
      case "function_item":
        yield* this.ItemFn(node);
        break;
      case "enum_item":
        yield* this.ItemEnum(node);
        break;
      case "struct_item":
        yield* this.ItemStruct(node);
        break;
      case "impl_item":
        yield* this.ItemImpl(node);
        break;
      case "const_item":
        yield* this.ItemConst(node);
        break;
      case "static_item":
        yield* this.ItemStatic(node);
        break;
      case "type_item":
        yield* this.ItemType(node);
        break;
      case "trait_item":
        yield* this.ItemTrait(node);
        break;
      case "line_comment":
        break;
      case "use_declaration":
        yield* this.Use(node);
        break;
      case "expression_statement":
        yield* this.Stmt(node.namedChildren[0]);
        break;
      case "let_declaration":
        yield* this.Local(node);
        break;
      case "match_expression":
        yield* this.Match(node);
        break;
      case "block":
        yield* this.Block(node);
        break;
      case "const_block":
        yield* this.Block(node.childForFieldName("body") || node.namedChildren[0]);
        break;
      case "if_expression":
        yield* this.If(node);
        break;
      case "loop_expression":
        yield* this.Loop(node);
        break;
      case "while_expression":
        yield* this.While(node);
        break;
      case "for_expression":
        yield* this.For(node);
        break;
      case "break_expression":
        yield* this.Break(node);
        break;
      case "continue_expression":
        yield* this.Continue(node);
        break;
      case "empty_statement":
        break;
      default:
        yield* this.Expr(node);
    }
    yield ";\n";
  },

  * Local(local: SyntaxNode): Code {
    const pattern = local.childForFieldName("pattern")!;
    const alternative = local.childForFieldName("alternative");
    if (alternative) {
      const value = local.childForFieldName("value")!;
      const temp = this.newTempVar(local);
      yield `const ${temp} = _r.destruct(`;
      yield* this.Expr(value);
      yield ");\n";
      yield "if (";
      this.matchIdentifiers = [];
      yield* this.PatMatcher(pattern, temp);
      yield ") {\n";
      if (this.matchIdentifiers.length > 0) {
        yield [`var ${this.matchIdentifiers.join(",")};\n`, local.startPosition];
      }

      this.blockPost(function* () {
        yield "} else";
        yield* this.Block(alternative.namedChildren[0]);
      });
    }
    else {
      yield "var ";
      yield* this.Pat(pattern);
      const value = local.childForFieldName("value");
      if (value) {
        yield " = ";
        if (pattern.type !== "identifier") {
          yield "_r.destruct(";
        }
        yield* this.Expr(value);
        if (pattern.type !== "identifier") {
          yield ")";
        }
      }
      yield ";";
    }
  },

  * Expr(expr: SyntaxNode): Code {
    switch (expr.type) {
      case "identifier":
        yield* this.Ident(expr);
        break;
      case "integer_literal":
      case "boolean_literal":
      case "string_literal":
      case "null_literal":
      case "undefined_literal":
        yield expr;
        break;
      case "binary_expression":
        yield* this.Binary(expr);
        break;
      case "unary_expression":
        yield* this.Unary(expr);
        break;
      case "compound_assignment_expr":
        yield* this.CompoundAssignment(expr);
        break;
      case "return_expression":
        yield* this.Return(expr);
        break;
      case "struct_expression":
        yield* this.Struct(expr);
        break;
      case "field_expression":
        yield* this.FieldExpr(expr);
        break;
      case "self":
        yield "this";
        break;
      case "assignment_expression":
        yield* this.Assignment(expr);
        break;
      case "call_expression":
        yield* this.Call(expr);
        break;
      case "reference_expression":
        yield* this.Reference(expr);
        break;
      case "scoped_identifier":
        yield* this.ScopedIdent(expr);
        break;
      case "array_expression":
      case "tuple_expression":
        yield* this.Array(expr);
        break;
      case "index_expression":
        yield* this.Index(expr);
        break;
      case "range_expression":
        yield* this.Range(expr);
        break;
      case "closure_expression":
        yield* this.ItemFn(expr, false, true);
        break;
      case "generic_function":
        yield* this.GenericFunction(expr);
        break;
      case "type_cast_expression":
        yield* this.TypeCast(expr);
        break;
      case "await_expression":
        yield* this.Await(expr);
        break;
      case "async_block":
        yield* this.AsyncBlock(expr);
        break;
      case "try_expression":
        yield* this.Try(expr);
        break;
      case "parenthesized_expression":
        yield "(";
        yield* this.Expr(expr.namedChildren[0]);
        yield ")";
        break;
      case "expression_statement":
        yield* this.Expr(expr.namedChildren[0]);
        break;

      case "match_expression":
      case "block":
      case "const_block":
      case "if_expression":
      case "loop_expression":
      case "while_expression":
      case "for_expression":
        yield "(do {";
        yield* this.Stmt(expr);
        yield "})";
        break;
      case "break_expression":
        yield* this.Break(expr);
        break;
      case "continue_expression":
        yield* this.Continue(expr);
        break;
      default:
        throw new Error(`Not implemented: ${expr.type}`);
    }
  },

  * Binary(binary: SyntaxNode): Code {
    yield* this.Expr(binary.children[0]);
    yield* this.BinOp(binary.children[1]);
    yield* this.Expr(binary.children[2]);
  },

  * BinOp(op: SyntaxNode): Code {
    yield op.type;
  },

  * Return(ret: SyntaxNode): Code {
    yield "return ";
    const value = ret.namedChildren[0];
    if (value) {
      yield* this.Expr(value);
    }
    yield ";";
  },

  * FieldExpr(expr: SyntaxNode): Code {
    const value = expr.childForFieldName("value")!;
    const field = expr.childForFieldName("field")!;

    this.insideLValue.push(false);
    yield* this.Expr(value);
    this.insideLValue.pop();

    if (field.type === "integer_literal") {
      yield "[";
      yield field;
      yield "]";
    }
    else {
      yield ".";
      yield field;
    }
  },

  * TypeIdent(ident: SyntaxNode): Code {
    switch (ident.type) {
      case "type_identifier":
      case "scoped_type_identifier":
        yield* this.Ident(ident);
        break;
      case "generic_type":
        yield* this.TypeIdent(ident.childForFieldName("type")!);
        break;
      default:
        throw new Error(`Not implemented: ${ident.type}`);
    }
  },

  * ItemImpl(impl: SyntaxNode): Code {
    const type = impl.childForFieldName("type")!;
    const trait = impl.childForFieldName("trait");
    const body = impl.childForFieldName("body")!;

    if (trait) {
      yield "_r.implTrait(";
      yield* this.TypeIdent(type);
      yield ", ";
      yield* this.TypeIdent(trait);
      yield ");\n";
    }

    for (const decl of body.namedChildren) {
      if (decl.type === "function_item") {
        yield* this.TypeIdent(type);

        const isStatic
          = decl.childForFieldName("parameters")!.namedChildren[0]?.type
            !== "self_parameter";
        if (!isStatic) {
          yield ".prototype";
        }

        yield ".";

        const name = decl.childForFieldName("name")!;
        yield* this.Ident(name);

        yield " = ";

        yield* this.ItemFn(decl, false);

        yield "\n";
      }
      else if (decl.type === "const_item") {
        yield* this.ImplAssocConst(type, decl);
      }
      else if (decl.type === "type_item") {
        yield* this.ImplAssocType(type, decl);
      }
    }
  },

  * ImplAssocConst(ownerType: SyntaxNode, decl: SyntaxNode): Code {
    yield* this.TypeIdent(ownerType);
    yield ".";
    yield* this.Ident(decl.childForFieldName("name")!);
    yield " = ";
    const value = decl.childForFieldName("value");
    if (value) {
      yield* this.Expr(value);
    }
    else {
      yield "undefined";
    }
    yield "\n";
  },

  * ImplAssocType(ownerType: SyntaxNode, decl: SyntaxNode): Code {
    yield* this.TypeIdent(ownerType);
    yield ".";
    yield decl.childForFieldName("name")!;
    yield " = ";
    yield* this.Type(decl.childForFieldName("type")!);
    yield "\n";
  },

  * Struct(struct: SyntaxNode): Code {
    yield "({";
    for (const field of struct.childForFieldName("body")!.namedChildren) {
      switch (field.type) {
        case "shorthand_field_initializer":
          yield field;
          yield ",";
          break;
        case "field_initializer":
          yield `["`;
          yield field.childForFieldName("field")!;
          yield `"]: `;
          yield* this.Expr(field.childForFieldName("value")!);
          yield ",";
          break;
        default:
          throw new Error(`Not implemented: ${field.type}`);
      }
    }
    yield "})";
  },

  * ItemEnum(enm: SyntaxNode): Code {
    if (enm.namedChildren[0]?.type === "visibility_modifier") {
      yield "export ";
    }
    yield "function ";
    const name = enm.childForFieldName("name")!;
    yield* this.Ident(name);
    yield "() {}\n";

    const body = enm.childForFieldName("body")!;
    let discriminant = 0;
    for (const variant of body.namedChildren) {
      yield* this.Ident(name);
      yield ".";

      const variantName = variant.childForFieldName("name")!;
      yield* this.Ident(variantName);

      yield " = ";

      const body = variant.childForFieldName("body");
      yield body ? ["_r.variant(", variant.startPosition] : ["_r.unitVariant(", variant.startPosition];
      yield [`${discriminant++}`, variantName.startPosition];
      yield ")";

      yield ";\n";
    }
  },

  * ItemStruct(struct: SyntaxNode): Code {
    if (struct.namedChildren[0]?.type === "visibility_modifier") {
      yield "export ";
    }
    yield "function ";
    yield* this.Ident(struct.childForFieldName("name")!);
    yield "() {}";
  },

  * ItemConst(item: SyntaxNode): Code {
    if (item.namedChildren[0]?.type === "visibility_modifier") {
      yield "export ";
    }
    yield "const ";
    yield* this.Ident(item.childForFieldName("name")!);
    yield " = ";
    const value = item.childForFieldName("value");
    if (value) {
      yield* this.Expr(value);
    }
    else {
      yield "undefined";
    }
  },

  * ItemStatic(item: SyntaxNode): Code {
    if (item.namedChildren[0]?.type === "visibility_modifier") {
      yield "export ";
    }
    const isMut = item.namedChildren.some(child => child.type === "mutable_specifier");
    yield isMut ? "let " : "const ";
    yield* this.Ident(item.childForFieldName("name")!);
    yield " = ";
    const value = item.childForFieldName("value");
    if (value) {
      yield* this.Expr(value);
    }
    else {
      yield "undefined";
    }
  },

  * ItemType(item: SyntaxNode): Code {
    if (item.namedChildren[0]?.type === "visibility_modifier") {
      yield "export ";
    }
    yield "const ";
    yield item.childForFieldName("name")!;
    yield " = ";
    yield* this.Type(item.childForFieldName("type")!);
  },

  * ItemTrait(item: SyntaxNode): Code {
    if (item.namedChildren[0]?.type === "visibility_modifier") {
      yield "export ";
    }

    const traitName = item.childForFieldName("name")!;
    yield "function ";
    yield traitName;
    yield "() {}\n";

    const body = item.childForFieldName("body")!;
    for (const decl of body.namedChildren) {
      if (decl.type === "function_item") {
        yield* this.TraitMethodFromFunction(traitName.text, decl);
      }
      else if (decl.type === "function_signature_item") {
        yield* this.TraitMethodFromSignature(traitName.text, decl);
      }
      else if (decl.type === "const_item") {
        yield* this.TraitAssocConst(traitName.text, decl);
      }
      else if (decl.type === "type_item") {
        yield* this.TraitAssocType(traitName.text, decl);
      }
    }
  },

  * TraitAssocConst(traitName: string, decl: SyntaxNode): Code {
    yield traitName;
    yield ".";
    yield* this.Ident(decl.childForFieldName("name")!);
    yield " = ";
    const value = decl.childForFieldName("value");
    if (value) {
      yield* this.Expr(value);
    }
    else {
      yield "undefined";
    }
    yield "\n";
  },

  * TraitAssocType(traitName: string, decl: SyntaxNode): Code {
    yield traitName;
    yield ".";
    yield decl.childForFieldName("name")!;
    yield " = ";
    yield* this.Type(decl.childForFieldName("type")!);
    yield "\n";
  },

  * TraitMethodFromFunction(traitName: string, decl: SyntaxNode): Code {
    const parameters = decl.childForFieldName("parameters")!;
    const isStatic = parameters.namedChildren[0]?.type !== "self_parameter";

    yield traitName;
    if (!isStatic) {
      yield ".prototype";
    }
    yield ".";
    yield* this.Ident(decl.childForFieldName("name")!);
    yield " = function (";

    for (const param of parameters.namedChildren) {
      let emitted = false;
      if (param.type === "self_parameter") {
        continue;
      }
      else if (param.type === "parameter") {
        yield* this.Pat(param.childForFieldName("pattern")!);
        emitted = true;
      }
      else if (param.type === "identifier") {
        yield* this.Ident(param);
        emitted = true;
      }
      else if (param.type === "type_identifier") {
        yield* this.Ident(param);
        emitted = true;
      }
      if (emitted) {
        yield ",";
      }
    }

    yield ") ";
    yield* this.Block(decl.childForFieldName("body")!, true);
    yield "\n";
  },

  * TraitMethodFromSignature(traitName: string, decl: SyntaxNode): Code {
    const parameters = decl.childForFieldName("parameters")!;
    const isStatic = parameters.namedChildren[0]?.type !== "self_parameter";

    yield traitName;
    if (!isStatic) {
      yield ".prototype";
    }
    yield ".";
    const name = decl.childForFieldName("name")!;
    yield* this.Ident(name);
    yield ` = _r.unimplemented(${JSON.stringify(`${traitName}::${name.text}`)});\n`;
  },

  * Unary(unary: SyntaxNode): Code {
    const op = unary.children[0].type;
    if (op === "*") {
      if (this.isInsideLValue) {
        yield "(";
        this.insideLValue.push(false);
        yield* this.Expr(unary.children[1]);
        this.insideLValue.pop();
        yield ")[_r.REF_TARGET]";
      }
      else {
        yield "_r.deref(";
        yield* this.Expr(unary.children[1]);
        yield ")";
      }
    }
    else if (op === "-" || op === "!" || op === "+") {
      yield op;
      yield* this.Expr(unary.children[1]);
    }
    else {
      throw new Error(`Not implemented: ${op}`);
    }
  },

  * Assignment(assignment: SyntaxNode): Code {
    const left = assignment.childForFieldName("left")!;
    const right = assignment.childForFieldName("right")!;
    yield "(";
    this.insideLValue.push(true);
    yield* this.Expr(left);
    this.insideLValue.pop();
    yield " = ";
    yield* this.Expr(right);
    yield ")";
  },

  * CompoundAssignment(assignment: SyntaxNode): Code {
    const left = assignment.childForFieldName("left")!;
    const right = assignment.childForFieldName("right")!;
    const op = assignment.childForFieldName("operator") || assignment.children[1];

    yield "(";
    this.insideLValue.push(true);
    yield* this.Expr(left);
    this.insideLValue.pop();
    yield " ";
    yield op;
    yield " ";
    yield* this.Expr(right);
    yield ")";
  },

  * Call(call: SyntaxNode): Code {
    const fn = call.childForFieldName("function")!;
    yield "(";
    yield* this.Expr(fn);
    yield ")(";
    const args = call.childForFieldName("arguments")!;
    for (const arg of args.namedChildren) {
      yield* this.Expr(arg);
      yield ",";
    }
    yield ")";
  },

  * Reference(ref: SyntaxNode): Code {
    const isMut = ref.childCount === 3;
    const value = ref.childForFieldName("value")!;

    if (isMut) {
      yield "_r.ref(";
      yield* this.Expr(value);
      yield ", v => (";
      yield* this.Expr(value);
      yield ") = v)";
    }
    else {
      yield* this.Expr(value);
    }
  },

  * ScopedIdent(ident: SyntaxNode): Code {
    let first = true;
    for (const child of ident.namedChildren) {
      if (!first) {
        yield ".";
      }
      first = false;
      yield* this.Ident(child);
    }
  },

  * GenericFunction(fn: SyntaxNode): Code {
    yield* this.Expr(fn.childForFieldName("function")!);
  },

  * TypeCast(cast: SyntaxNode): Code {
    yield* this.Expr(cast.childForFieldName("value")!);
  },

  * Await(awaitExpr: SyntaxNode): Code {
    yield "await ";
    yield* this.Expr(awaitExpr.namedChildren[0]);
  },

  * AsyncBlock(asyncBlock: SyntaxNode): Code {
    yield "(async () => ";
    yield* this.Block(asyncBlock.namedChildren[0], true);
    yield ")()";
  },

  * Try(tryExpr: SyntaxNode): Code {
    const value = tryExpr.namedChildren[0];
    const temp = this.newTempVar(value);
    yield "(do {";
    yield `const ${temp} = `;
    yield* this.Expr(value);
    yield ";";
    yield `if (${temp}[_r.TRY_FAIL]) return;`;
    yield `${temp};`;
    yield "})";
  },

  * Match(match: SyntaxNode): Code {
    const value = match.childForFieldName("value")!;
    const temp = this.newTempVar(match);
    yield `const ${temp} = `;
    yield* this.Expr(value);
    yield ";\n";

    const body = match.childForFieldName("body")!;
    let isFirst = true;
    for (const arm of body.namedChildren) {
      const matchPattern = arm.childForFieldName("pattern")!;
      const pattern = matchPattern.namedChildren[0];
      const guard = matchPattern.childForFieldName("condition");

      if (pattern) {
        yield isFirst ? ["if (", arm.startPosition] : ["else if (", arm.startPosition];
        isFirst = false;

        this.matchIdentifiers = [];

        // parser fallback for unstable `box pat` syntax: pattern may be parsed as `identifier: box`
        if (pattern.type === "identifier" && pattern.text === "box") {
          const maybeInner = arm.namedChildren.find(child => child.type === "ERROR");
          if (maybeInner && IDENTIFIER_RE.test(maybeInner.text)) {
            this.matchIdentifiers.push(maybeInner.text);
            yield `(${maybeInner.text} = _r.deref(${temp}), true)`;
          }
          else {
            yield "true";
          }
        }
        else {
          yield* this.PatMatcher(pattern, temp);
        }

        if (guard) {
          yield "&&(";
          yield* this.Expr(guard);
          yield ")";
        }
        yield ") {\n";
        if (this.matchIdentifiers.length > 0) {
          yield [`var ${this.matchIdentifiers.join(",")};\n`, arm.startPosition];
        }
      }
      else {
        yield "else {\n";
      }

      const value = arm.childForFieldName("value")!;
      yield* this.Stmt(value);

      yield "}";
    }
  },

  * If(ifExpr: SyntaxNode): Code {
    const condition = ifExpr.childForFieldName("condition")!;
    if (condition.type === "let_condition") {
      const pattern = condition.childForFieldName("pattern")!;
      const value = condition.childForFieldName("value")!;

      const temp = this.newTempVar(ifExpr);
      yield `const ${temp} = `;
      yield* this.Expr(value);
      yield ";\n";
      yield "if (";
      this.matchIdentifiers = [];
      yield* this.PatMatcher(pattern, temp);
      yield ") {\n";
      if (this.matchIdentifiers.length > 0) {
        yield [`var ${this.matchIdentifiers.join(",")};\n`, ifExpr.startPosition];
      }
    }
    else {
      yield "if (";
      yield* this.Expr(condition);
      yield ") {\n";
    }

    yield* this.Stmt(ifExpr.childForFieldName("consequence")!);
    yield "}";

    const alternative = ifExpr.childForFieldName("alternative");
    if (alternative) {
      yield "else ";
      yield* this.Stmt(alternative.namedChildren[0]);
    }
  },

  * Loop(loopExpr: SyntaxNode): Code {
    const body = loopExpr.childForFieldName("body") || loopExpr.namedChildren[0];
    const label = loopExpr.childForFieldName("label");
    if (label) {
      const raw = (label.namedChildren[0] || label).text;
      yield raw.startsWith("'") ? raw.slice(1) : raw;
      yield ": ";
    }
    yield "while (true) ";
    yield* this.Block(body!);
  },

  * While(whileExpr: SyntaxNode): Code {
    const condition = whileExpr.childForFieldName("condition")!;
    const body = whileExpr.childForFieldName("body") || whileExpr.namedChildren.at(-1)!;
    const label = whileExpr.childForFieldName("label");
    if (label) {
      const raw = (label.namedChildren[0] || label).text;
      yield raw.startsWith("'") ? raw.slice(1) : raw;
      yield ": ";
    }

    if (condition.type === "let_condition") {
      const pattern = condition.childForFieldName("pattern")!;
      const value = condition.childForFieldName("value")!;

      this.matchIdentifiers = [];
      const temp = this.newTempVar(whileExpr);
      yield "while (true) {\n";
      yield `const ${temp} = `;
      yield* this.Expr(value);
      yield ";\n";
      yield "if (!(";
      yield* this.PatMatcher(pattern, temp);
      yield ")) break;\n";
      if (this.matchIdentifiers.length > 0) {
        yield [`var ${this.matchIdentifiers.join(",")};\n`, whileExpr.startPosition];
      }

      if (body.type === "block") {
        for (const child of body.namedChildren) {
          yield* this.Stmt(child);
        }
      }
      else {
        yield* this.Stmt(body);
      }
      yield "}";
    }
    else {
      yield "while (";
      yield* this.Expr(condition);
      yield ") ";
      yield* this.Block(body);
    }
  },

  * For(forExpr: SyntaxNode): Code {
    const pattern = forExpr.childForFieldName("pattern")!;
    const value = forExpr.childForFieldName("value")!;
    const body = forExpr.childForFieldName("body") || forExpr.namedChildren.at(-1)!;
    const label = forExpr.childForFieldName("label");

    if (label) {
      const raw = (label.namedChildren[0] || label).text;
      yield raw.startsWith("'") ? raw.slice(1) : raw;
      yield ": ";
    }
    yield "for (var ";
    yield* this.Pat(pattern);
    yield " of ";
    yield* this.Expr(value);
    yield ") ";
    yield* this.Block(body);
  },

  * Break(breakExpr: SyntaxNode): Code {
    yield "break";
    const label = breakExpr.childForFieldName("label");
    if (label) {
      yield " ";
      const raw = (label.namedChildren[0] || label).text;
      yield raw.startsWith("'") ? raw.slice(1) : raw;
    }
  },

  * Continue(continueExpr: SyntaxNode): Code {
    yield "continue";
    const label = continueExpr.childForFieldName("label");
    if (label) {
      yield " ";
      const raw = (label.namedChildren[0] || label).text;
      yield raw.startsWith("'") ? raw.slice(1) : raw;
    }
  },

  * Array(array: SyntaxNode): Code {
    yield "[";
    for (const elem of array.namedChildren) {
      yield* this.Expr(elem);
      yield ",";
    }
    yield "]";
  },

  * Index(index: SyntaxNode): Code {
    if (index.namedChild(1)!.type.endsWith("_literal")) {
      yield* this.Expr(index.namedChild(0)!);
      yield "[";
      yield* this.Expr(index.namedChild(1)!);
      yield "]";
    }
    else {
      yield "_r.index(";
      yield* this.Expr(index.namedChild(0)!);
      yield ",";
      yield* this.Expr(index.namedChild(1)!);
      yield ")";
    }
  },

  * Range(range: SyntaxNode): Code {
    const [start, op, end] = range.children;
    yield "_r.range(";
    yield* this.Expr(start);
    yield ",";
    if (end) {
      yield* this.Expr(end);
      if (op.type === "..=") {
        yield "+1";
      }
    }
    yield ")";
  },

  * Use(use: SyntaxNode): Code {
    this.reexportsNamed = [];
    this.reexportsAll = [];
    yield* this.UseItem(use.childForFieldName("argument")!);
    if (use.namedChildren[0]?.type === "visibility_modifier") {
      if (this.reexportsNamed.length) {
        yield "export {";
        yield [this.reexportsNamed.join(", "), use.startPosition];
        yield "};\n";
      }
      if (this.reexportsAll.length) {
        for (const path of this.reexportsAll) {
          yield [`export * from "${path}";\n`, use.startPosition];
        }
      }
    }
    else {
      if (this.reexportsAll.length) {
        throw new Error("Wildcard import is not supported");
      }
    }
  },

  * UseItem(item: SyntaxNode, base: string = "", alias?: string): Code {
    switch (item.type) {
      case "scoped_use_list": {
        const path = getPath(item.namedChildren[0]);
        let wildcard: string | undefined;
        const named: [string, string?][] = [];
        for (const child of item.namedChildren[1].namedChildren) {
          if (child.type === "self") {
            wildcard = getSelfName(item.namedChildren[0]);
          }
          else if (child.type === "identifier") {
            named.push([child.text]);
          }
          else if (child.type === "use_as_clause") {
            const original = child.namedChildren[0];
            const alias = child.namedChildren[1].text;
            if (original.type === "self") {
              wildcard = alias;
            }
            else if (original.type === "identifier") {
              named.push([original.text, alias]);
            }
            else {
              yield* this.UseItem(original, path, alias);
            }
          }
          else {
            yield* this.UseItem(child, path);
          }
        }
        if (wildcard) {
          this.reexportsNamed.push(wildcard);
          yield [`import * as ${wildcard} from "${path}";\n`, item.startPosition];
        }
        if (named.length > 0) {
          yield "import {";
          for (const [name, alias] of named) {
            this.reexportsNamed.push(alias || name);
            yield [` ${name}${alias ? ` as ${alias}` : ""},`, item.startPosition];
          }
          yield [` } from "${path}";\n`, item.endPosition];
        }
        break;
      }
      case "scoped_identifier": {
        const path = getPath(item.namedChildren[0]);
        const name = item.namedChildren[1].text;
        if (name === "self") {
          const name = alias || getSelfName(item.namedChildren[0]);
          this.reexportsNamed.push(name);
          yield [`import * as ${name} from "${path}";\n`, item.startPosition];
        }
        else {
          this.reexportsNamed.push(alias || name);
          yield [`import { ${name}${alias ? ` as ${alias}` : ""} } from "${path}";\n`, item.startPosition];
        }
        break;
      }
      case "identifier": {
        const name = item.text;
        yield [`import * as ${name} from "${name}";\n`, item.startPosition];
        break;
      }
      case "use_as_clause": {
        const original = item.namedChildren[0];
        yield* this.UseItem(original, base, alias);
        break;
      }
      case "use_wildcard": {
        const path = getPath(item.namedChildren[0]);
        this.reexportsAll.push(path);
        break;
      }
      default:
        throw new Error(`Not implemented: ${item.type}`);
    }

    function getPath(path: SyntaxNode): string {
      return base ? `${base}/${getPathImpl(path)}` : getPathImpl(path);
    }

    function getPathImpl(path: SyntaxNode): string {
      if (path.type === "identifier") {
        return `${path.text}`;
      }
      else if (path.type === "scoped_identifier") {
        return `${getPathImpl(path.namedChildren[0])}/${path.namedChildren[1].text}`;
      }
      else if (path.type === "crate") {
        return `.`;
      }
      else if (path.type === "super") {
        return `..`;
      }
      else {
        throw new Error(`Not implemented: ${path.type}`);
      }
    }

    function getSelfName(path: SyntaxNode): string {
      if (path.type === "identifier") {
        return path.text;
      }
      else if (path.type === "scoped_identifier") {
        return getSelfName(path.namedChildren[1]);
      }
      else if (path.type === "crate") {
        return "crate";
      }
      else {
        throw new Error(`Not implemented: ${path.type}`);
      }
    }
  },
});
