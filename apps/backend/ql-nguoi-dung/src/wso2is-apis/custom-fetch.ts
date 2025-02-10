export async function userFetch<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    return customFetch<T>('users', path, options)
}

export async function serverFetch<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    return customFetch<T>('server', path, options)
}

export async function customFetch<T>(
    type: 'users' | 'server',
    path: string,
    options?: RequestInit
): Promise<T> {
    const username = process.env.OIDC_ADMIN_USERNAME
    const password = process.env.OIDC_ADMIN_PASSWORD

    // const username = process.env.OIDC_CLIENT_ID
    // const password = process.env.OIDC_CLIENT_SECRET

    const credentials = Buffer.from(`${username}:${password}`).toString(
        'base64'
    )

    console.log({ credentials })

    const url = `${process.env.OIDC_BASE_URL}/api/${type}/v1${path}`
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
