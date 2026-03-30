import { useCallback } from "react"

type Overrides = Record<string, (value: any) => any>
export const useTrimText = () => {
  const trimText = useCallback((text: any): any => {
    if (typeof text === "string") {
      return text.trim().replace(/\s+/g, " ")
    }
    return text
  }, [])

  const trimObjectFields = useCallback(
    <T extends Record<string, any>>(obj: T, overrides: Overrides = {}): T => {
      const result: Record<string, any> = {}

      for (const key in obj) {
        const value = obj[key]
        if (overrides[key]) {
          result[key] = overrides[key](value)
        } else if (typeof value === "string") {
          result[key] = value.trim()
        } else {
          result[key] = value
        }
      }

      return result as T
    },
    []
  )

  const trimArrayFields = useCallback(
    <T>(array: T[]): T[] => {
      if (!Array.isArray(array)) return array

      return array.map((item) => {
        if (typeof item === "object" && item !== null) {
          return trimObjectFields(item)
        }
        return trimText(item)
      })
    },
    [trimText, trimObjectFields]
  )

  return {
    trimText,
    trimObjectFields,
    trimArrayFields,
  }
}

export default useTrimText
