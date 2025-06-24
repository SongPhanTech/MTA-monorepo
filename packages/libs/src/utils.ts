export function splitFullName(fullName?: string): {
    firstName: string
    lastName: string
} {
    if (!fullName || typeof fullName !== 'string') {
        return { firstName: '', lastName: '' }
    }
    const parts = fullName.trim().split(/\s+/)

    const firstName = parts.pop() || '' // Lấy phần cuối cùng làm tên
    const lastName = parts.join(' ') // Phần còn lại là họ + tên đệm

    return { firstName, lastName }
}
