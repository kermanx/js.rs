import * as _r from "@jsrs/runtime";
import { A } from "./struct-item.mts";
import { Trait } from "./trait-item.mts";
_r.implTrait(A, Trait);
A.AssociatedType = number;
A.CONST_ITEM = 23;
A.static_method = function () {
  console.log();
};
A.prototype.method = function () {
  console.log();
};
