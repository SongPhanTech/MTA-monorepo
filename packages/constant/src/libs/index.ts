export const emptyObjectIf = <T>(obj: T, condition: boolean): T => {
  if (condition) {
    return obj
  }
  if (Array.isArray(obj)) {
    return [] as unknown as T
  }
  return {} as T
}
