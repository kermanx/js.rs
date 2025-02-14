use syn::*;

use crate::{context::Context, nodes::Print};

pub trait PrintMatcher: Sized {
  fn print_matcher(self, ctx: &mut Context, target: usize);
}

impl PrintMatcher for Pat {
  fn print_matcher(self, ctx: &mut Context, target: usize) {
    match self {
      Pat::Ident(ident) => ident.print_matcher(ctx, target),
      Pat::TupleStruct(s) => s.print_matcher(ctx, target),
      _ => todo!(),
    }
  }
}

impl PrintMatcher for PatTupleStruct {
  fn print_matcher(self, ctx: &mut Context, target: usize) {
    // if (_m = matches(a, 1 /* A */)) {
    //   let [_m1, _m2] = _m;
    ctx.push("if (_m = matches(_m");
    ctx.push(target);
    ctx.push(", ");
    let discriminant =
      ctx.get_discriminant_id(&self.path.segments.last().unwrap().ident.to_string());
    ctx.push(discriminant);
    ctx.push(")) {\n");
    ctx.push("let [");
    for i in 0..self.elems.len() {
      ctx.push("_m");
      ctx.push(i);
      ctx.push(",");
    }
    ctx.push("] = _m");
    ctx.push(target);
    ctx.push(";\n");
    for (i, pat) in self.elems.into_iter().enumerate() {
      pat.print_matcher(ctx, i);
    }
    ctx.matcher_quotes += 1;
  }
}

impl PrintMatcher for PatIdent {
  fn print_matcher(self, ctx: &mut Context, target: usize) {
    ctx.push("var ");
    self.ident.print(ctx);
    ctx.push(" = _m");
    ctx.push(target);
    ctx.push(";\n");
  }
}
