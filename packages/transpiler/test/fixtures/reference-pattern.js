import * as _r from "@jsrs/runtime";
export function reference_pattern(x, y) {
  var out = 0;
  _m0 = x;
  if ((a = _r.deref(_m0))) {
    var a;
    out = a;
  } else {
    out = 0;
  }
  _m0 = y;
  if ((b = _r.deref(_m0))) {
    var b;
    out = out + b;
  } else {
    out = out;
  }
  return out;
}
var _m, _m0, _m1;
