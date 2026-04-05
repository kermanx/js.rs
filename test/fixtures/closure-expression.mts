//pub fn closures(x: number) {
export function closures(x: number) {
//  let s = |a: number, b: number| -> number {
  const s = (a: number, b: number): number => {
//         a + b
    return a + b
//  };
  };
//  let t = |x| self.value + 1;
  const t = (x) => this.value + 1;
//}
}

