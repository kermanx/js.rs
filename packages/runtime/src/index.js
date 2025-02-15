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
  Object.assign(target.prototype, members);
}

export function ref(g) {
  return Object.defineProperty({}, 'v', {
    get: g
  });
}

export function refMut(g, s) {
  return Object.defineProperty({}, 'v', {
    get: g,
    set: s
  });
}
