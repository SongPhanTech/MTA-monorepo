import { useCallback, useMemo } from "react"

const useScoreToWords = () => {
  const capitalizeFirstLetter = useCallback((str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }, [])

  const numberToWords = useCallback(
    (num: number): string => {
      const numberWords = [
        "không",
        "một",
        "hai",
        "ba",
        "bốn",
        "năm",
        "sáu",
        "bảy",
        "tám",
        "chín",
        "mười",
      ]

      if (Number.isInteger(num) && num >= 0 && num <= 10) {
        return capitalizeFirstLetter(numberWords[num])
      }

      if (num > 0 && num < 10.99) {
        const integerPart = Math.floor(num)
        const decimalPart = Math.round((num - integerPart) * 10)

        if (decimalPart === 0) {
          return capitalizeFirstLetter(numberWords[integerPart])
        }

        return `${capitalizeFirstLetter(numberWords[integerPart])} phẩy ${numberWords[decimalPart]}`
      }

      return num ? num.toString() : ""
    },
    [capitalizeFirstLetter]
  )

  return useMemo(() => ({ convert: numberToWords }), [numberToWords])
}

export default useScoreToWords
