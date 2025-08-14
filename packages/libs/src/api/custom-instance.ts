export const fetchInstance = async (url: string, options?: RequestInit): Promise<Response> => {
    const accessToken = localStorage.getItem('ACCESS_TOKEN')

    const payload: RequestInit = {
        ...options,
        credentials: 'include',
        headers: {
            ...options?.headers,
            Authorization: `Bearer ${accessToken}`,
        },
    }
    return await fetch(url, payload)
}

const getBody = <T>(c: Response | Request): Promise<T> => {
    const contentType = c.headers.get('content-type')

    if (contentType?.includes('application/json')) {
        return c.json()
    }

    if (contentType?.includes('text/')) {
        return c.text() as Promise<T>
    }
    
    return c.blob() as Promise<T>
}

// TODO: Update just base url
const getUrl = (baseUrl: string, contextUrl: string): string => {
    // const url = new URL(contextUrl)
    // const pathname = url.pathname
    // const search = url.search
    // const baseUrl = 'http://127.0.0.1:3001'
    // const baseUrl = 'https://api.ttn.x52.swantech.vn'

    const requestUrl = new URL(`${baseUrl}${contextUrl}`)

    return requestUrl.toString()
}

export const customModelFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
    const requestUrl = getUrl('https://api.model.mta.swantech.vn', url)

    const response = await fetchInstance(requestUrl, options)
    const data = await getBody<T>(response)

    return { status: response.status, data, headers: response.headers } as T
}

export const customUserFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
    const requestUrl = getUrl('https://api.user.mta.swantech.vn', url)

    const response = await fetchInstance(requestUrl, options)
    const data = await getBody<T>(response)

    return { status: response.status, data, headers: response.headers } as T
}

export const customTrainingFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
    const requestUrl = getUrl('https://api.daotao.mta.swantech.vn', url)

    const response = await fetchInstance(requestUrl, options)
    const data = await getBody<T>(response)

    return { status: response.status, data, headers: response.headers } as T
}

export const customExamFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
    const requestUrl = getUrl('https://api.khaothi.mta.swantech.vn', url)

    const response = await fetchInstance(requestUrl, options)
    const data = await getBody<T>(response)

    return { status: response.status, data, headers: response.headers } as T
}

export const customSystemFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
    const requestUrl = getUrl('https://mta.swantech.vn', url)

    const response = await fetchInstance(requestUrl, options)
    const data = await getBody<T>(response)

    return { status: response.status, data, headers: response.headers } as T
}
