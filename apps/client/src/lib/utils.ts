import dayjs, { Dayjs } from 'dayjs'
import { twMerge } from 'tailwind-merge'
import clsx, { ClassValue } from 'clsx'
const cn = (...inputs: ClassValue[]) => {
    return twMerge(clsx(inputs))
}
const getPageCount = (totalItems: number, itemsPerPage: number) => {
    return Math.ceil(totalItems / itemsPerPage)
}

const formatDate = (
    date: string | Date | Dayjs,
    unit?: 'Day' | 'Month' | 'Year'
) => {
    if (unit === 'Year') return dayjs(date).format('YYYY')
    if (unit === 'Month') return dayjs(date).format('MM/YYYY')
    return dayjs(date).format('DD/MM/YYYY')
}

const formatDateReadable = (date: string | Date | Dayjs) => {
    const d = dayjs(date)
    return `${d.hour().toString().padStart(2, '0')}h:${d.minute().toString().padStart(2, '0')} - ${d.date().toString().padStart(2, '0')}/${(d.month() + 1).toString().padStart(2, '0')}/${d.year()}`
}

const formatDateVN = (date: string | Date | Dayjs) => {
    const d = dayjs(date)
    return `Ngày ${d.date().toString().padStart(2, '0')} tháng ${(d.month() + 1).toString().padStart(2, '0')} năm ${d.year()}`
}

const getColorByIndex = (index: number) => {
    const colors = [
        '#3182CE',
        '#38A169',
        '#DD6B20',
        '#805AD5',
        '#E53E3E',
        '#D69E2E',
        '#718096',
        '#00CED1',
        '#9400D3',
        '#FF1493',
        '#00BFFF',
        '#696969',
        '#B22222',
        '#228B22',
        '#FF00FF',
        '#DCDCDC',
        '#FFD700',
    ]
    return colors[index % colors.length]
}
const arrayToObject = <T extends Record<string, any>>(
    arr: Array<T>,
    key: keyof T,
    mapFn?: (item: T, currentIndex: number, currentArray: Array<T>) => any
) => {
    return arr.reduce(
        (payload, item, currentIndex, currentArr) => {
            payload[item[key]] = mapFn
                ? mapFn(item, currentIndex, currentArr)
                : item
            return payload
        },
        {} as Record<string, any>
    )
}

const arrayRemoveDuplicates = <T extends Record<string, any>>(
    arr: Array<T>,
    mapFn: (item: T, currentIndex: number, currentArray: Array<T>) => any
) => {
    return [...new Set(arr.map(mapFn).flat())]
}

const formatNiceBytes = (x: string) => {
    const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    let l = 0,
        n = parseInt(x, 10) || 0
    while (n >= 1024 && ++l) {
        n = n / 1024
    }
    return n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]
}

const getUniqueArray = <T>(arr: Array<T> = [], key: keyof T) => {
    return [...new Map(arr.map((item) => [item[key], item])).values()]
}

const stringToSlug = (str: string) => {
    const from =
            'àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷ',
        to =
            'aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiiiaeiiouuncyyyyy'
    for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(RegExp(from[i], 'gi'), to[i])
    }
    return str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '_')
}

export {
    arrayRemoveDuplicates,
    arrayToObject,
    formatDate,
    formatDateReadable,
    formatDateVN,
    formatNiceBytes,
    getColorByIndex,
    getPageCount,
    getUniqueArray,
    cn,
    stringToSlug,
}
