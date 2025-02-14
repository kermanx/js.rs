mod context;
mod matcher;
mod nodes;

use context::Context;
use nodes::Print;

pub fn transpile(node: &str) -> String {
  let node = syn::parse_file(node).unwrap();
  let mut ctx = Context::default();
  node.print(&mut ctx);
  ctx.result.join("")
}
