export async function customFetch<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    const username = process.env.OIDC_ADMIN_USERNAME
    const password = process.env.OIDC_ADMIN_PASSWORD
    const credentials = Buffer.from(`${username}:${password}`).toString(
        'base64'
    )

    const url = `${process.env.OIDC_BASE_URL}/api/users/v1${path}`
    console.log({ url })

    const res = await fetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            Authorization: `Basic ${credentials}`,
        },
    })

    const data =
        [204, 205, 304].includes(res.status) || !res.body
            ? {}
            : await res.json()

    return { status: res.status, data, headers: res.headers } as T
}
