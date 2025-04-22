export const getMinioUrl = (uri: string | undefined) => {
    if (!uri) return ''
    const url = new URL(uri, process.env.NEXT_PUBLIC_MINIO_ENDPOINT)
    return url.href
}
