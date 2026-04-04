import * as _r from "@jsrs/runtime";
export function Option() {}
Option.Some = _r.variant(0);
Option.None = _r.unitVariant(1);
export function match_test(a) {
  _m0 = _r.destruct(a);
  if (
    (_m1 = _r.matches(_m0, A)) &&
    (_m2 = _r.matches(_m1[1], B)) &&
    (x = _m2[1]) &&
    (_m2 = _r.matches(_m1[2], C)) &&
    (y = _m2[1])
  ) {
    var x, y;
    _m0 = a;
    if ((_m1 = _r.matches(_m0, D)) && (z = _m1[1])) {
      var z;
      {
        return Option.Some(z);
      }
    }
    return Option.Some(x + y);
  } else {
    return Option.None;
  }
}
var _m, _m0, _m1, _m2;
