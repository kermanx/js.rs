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
  get({ v }, prop) {
    if (prop === REF_TARGET) return v;
    return Reflect.get(v, prop);
  },
  set(target, prop, value) {
    if (prop === REF_TARGET) {
      target.v = value;
      target.s(value);
      return true;
    }
    return Reflect.set(target.v, prop, value);
  },
  has({ v }, prop) {
    if (prop === REF_TARGET) return true;
    return Reflect.has(v, prop);
  },
  apply({ v }, this, args) {
    return Reflect.apply(v, this, args);
  },
  construct({ v }, args) {
    return Reflect.construct(v, args);
  },
  defineProperty({ v }, prop, descriptor) {
    return Reflect.defineProperty(v, prop, descriptor);
  },
  deleteProperty({ v }, prop) {
    return Reflect.deleteProperty(v, prop);
  },
  getOwnPropertyDescriptor({ v }, prop) {
    return Reflect.getOwnPropertyDescriptor(v, prop);
  },
  getPrototypeOf({ v }) {
    return Reflect.getPrototypeOf(v);
  },
  isExtensible({ v }) {
    return Reflect.isExtensible(v);
  },
  ownKeys({ v }) {
    return Reflect.ownKeys(v);
  },
  preventExtensions({ v }) {
    return Reflect.preventExtensions(v);
  },
  setPrototypeOf({ v }, proto) {
    return Reflect.setPrototypeOf(v, proto);
  },
};

export function refMut(v, s) {
  return new Proxy({ v, s }, refProxyHandler);
}

export function deref(v) {
  return REF_TARGET in v ? v[REF_TARGET] : v;
}

/** @type {ProxyHandler} */
const destructRefProxyHandler = {
  get(r, prop) {
    return ref(() => r[prop], (v) => r[prop] = v);
  },
}

export function destruct(v) {
  if (REF_TARGET in v) {
    return new Proxy(v, destructRefProxyHandler);
  } else {
    return v;
  }
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
