import * as _r from "@jsrs/runtime";
export function is_alpha(c) {
  return (function () {
    const _t0 = c;
    if (_t0 === "x") {
      {
        console.log("x");
        return true;
      }
    } else if ((_t0 >= "a" && _t0 <= "z") || (_t0 >= "A" && _t0 <= "Z")) {
      return true;
    } else {
      return false;
    }
  })();
}
export function is_null(s) {
  return (function () {
    const _t1 = s;
    if (_t1 === null) {
      return true;
    } else {
      return false;
    }
  })();
}
