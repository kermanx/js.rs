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
