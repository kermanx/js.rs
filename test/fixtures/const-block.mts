//pub fn const_block() -> number {
export function const_block(): number {
//  let x = const {
  const x = (() => {
//         1 + 2
    return 1 + 2
//  };
  })();
//       x
  return x
//}
}

