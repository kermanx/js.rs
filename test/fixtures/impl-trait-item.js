import * as _r from "@jsrs/runtime";
_r.implTrait(StructA, Trait);
StructA.AssociatedType = number;
StructA.CONST_ITEM = 23;
StructA.static_method = function () {
  log();
};
StructA.prototype.method = function () {
  log();
};
