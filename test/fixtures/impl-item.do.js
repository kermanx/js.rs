import * as _r from "@jsrs/runtime";
import { A } from "./struct-item.mts";
A.CONST_ITEM = 23;
A.AssociatedType = number;
A.new = function (a, b) {
  return { a, b };
};
A.prototype.add = function () {
  return this.a + this.b;
};
