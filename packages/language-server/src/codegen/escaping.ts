export function escapeCtorName(name: string) {
  return `__JSRS_${name}__Ctor`;
}

export function escapeCtorImplName(name: string) {
  return `__JSRS_${name}__CtorImpl`;
}

export function escapeDataName(name: string) {
  return `__JSRS_${name}__Data`;
}
