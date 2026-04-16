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


//pub fn match_test(a: Option<Option<number>>) -> Option<number> {
export function match_test(a: Option<Option<number>>): Option<number> {
//  let A(B(x), C(y)) = a else { return Option::None; };
  const __jsrs_pattern_110 = a;

//  if let D(z) = a {
  if (a){ const z = undefined as any; {
//    return Option::Some(z);
    return Option.Some(z);;
//  }
  } }

//  return Option::Some(x + y);
  return Option.Some(x + y);;
//}
}

