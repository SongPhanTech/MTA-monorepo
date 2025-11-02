export const getMinioUrl = (uri: string | undefined | null) => {
    if (!uri) return ''
    const isAbsolutePath = uri.startsWith('http') || uri.startsWith('blob')
    if (isAbsolutePath) return uri
    // TODO: check env minio domain
    const url = new URL(uri, process.env.NEXT_PUBLIC_MINIO_ENDPOINT || 'https://minio.swantech.vn')
    return url.href
}

export const emptyObjectIf = <T>(obj: T, condition: boolean): T => {
    if (condition) {
        return obj
    }
    if (Array.isArray(obj)) {
        return [] as unknown as T
    }
    return {} as T
}
