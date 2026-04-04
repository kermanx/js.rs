import * as _r from "@jsrs/runtime";
export function is_alpha(c) {
  return do {
    _m0 = c;
    if (_m0 === "x") {
      {
        console.log("x");
        true;
      }
    } else if ((_m0 >= "a" && _m0 <= "z") || (_m0 >= "A" && _m0 <= "Z")) {
      true;
    } else {
      false;
    }
  };
}
var _m, _m0, _m1;
