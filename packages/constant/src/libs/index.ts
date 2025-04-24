export const getMinioUrl = (uri: string | undefined | null) => {
    if (!uri) return ''
    const isAbsolutePath = uri.startsWith('http') || uri.startsWith('blob')
    if (isAbsolutePath) return uri
    const url = new URL(uri, process.env.NEXT_PUBLIC_MINIO_ENDPOINT)
    return url.href
}
