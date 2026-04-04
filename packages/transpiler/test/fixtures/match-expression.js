import * as _r from "@jsrs/runtime";
export function is_alpha(c) {
  {
    var _do;
    const _t0 = c;
    if (_t0 === "x") {
      {
        console.log("x");
        _do = true;
      }
    } else if ((_t0 >= "a" && _t0 <= "z") || (_t0 >= "A" && _t0 <= "Z")) {
      _do = true;
    } else {
      _do = false;
    }
  }
  return _do;
}
export function is_null(s) {
  {
    var _do2;
    const _t1 = s;
    if (_t1 === null) {
      _do2 = true;
    } else {
      _do2 = false;
    }
  }
  return _do2;
}
