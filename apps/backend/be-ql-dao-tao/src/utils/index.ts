export function splitFullName(fullName: string) {
    if (!fullName || typeof fullName !== 'string')
        return { firstName: '', lastName: '' }

    const parts = fullName.trim().split(/\s+/) // Cắt chuỗi theo khoảng trắng
    if (parts.length === 1) {
        return { firstName: parts[0], lastName: '' } // Nếu chỉ có một từ, coi như chỉ có tên
    }

    const firstName = parts.pop() // Lấy phần cuối cùng làm tên
    const lastName = parts.join(' ') // Phần còn lại là họ + tên đệm

    return { firstName, lastName }
}

export function parseDate(input?: number | string | Date): Date | null {
    if (!input) return null
    if (input) {
        // Check if input is a number (Excel date serial number)
        if (typeof input === 'number') {
            const excelEpoch = new Date(1899, 11, 31) // 31/12/1899 (Excel starts at 1/1/1900 = 1)
            return new Date(excelEpoch.getTime() + input * 24 * 60 * 60 * 1000)
        }
        // Check if input is a DD/MM/YYYY string
        if (typeof input === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
            const [day, month, year] = input.split('/').map(Number)
            if (
                year !== undefined &&
                month !== undefined &&
                day !== undefined
            ) {
                return new Date(year, month - 1, day)
            }
        }
    }

    if (input instanceof Date) {
        return input
    }

    return null
}
