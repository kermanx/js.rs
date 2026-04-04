import * as _r from "@jsrs/runtime";
export function Option() {}
Option.Some = _r.variant(/*Some*/ 0);
Option.None = _r.unitVariant(/*None*/ 1);
export function pattern_guard(x) {
  {
    var _do;
    _m0 = x;
    if ((_m1 = _r.matches(_m0, /*Option::Some*/ 2)) && (v = _m1[1]) && v > 1) {
      var v;
      _do = v;
    } else {
      _do = 0;
    }
  }
  return _do;
}
var _m, _m0, _m1;
