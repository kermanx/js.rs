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


//pub fn while_let_loop() -> number {
export function while_let_loop(): number {
//  let mut x = Option::Some(2);
  let x = Option.Some(2);
//  let mut acc = 0;
  let acc = 0;

//  while let Option::Some(v) = x {
  while (x) { const v = undefined as any; {
//    acc = acc + v;
    acc = acc + v;
//    x = Option::None;
    x = Option.None;
//  }
  }}

//       acc
  return acc
//}
}

