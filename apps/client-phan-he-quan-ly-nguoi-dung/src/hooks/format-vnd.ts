import { useCallback } from 'react'
import useFindMe from './find-me'

const useFormatVnd = () => {
    const { data: me } = useFindMe()
    const formatVND = useCallback(
        (x: string | number = 0) => {
            const moneyFormatter = Intl.NumberFormat('it-IT', {
                currency: 'VND',
                currencySign: 'standard',
                style: 'currency',
            })
            return moneyFormatter.format(Number(`${x}`)).replace('VND', '')
        },
        [me]
    )

    return {
        formatVND,
    }
}
export default useFormatVnd
