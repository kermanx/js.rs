import * as _r from "@jsrs/runtime";
export function reference_pattern(x, y) {
  var out = 0;
  const _t0 = x;
  if ((a = _r.deref(_t0))) {
    var a;
    out = a;
  } else {
    out = 0;
  }
  const _t1 = y;
  if ((b = _r.deref(_t1))) {
    var b;
    out = out + b;
  } else {
    out = out;
  }
  return out;
}
