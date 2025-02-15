const discriminantKey = Symbol("Discriminant");

export function enumMember(ctor, discriminant, data) {
  return {
    __proto__: ctor.prototype,
    [discriminantKey]: discriminant,
    data,
  };
}

export function matches(value, discriminant) {
  return value?.[discriminantKey] === discriminant ? value.data : null;
}

export function impl(target, members) {

}

export function ref(value) {
  return {
    value,
  };
}

export function deref(ref) {
  return ref.value;
}
