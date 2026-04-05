//pub fn range_expression(arr: [number; 3]) {
export function range_expression(arr: Array<number>) {
//  let s = 1..=3;
  const s = __JSRS_range(1, 3+ 1);
//  let y = arr[s];
  const y = __JSRS_index(arr, s);
//}
}

