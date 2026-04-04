import * as _r from "@jsrs/runtime";
export function tuple() {
  var t = [1, 2, 3];
  var [a, b, c] = _r.destruct(t);
  var x = t[0] + t[1];
  const _t0 = t;
  if (_t0.length === 3 && _t0[0] === 1 && (a = _t0[1]) && true) {
    var a;
    log(a);
  } else {
    log("other");
  }
}
