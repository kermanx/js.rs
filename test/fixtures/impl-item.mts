//import!({A} from "./struct-item.mts");
import  {A} from "./struct-item.mts" ;

function __JSRS_impl_40_static() { return {
//  const CONST_ITEM: number = 23;
//  type AssociatedType = number;
//  pub fn new(a: number, b: number) -> A {
new(a: number, b: number): A {
//         A { a, b }
    return A({ a: a, b: b })
//  }
  },
} }
type __JSRS_impl_40_static_T = ReturnType<typeof __JSRS_impl_40_static>;
declare module "./struct-item.mts" {
  interface __JSRS_A__Ctor extends __JSRS_impl_40_static_T {}
}
function __JSRS_impl_40() { return {
//       impl A {
//  pub fn add(&self) -> number {
add(this:A): number {
//         self.a + self.b
    return this.a + this.b
//  }
  },
} }
type __JSRS_impl_40_T = ReturnType<typeof __JSRS_impl_40>;
declare module "./struct-item.mts" {
  interface A extends __JSRS_impl_40_T {}
}
//}

