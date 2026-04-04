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
  var _do3, _do4;
  {
    var _do2;
    const _t1 = a;
    if (_t1[_r.TRY_FAIL]) return;
    _do2 = _t1;
  }
  _do3 = _do2.inc;
  _do4 = _do3.call(_do2);
  var x = _do4;
  return Result.Ok(x);
}
function try_then_index(a) {
  var _do6;
  {
    var _do5;
    const _t2 = a;
    if (_t2[_r.TRY_FAIL]) return;
    _do5 = _t2;
  }
  _do6 = _do5[1];
  var x = _do6;
  return Result.Ok(x);
}
