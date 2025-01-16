import { useCallback } from 'react'
const units = [
    '',
    'một',
    'hai',
    'ba',
    'bốn',
    'năm',
    'sáu',
    'bảy',
    'tám',
    'chín',
]
const tens = [
    '',
    '',
    'hai mươi',
    'ba mươi',
    'bốn mươi',
    'năm mươi',
    'sáu mươi',
    'bảy mươi',
    'tám mươi',
    'chín mươi',
]
const scales = ['', 'nghìn', 'triệu', 'tỷ']
const useVndToWord = () => {
    const vndToWord = useCallback((num: number) => {
        const convertChunk = (chunk: number) => {
            if (chunk === 0) return ''

            const hundreds = Math.floor(chunk / 100)
            const remainder = chunk % 100
            const tensDigit = Math.floor(remainder / 10)
            const unitsDigit = remainder % 10

            let words = ''

            if (hundreds) {
                words += `${units[hundreds]} trăm `
            }

            if (remainder) {
                if (hundreds && remainder < 10) {
                    words += 'lẻ '
                }

                if (remainder < 10) {
                    words += units[remainder]
                } else if (remainder < 20) {
                    words += `mười ${units[unitsDigit]}`
                } else {
                    words += tens[tensDigit]
                    if (unitsDigit) {
                        words += ` ${units[unitsDigit]}`
                    }
                }
            }

            return words.trim()
        }
        if (num === 0) return 'không'

        let words = ''
        let scale = 0

        while (num > 0) {
            const chunk = num % 1000
            if (chunk) {
                const chunkWords = convertChunk(chunk)
                words = `${chunkWords} ${scales[scale]} ${words}`
            }
            num = Math.floor(num / 1000)
            scale++
        }

        words = words.trim().replace(/\s+/g, ' ')
        return `${words.charAt(0).toUpperCase() + words.slice(1)} đồng`
    }, [])

    return {
        vndToWord,
    }
}
export default useVndToWord
