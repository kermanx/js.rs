//import!({A} from "./struct-item.mts");
import  {A} from "./struct-item.mts" ;
//import!({Trait} from "./trait-item.mts");
import  {Trait} from "./trait-item.mts" ;

type __JSRS_Trait__CtorImpl_82 = import("./trait-item.mts").__JSRS_Trait__CtorImpl;
type __JSRS_Trait__Ctor_82 = import("./trait-item.mts").__JSRS_Trait__Ctor;
type Trait_82 = import("./trait-item.mts").Trait;
function __JSRS_impl_82_static() { return {
//  type AssociatedType = number;
//  const CONST_ITEM: number = 23;
//  fn static_method() {
static_method() {
//    console.log();
    console.log();
//  }
  },
} satisfies __JSRS_Trait__CtorImpl_82; }
declare module "./struct-item.mts" {
  interface __JSRS_A__Ctor extends __JSRS_Trait__Ctor_82 {}
}
function __JSRS_impl_82() { return {
//impl Trait for A {
//  fn method(&self) {
method(this:A) {
//    console.log();
    console.log();
//  }
  },
} satisfies Trait_82; }
declare module "./struct-item.mts" {
  interface A extends Trait_82 {}
}
//}

