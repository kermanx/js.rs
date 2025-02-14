use std::fs;

use insta::{assert_snapshot, glob, Settings};
use jsrs_transpiler::transpile;
use oxc::{allocator::Allocator, codegen::Codegen, parser::Parser, span::SourceType};

#[test]
fn test() {
  glob!("fixtures/**/*.jsrs", |path| {
    println!("Testing {}", path.display());
    let input = fs::read_to_string(path).unwrap();
    let mut settings = Settings::clone_current();
    settings.set_omit_expression(true);
    settings.set_prepend_module_to_snapshot(false);
    settings.bind(|| {
      let output = transpile(&input);
      let allocator = Allocator::new();
      let parsed = Parser::new(&allocator, &output, SourceType::mjs()).parse();
      if parsed.errors.len() > 0 {
        eprintln!("{}", output);
        panic!("{:#?}", parsed.errors);
      }
      let formatted = Codegen::new().build(&parsed.program);
      assert_snapshot!(formatted.code);
    })
  });
}
