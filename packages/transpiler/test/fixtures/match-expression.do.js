import * as _r from "@jsrs/runtime";
export function is_alpha(c) {
  return do {
    const _t0 = c;
    if (_t0 === "x") {
      {
        console.log("x");
        true;
      }
    } else if ((_t0 >= "a" && _t0 <= "z") || (_t0 >= "A" && _t0 <= "Z")) {
      true;
    } else {
      false;
    }
  };
}
