function __JSRS_impl_0_static() { return {
//  const CONST_ITEM: number = 23;
//  type AssociatedType = number;
//  pub fn new(a: number, b: number) -> A {
new(a: number, b: number): A {
//         A { a, b }
    return A({ a: a, b: b })
//  }
  },
} }
type __JSRS_impl_0_static_T = ReturnType<typeof __JSRS_impl_0_static>;
interface __JSRS_A__Ctor extends __JSRS_impl_0_static_T {}
function __JSRS_impl_0() { return {
//       impl A {
//  pub fn add(&self) -> number {
add(this:A): number {
//         self.a + self.b
    return this.a + this.b
//  }
  },
} }
type __JSRS_impl_0_T = ReturnType<typeof __JSRS_impl_0>;
interface A extends __JSRS_impl_0_T {}
//}

