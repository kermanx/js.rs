# js.rs

JavaScript in Rust Syntax (<del>= Rust with GC 😂</del>)

> Slowly working in progress.

### Why?

- Rust's restrictions make development slow
- Usually JavaScript runs fast enough
- Learning a new syntax is hard for both human and LLMs
- Rust Syntax is nice
  - Enum and Pattern Matching
  - Block as Expression
  - proc-macro is powerful

### How?

- **Transpiler**: Rust -> JavaScript with [do-expressions](https://github.com/tc39/proposal-do-expressions) -> JavaScript
- **IDE Support**: Full IDE support powered by [Volar.js](https://volarjs.dev/)
- **Runtime**: Just using JavaScript runtime

### Example

🚀 Exactly Rust syntax + JavaScript runtime

```rust
fn add_and_print(x: number, y: number) -> number {
  let z = x + y;
  console.log(z);
  z
}

struct Rect(number, number);

impl Rect {
  fn new(width: number, height: number) -> Self {
    Self(width, height)
  }
}

trait Shape {
  fn area(&self) -> number;
}

impl Shape for Rect {
  fn area(&self) -> number {
    self.0 * self.1
  }
}
```
