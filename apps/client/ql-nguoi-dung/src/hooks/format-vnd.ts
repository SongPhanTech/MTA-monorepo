import { useCallback } from 'react'

const useFormatVnd = () => {
    const formatVND = useCallback((x: string | number = 0) => {
        const moneyFormatter = Intl.NumberFormat('it-IT', {
            currency: 'VND',
            currencySign: 'standard',
            style: 'currency',
        })
        return moneyFormatter.format(Number(`${x}`)).replace('VND', '')
    }, [])
    return {
        formatVND,
    }
}
export default useFormatVnd
