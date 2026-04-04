//pub fn at_binding_pattern(x: Option<number>) -> number {
export function at_binding_pattern(x: Option<number>): number {
//  match x {
//    a @ Option::Some(v) => v,
//    _ => 0,
//  }
  return (() => { const __jsrs_match = x; if (__jsrs_match === a) return v; if (true) return 0; return undefined as any; })()
//}
}

