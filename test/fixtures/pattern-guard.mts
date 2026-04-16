const __JSRS_Option_Symbol = Symbol();
//pub enum Option<T> {
export interface Option<T> { [__JSRS_Option_Symbol]: typeof __JSRS_Option_Symbol }
export interface __JSRS_Option__Ctor {
//  Some(T),
  Some<T>(_0: T,): Option<T>;
//  None,
  None: Option<any>;
}
export var Option!: __JSRS_Option__Ctor
//}


//pub fn pattern_guard(x: Option<number>) -> number {
export function pattern_guard(x: Option<number>): number {
//  match x {
  return (() => { const __jsrs_match = x;
//    Option::Some(v) if v > 1 => v,
if (__JSRS_any(__jsrs_match)) return v;
//    _ => 0,
if (true) return 0;
//  }
return undefined as any; })()
//}
}

