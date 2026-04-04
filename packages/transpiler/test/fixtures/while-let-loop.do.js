import * as _r from "@jsrs/runtime";
export function Option() {}
Option.Some = _r.variant(/*Some*/ 0);
Option.None = _r.unitVariant(/*None*/ 1);
export function while_let_loop() {
  var x = Option.Some(2);
  var acc = 0;
  while (true) {
    _m0 = x;
    if (!((_m1 = _r.matches(_m0, /*Option::Some*/ 2)) && (v = _m1[1]))) break;
    var v;
    acc = acc + v;
    x = Option.None;
  }
  return acc;
}
var _m, _m0, _m1;
