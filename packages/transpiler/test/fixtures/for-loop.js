import * as _r from "@jsrs/runtime";
export function for_loop() {
  var acc = 0;
  for (var x of [1, 2, 3]) {
    acc = acc + x;
  }
  return acc;
}
