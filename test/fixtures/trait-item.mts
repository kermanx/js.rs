export type __JSRS_Trait__CtorImpl = {
//pub trait Trait {
//  type AssociatedType = number;
//  const CONST_ITEM: number = 23;
  CONST_ITEM?: number;
//  fn static_method() {
  static_method?(): void;
};
export type __JSRS_Trait__Ctor = Required<__JSRS_Trait__CtorImpl>;
export interface Trait {
//    log();
//  }
//  fn method(&self);
  method(this: unknown): void;
}
//}

