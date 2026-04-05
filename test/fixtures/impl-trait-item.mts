function __JSRS_impl_0_static() { return {
//  type AssociatedType = number;
//  const CONST_ITEM: number = 23;
//  fn static_method() {
static_method() {
//    log();
    log();
//  }
  },
} satisfies __JSRS_Trait__Ctor; }
interface __JSRS_StructA__Ctor extends __JSRS_Trait__Ctor {}
function __JSRS_impl_0() { return {
//impl Trait for StructA {
//  fn method(&self) {
method(this:StructA) {
//    log();
    log();
//  }
  },
} satisfies Trait; }
interface StructA extends Trait {}
//}

