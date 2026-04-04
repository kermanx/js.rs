import * as _r from "@jsrs/runtime";
function passthrough(x) {
  var v = do {
    const _t0 = x;
    if (_t0[_r.TRY_FAIL]) return;
    _t0;
  };
  return Result.Ok(v);
}
function try_then_method(a) {
  var x = do {
    const _t1 = a;
    if (_t1[_r.TRY_FAIL]) return;
    _t1;
  }.inc();
  return Result.Ok(x);
}
function try_then_index(a) {
  var x = do {
    const _t2 = a;
    if (_t2[_r.TRY_FAIL]) return;
    _t2;
  }[1];
  return Result.Ok(x);
}
var _m;
