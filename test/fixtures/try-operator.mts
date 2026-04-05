//       fn passthrough(x: Result<number, string>) -> Result<number, string> {
function passthrough(x: Result<number, string>): Result<number, string> {
//  let v = x?;
  const v = x;
//       Result::Ok(v)
  return Result.Ok(v)
//}
}

//       fn try_then_method(a: Result<Boxed, string>) -> Result<number, string> {
function try_then_method(a: Result<Boxed, string>): Result<number, string> {
//  let x = a?.inc();
  const x = a.inc();
//       Result::Ok(x)
  return Result.Ok(x)
//}
}

//       fn try_then_index(a: Result<(number, number), string>) -> Result<number, string> {
function try_then_index(a: Result<[number, number], string>): Result<number, string> {
//  let x = a?[1];
  const x = __JSRS_index(a, 1);
//       Result::Ok(x)
  return Result.Ok(x)
//}
}

