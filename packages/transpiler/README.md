# @jsrs/transpiler Feature Checklist

Status summary for Rust language features in the current transpiler implementation.

## Items and module system

- [x] Function item declarations are transpiled to JavaScript functions.
- [x] Public item visibility (`pub`) is transpiled to JavaScript `export`.
- [x] Enum item declarations are transpiled to constructor plus static variants.
- [x] Struct item declarations are transpiled to constructor-like symbols.
- [x] `impl` blocks are transpiled to static methods and prototype methods.
- [x] `use` declarations are transpiled to JavaScript `import` statements.
- [x] Nested `use` lists are supported.
- [x] `use ... as ...` aliasing is supported.
- [x] `crate` and `super` paths in `use` are supported.
- [x] `pub use` re-exports are supported for named and wildcard re-export.
- [ ] `mod` module declarations are supported.
- [ ] `extern crate` declarations are supported.
- [x] `const` item declarations are supported.
- [x] `static` item declarations are supported.
- [x] `type` alias item declarations are supported.
- [ ] `trait` item declarations are supported.
- [ ] `impl Trait for Type` trait implementation blocks are supported.
- [ ] Associated constants in `impl` blocks are supported.
- [ ] Associated type definitions in `impl` blocks are supported.
- [ ] Macro item declarations (`macro_rules!`) are supported.

## Statements and control flow

- [x] `let` declarations are transpiled.
- [x] Destructuring `let` patterns are transpiled.
- [x] `let ... else` is transpiled.
- [x] Expression statements are transpiled.
- [x] Block statements are transpiled.
- [x] `if` expressions are transpiled.
- [x] `if let` conditions are transpiled.
- [x] `else if` / `else` branches are transpiled.
- [x] `match` expressions are transpiled.
- [x] `return` expressions are transpiled.
- [x] `loop` expressions are supported.
- [x] `while` loops are supported.
- [x] `while let` loops are supported.
- [x] `for` loops are supported.
- [x] `break` expressions are supported.
- [x] `continue` expressions are supported.
- [x] Labeled loops are supported.

## Expressions and operators

- [x] Identifier expressions are transpiled.
- [x] Integer literals are transpiled.
- [x] Boolean literals are transpiled.
- [x] String literals are transpiled.
- [x] Binary expressions are transpiled.
- [x] Assignment expressions are transpiled.
- [x] Function call expressions are transpiled.
- [x] Field access expressions are transpiled.
- [x] Tuple index field access (like `.0`) is transpiled.
- [x] Array and tuple literal expressions are transpiled.
- [x] Index expressions are transpiled.
- [x] Range expressions are transpiled.
- [x] Parenthesized expressions are transpiled.
- [x] Closure expressions are transpiled to JavaScript arrow functions.
- [x] `self` expressions are transpiled to `this`.
- [x] Scoped paths (like `Type::Member`) are transpiled.
- [x] Struct constructor expressions are transpiled.
- [x] Block / `if` / `match` expression position is handled via `do` expression output.
- [x] Mutable reference creation (`&mut`) is transpiled.
- [x] Immutable reference expressions (`&`) are transpiled as passthrough value references.
- [x] Dereference unary operator (`*expr`) is transpiled.
- [x] Unary negation (`-expr`) is supported.
- [x] Unary logical not (`!expr`) is supported.
- [x] Compound assignment operators (`+=`, `-=`, etc.) are supported.
- [x] `as` cast expressions are supported.
- [x] Method turbofish syntax (`foo::<T>()`) is supported.
- [x] Await expressions (`.await`) are supported.
- [ ] Try operator (`?`) is supported.

## Patterns and matching

- [x] Identifier patterns are supported.
- [x] Wildcard pattern (`_`) is supported.
- [x] Tuple patterns are supported.
- [x] Slice/array patterns are supported.
- [x] Struct patterns are supported.
- [x] Tuple-struct / enum-variant patterns are supported.
- [x] Literal patterns for integer, boolean, and char are supported.
- [x] Or-patterns (`p1 | p2`) are supported.
- [x] Range patterns are supported.
- [x] Rest pattern (`..`) in slice patterns is supported.
- [ ] Pattern guards (`if` guards on match arms) are supported.
- [ ] Reference patterns (`&pat`, `&mut pat`) are supported.
- [ ] `@` binding patterns are supported.
- [ ] Box patterns are supported.

## Async and advanced language features

- [ ] `async fn` is supported.
- [ ] `async` blocks are supported.
- [ ] `const fn` is supported.
- [ ] Generators are supported.
- [ ] Inline assembly is supported.
- [ ] Procedural macros are supported.
- [ ] Declarative macro expansion is supported.
- [ ] Attributes (`#[...]`) are supported.
- [ ] `cfg` conditional compilation is supported.
