import * as _r from "@jsrs/runtime";
export function continue_expression() {
  var i = 0;
  var acc = 0;
  while (i < 5) {
    i = i + 1;
    if (i < 3) {
      {
        continue;
      }
    }
    acc = acc + i;
  }
  return acc;
}
var _m;
