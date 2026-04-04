import * as _r from "@jsrs/runtime";
export function Option() {}
Option.Some = _r.variant(/*Some*/ 0);
Option.None = _r.unitVariant(/*None*/ 1);
export function match_test(a) {
  _m0 = _r.destruct(a);
  if (
    (_m1 = _r.matches(_m0, /*A*/ 2)) &&
    (_m2 = _r.matches(_m1[1], /*B*/ 3)) &&
    (x = _m2[1]) &&
    (_m2 = _r.matches(_m1[2], /*C*/ 4)) &&
    (y = _m2[1])
  ) {
    var x, y;
    _m0 = a;
    if ((_m1 = _r.matches(_m0, /*D*/ 5)) && (z = _m1[1])) {
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
