import * as _r from "@jsrs/runtime";
export function tuple() {
  var t = [1, 2, 3];
  var [a, b, c] = _r.destruct(t);
  var x = t[0] + t[1];
  _m0 = t;
  if (_m0.length === 3 && (_m1 = _m0) && _m1[0] === 1 && (a = _m1[1]) && true) {
    var a;
    log(a);
  } else {
    log("other");
  }
}
var _m, _m0, _m1;
