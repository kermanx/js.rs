//       fn swap(a: &mut number, b: &mut number) {
function swap(a: __JSRS_MutRef<number>, b: __JSRS_MutRef<number>) {
//  let tmp = *a;
  const tmp = a;
//  *a = *b;
  a = b;
//  *b = tmp;
  b = tmp;
//}
}

//pub fn main() {
export function main() {
//  let mut a = 1;
  let a = 1;
//  let mut b = 2;
  let b = 2;
//  swap(&mut a, &mut b);
  swap(__JSRS_mutRef(a), __JSRS_mutRef(b));
//}
}

