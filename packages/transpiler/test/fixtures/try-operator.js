import * as _r from "@jsrs/runtime";
function passthrough(x) {
  {
    var _do;
    const _t0 = x;
    if (_t0[_r.TRY_FAIL]) return;
    _do = _t0;
  }
  var v = _do;
  return Result.Ok(v);
}
function try_then_method(a) {
  var _do3;
  {
    var _do2;
    const _t1 = a;
    if (_t1[_r.TRY_FAIL]) return;
    _do2 = _t1;
  }
  _do3 = _do2.inc();
  var x = _do3;
  return Result.Ok(x);
}
function try_then_index(a) {
  var _do5;
  {
    var _do4;
    const _t2 = a;
    if (_t2[_r.TRY_FAIL]) return;
    _do4 = _t2;
  }
  _do5 = _do4[1];
  var x = _do5;
  return Result.Ok(x);
}
