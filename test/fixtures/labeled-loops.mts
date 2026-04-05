//pub fn labeled_loops() -> number {
export function labeled_loops(): number {
//  let mut i = 0;
  let i = 0;

//  'outer: loop {
  while (true) {
//    i = i + 1;
    i = i + 1;
//    if i < 2 {
    if (i < 2){
//      continue 'outer;
      continue;
//    }
    }
//    break 'outer;
    break;
//  }
  }

//       i
  return i
//}
}

