use syn::*;

use crate::{context::Context, matcher::PrintMatcher};

pub trait Print: Sized {
  fn print(self, ctx: &mut Context);
}

impl Print for File {
  fn print(self, ctx: &mut Context) {
    for item in self.items {
      item.print(ctx);
    }
  }
}

impl Print for Item {
  fn print(self, ctx: &mut Context) {
    match self {
      Item::Fn(item) => item.print(ctx),
      Item::Enum(_item) => {}
      _ => todo!(),
    }
  }
}

impl Print for ItemFn {
  fn print(self, ctx: &mut Context) {
    self.vis.print(ctx);
    self.sig.print(ctx);
    self.block.print(ctx);
  }
}

impl Print for Visibility {
  fn print(self, ctx: &mut Context) {
    match self {
      Visibility::Public(_) | Visibility::Restricted(_) => {
        ctx.push("export ");
      }
      Visibility::Inherited => {}
    }
  }
}

impl Print for Signature {
  fn print(self, ctx: &mut Context) {
    ctx.push("function ");
    self.ident.print(ctx);
    ctx.push("(");
    for input in self.inputs {
      input.print(ctx);
      ctx.push(",");
    }
    ctx.push(")");
  }
}

impl Print for FnArg {
  fn print(self, ctx: &mut Context) {
    match self {
      FnArg::Receiver(_) => todo!(),
      FnArg::Typed(pat) => pat.print(ctx),
    }
  }
}

impl Print for PatType {
  fn print(self, ctx: &mut Context) {
    self.pat.print(ctx);
  }
}

impl Print for Pat {
  fn print(self, ctx: &mut Context) {
    match self {
      Pat::Ident(ident) => ident.print(ctx),
      Pat::TupleStruct(s) => s.print(ctx),
      _ => todo!(),
    }
  }
}

impl Print for PatTupleStruct {
  fn print(self, ctx: &mut Context) {
    ctx.push("[");
    for pat in self.elems {
      pat.print(ctx);
      ctx.push(",");
    }
    ctx.push("]");
  }
}

impl Print for PatIdent {
  fn print(self, ctx: &mut Context) {
    self.ident.print(ctx);
  }
}

impl Print for Ident {
  fn print(self, ctx: &mut Context) {
    ctx.push(self);
  }
}

impl Print for Block {
  fn print(self, ctx: &mut Context) {
    ctx.push("{\n");

    ctx.block_post_cbs.push(Vec::new());

    for stmt in self.stmts {
      stmt.print(ctx);
    }

    for append in ctx.block_post_cbs.pop().unwrap().into_iter().rev() {
      append(ctx);
    }

    ctx.push("\n}");
  }
}

impl Print for Stmt {
  fn print(self, ctx: &mut Context) {
    match self {
      Stmt::Local(local) => local.print(ctx),
      Stmt::Expr(expr, _) => expr.print(ctx),
      _ => todo!(),
    }
  }
}

impl Print for Local {
  fn print(self, ctx: &mut Context) {
    if self.init.as_ref().is_some_and(|i| i.diverge.is_some()) {
      let init = self.init.unwrap();

      ctx.push("_match");
      let label_id = ctx.alloc_label();
      ctx.push(label_id);
      ctx.push(": {\n");

      ctx.push("const _m0 = ");
      init.expr.print(ctx);
      ctx.push(";\n");
      ctx.matcher_quotes = 0;
      self.pat.print_matcher(ctx, 0);
      let quotes = ctx.matcher_quotes;

      ctx.block_post(move |ctx| {
        ctx.push("break _match");
        ctx.push(label_id);

        for _ in 0..quotes {
          ctx.push("}");
        }

        let Expr::Block(block) = *init.diverge.unwrap().1 else { unreachable!() };
        block.block.print(ctx);

        ctx.push("}");

        ctx.free_label();
      });
    } else {
      ctx.push("var ");
      self.pat.print(ctx);
      if let Some(init) = self.init {
        init.expr.print(ctx);
      }
      ctx.push(";");
    }
  }
}

impl Print for Expr {
  fn print(self, ctx: &mut Context) {
    match self {
      Expr::Lit(expr) => expr.print(ctx),
      Expr::Path(expr) => expr.print(ctx),
      Expr::Binary(expr) => expr.print(ctx),
      Expr::Return(expr) => expr.print(ctx),
      Expr::Block(expr) => expr.print(ctx),
      _ => todo!(),
    }
  }
}

impl Print for ExprLit {
  fn print(self, ctx: &mut Context) {
    self.lit.print(ctx);
  }
}

impl Print for ExprPath {
  fn print(self, ctx: &mut Context) {
    if let Some(qself) = self.qself {
      qself.print(ctx);
      ctx.push("::");
    }
    self.path.print(ctx);
  }
}

impl Print for ExprBinary {
  fn print(self, ctx: &mut Context) {
    self.left.print(ctx);
    self.op.print(ctx);
    self.right.print(ctx);
  }
}

impl Print for BinOp {
  fn print(self, ctx: &mut Context) {
    match self {
      BinOp::Add(_) => ctx.push("+"),
      BinOp::Sub(_) => ctx.push("-"),
      BinOp::Mul(_) => ctx.push("*"),
      BinOp::Div(_) => ctx.push("/"),
      _ => todo!(),
    }
  }
}

impl Print for Lit {
  fn print(self, ctx: &mut Context) {
    match self {
      Lit::Str(lit) => ctx.push(format!("\"{}\"", lit.value())),
      Lit::ByteStr(lit) => ctx.push(format!("{:?}", lit.value())),
      Lit::Byte(lit) => ctx.push(format!("{}", lit.value())),
      Lit::Char(lit) => ctx.push(format!("'{}'", lit.value())),
      Lit::Int(lit) => ctx.push(format!("{}", lit.base10_digits())),
      Lit::Float(lit) => ctx.push(format!("{}", lit.base10_digits())),
      Lit::Bool(lit) => ctx.push(format!("{}", lit.value)),
      _ => todo!(),
    }
  }
}

impl Print for Path {
  fn print(self, ctx: &mut Context) {
    for (i, segment) in self.segments.into_iter().enumerate() {
      if i > 0 {
        ctx.push(".");
      }
      segment.print(ctx);
    }
  }
}

impl Print for PathSegment {
  fn print(self, ctx: &mut Context) {
    self.ident.print(ctx);
  }
}

impl Print for QSelf {
  fn print(self, ctx: &mut Context) {
    self.ty.print(ctx);
  }
}

impl Print for Type {
  fn print(self, ctx: &mut Context) {
    todo!()
  }
}

impl Print for ExprReturn {
  fn print(self, ctx: &mut Context) {
    ctx.push("return ");
    if let Some(expr) = self.expr {
      expr.print(ctx);
    }
    ctx.push(";");
  }
}

impl Print for ExprBlock {
  fn print(self, ctx: &mut Context) {
    ctx.push("(() => {");
    self.block.print(ctx);
    ctx.push("})()");
  }
}
