//pub fn continue_expression() -> number {
export function continue_expression(): number {
//  let mut i = 0;
  let i = 0;
//  let mut acc = 0;
  let acc = 0;
//  while i < 5 {
  while (i < 5) {
//    i = i + 1;
    i = i + 1;
//    if i < 3 {
    if (i < 3){
//      continue;
      continue;
//    }
    }
//    acc = acc + i;
    acc = acc + i;
//  }
  }
//       acc
  return acc
//}
}

