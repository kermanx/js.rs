//       fn id(x: number) -> number {
function id(x: number): number {
//       x
  return x
//}
}

//pub fn method_turbofish() -> number {
export function method_turbofish(): number {
//  id::<number>(1)
  return (undefined as any)(1)
//}
}

