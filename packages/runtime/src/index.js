const DISCRIMINANT_KEY = Symbol("Discriminant");

export function variant(discriminant) {
  return (...data) => ({
    __proto__: this.prototype,
    [DISCRIMINANT_KEY]: discriminant,
    data,
  });
}

export function unitVariant(discriminant) {
  return {
    __proto__: this.prototype,
    [DISCRIMINANT_KEY]: discriminant,
    data,
  };
}

export function matches(value, discriminant) {
  return value?.[DISCRIMINANT_KEY] === discriminant ? value.data : null;
}

export function impl(target, members) {
  Object.assign(target.prototype, members);
}

export const REF_TARGET = Symbol("Ref Target");

/** @type {ProxyHandler} */
const refProxyHandler = {
  get({ g }, prop) {
    if (prop === REF_TARGET) return g();
    return Reflect.get(g(), prop);
  },
  set({ g, s }, prop, value) {
    if (prop === REF_TARGET) {
      s(value);
      return true;
    }
    return Reflect.set(g(), prop, value);
  },
  apply({ g }, this, args) {
    return Reflect.apply(g(), this, args);
  },
  construct({ g }, args) {
    return Reflect.construct(g(), args);
  },
  defineProperty({ g }, prop, descriptor) {
    return Reflect.defineProperty(g(), prop, descriptor);
  },
  deleteProperty({ g }, prop) {
    return Reflect.deleteProperty(g(), prop);
  },
  getOwnPropertyDescriptor({ g }, prop) {
    return Reflect.getOwnPropertyDescriptor(g(), prop);
  },
  getPrototypeOf({ g }) {
    return Reflect.getPrototypeOf(g());
  },
  has({ g }, prop) {
    return Reflect.has(g(), prop);
  },
  isExtensible({ g }) {
    return Reflect.isExtensible(g());
  },
  ownKeys({ g }) {
    return Reflect.ownKeys(g());
  },
  preventExtensions({ g }) {
    return Reflect.preventExtensions(g());
  },
  setPrototypeOf({ g }, proto) {
    return Reflect.setPrototypeOf(g(), proto);
  },
};

export function ref(g, s) {
  return new Proxy({ g, s }, refProxyHandler);
}

const IS_RANGE = Symbol("Is Range");

export function range(start, end) {
  return {
    [IS_RANGE]: true,
    start,
    end,
  }
}

export function index(target, index) {
  if (index[IS_RANGE]) {
    return target.slice(index.start, index.end);
  } else {
    return target[index];
  }
}
