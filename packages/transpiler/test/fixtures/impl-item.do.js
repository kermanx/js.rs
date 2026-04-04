import * as _r from "@jsrs/runtime";
export function A() {}
A.new = function (a, b) {
  return { a, b };
};
A.prototype.add = function () {
  return this.a + this.b;
};
