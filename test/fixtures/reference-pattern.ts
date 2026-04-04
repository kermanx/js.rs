//pub fn reference_pattern(x: &number, y: &mut number) -> number {
export function reference_pattern(x: __JSRS_Ref<number>, y: __JSRS_MutRef<number>): number {
//  let mut out = 0;
  let out = 0;

//  match x {
//    &a => out = a,
//    _ => out = 0,
//  }
  (() => { const __jsrs_match = x; if (__jsrs_match === a) return out = a; if (true) return out = 0; return undefined as any; })()

//  match y {
//    &mut b => out = out + b,
//    _ => out = out,
//  }
  (() => { const __jsrs_match = y; if (__jsrs_match === mut) return out = out + b; if (true) return out = out; return undefined as any; })()

//       out
  return out
//}
}

