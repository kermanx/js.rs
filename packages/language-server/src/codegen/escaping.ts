export function escapeCtorName(name: string) {
  return `__JSRS_${name}__Ctor`;
}

export function escapeDataName(name: string) {
  return `__JSRS_${name}__Data`;
}
