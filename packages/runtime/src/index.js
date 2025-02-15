const discriminantKey = Symbol("Discriminant");

export function enumMember(discriminant, data) {
  return {
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
