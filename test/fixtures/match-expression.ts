//pub fn is_alpha(c: char) -> bool {
export function is_alpha(c: char): bool {
//  match c {
  return (() => { const __jsrs_match = c;
//    'x' => {
if (__jsrs_match === 'x') return (() => {
//      console.log("x");
      console.log("x");
//      true
      true
//    },
    })();
//    'a'..='z' | 'A'..='Z' => true,
if (((__jsrs_match >= 'a' && __jsrs_match <= 'z')) || ((__jsrs_match >= 'A' && __jsrs_match <= 'Z'))) return true;
//    _ => false,
if (true) return false;
//  }
return undefined as any; })()
//}
}

//pub fn is_null(s: string | null) -> bool {
export function is_null(s: string | null): bool {
//  match s {
  return (() => { const __jsrs_match = s;
//    null => true,
if (__jsrs_match === null) return true;
//    _ => false,
if (true) return false;
//  }
return undefined as any; })()
//}
}

