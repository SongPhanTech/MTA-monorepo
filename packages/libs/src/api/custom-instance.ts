import { BROWSER } from 'esm-env'
import { getRuntimeEnv } from '../utils'

const getTokenHeaders = (): Record<string, string> => {
    const headerEnvPairs: Array<{ header: string; value: string }> = [
        // {
        //     header: 'Authorization',
        //     value: process.env.X_TOKEN_LMS || 'Bearer 048E1562746A83519236440B013D6B9C386CED9E758C4A6BBC2F38A2E72131D3',
        // }
    ]

    return headerEnvPairs.reduce<Record<string, string>>((acc, item) => {
        if (item.value) {
            acc[item.header] = item.value
        }
        return acc
    }, {})
}

export const fetchInstance = async (url: string, options?: RequestInit): Promise<Response> => {
    const accessToken = BROWSER ? localStorage.getItem('ACCESS_TOKEN') : ''
    const tokenHeaders = getTokenHeaders()

    const payload: RequestInit = {
        ...options,
        credentials: 'include',
        headers: {
            ...options?.headers,
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...tokenHeaders,
        },
    }
    return await fetch(url, payload).then((res) => {
        if (res.status === 401) {
            if (typeof window !== 'undefined') {
                const event = new CustomEvent('mta-session-expired', {
                    detail: {
                        message: 'Phiên đăng nhập hết hạn',
                    },
                })
                window.dispatchEvent(event)
            }
        }
        return res
    })
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

export const getUrl = (baseUrl: string, contextUrl: string): string => {
    if (!baseUrl.startsWith('http')) {
        return `${baseUrl}${contextUrl}`
    }
    const requestUrl = new URL(`${baseUrl}${contextUrl}`)

    return requestUrl.toString()
}

export const customModelFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
    const requestUrl = getUrl(
        getRuntimeEnv('NEXT_PUBLIC_API_MODEL_BASE_URL') || 'https://api.model.mta.swantech.vn',
        url
    )

    const response = await fetchInstance(requestUrl, options)
    const data = await getBody<T>(response)

    return { status: response.status, data, headers: response.headers } as T
}

export const customTrainingFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
    const requestUrl = getUrl(
        getRuntimeEnv('NEXT_PUBLIC_API_LMS_BASE_URL') || 'https://api.daotao.mta.swantech.vn',
        url
    )

    const response = await fetchInstance(requestUrl, options)
    const data = await getBody<T>(response)

    return { status: response.status, data, headers: response.headers } as T
}

export const customExamFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
    const requestUrl = getUrl(
        getRuntimeEnv('NEXT_PUBLIC_API_EMS_BASE_URL') || 'https://api.khaothi.mta.swantech.vn',
        url
    )

    const response = await fetchInstance(requestUrl, options)
    const data = await getBody<T>(response)

    return { status: response.status, data, headers: response.headers } as T
}

export const customPortalFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
    const requestUrl = getUrl(
        getRuntimeEnv('NEXT_PUBLIC_API_PORTAL_BASE_URL') || 'https://api.portal.mta.swantech.vn',
        url
    )

    const response = await fetchInstance(requestUrl, options)
    const data = await getBody<T>(response)

    return { status: response.status, data, headers: response.headers } as T
}

export const customSystemFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
    const requestUrl = getUrl(
        process.env.SYSTEM_BASE_URL
            ? `${process.env.SYSTEM_BASE_URL}/api/system/public`
            : getRuntimeEnv('NEXT_PUBLIC_API_SYSTEM_BASE_URL')
              ? `${getRuntimeEnv('NEXT_PUBLIC_API_SYSTEM_BASE_URL')}/api/system/${process.env.NEXT_PUBLIC_APP_CODE}`
              : `https://api.model.mta.swantech.vn/api/system/${process.env.NEXT_PUBLIC_APP_CODE}`,
        url
    )

    const response = await fetchInstance(requestUrl, options)
    const data = await getBody<T>(response)

    return { status: response.status, data, headers: response.headers } as T
}

export const customSystemShareFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
    const appCode = getRuntimeEnv('NEXT_PUBLIC_APP_CODE') || process.env.NEXT_PUBLIC_APP_CODE
    const requestUrl = getUrl(
        process.env.SYSTEM_BASE_URL
            ? `${process.env.SYSTEM_BASE_URL}/api/system/share`
            : getRuntimeEnv('NEXT_PUBLIC_API_SYSTEM_BASE_URL')
              ? `${getRuntimeEnv('NEXT_PUBLIC_API_SYSTEM_BASE_URL')}/api/system/${appCode}`
              : `https://api.model.mta.swantech.vn/api/system/${appCode}`,
        url
    )

    const response = await fetchInstance(requestUrl, options)
    const data = await getBody<T>(response)

    return { status: response.status, data, headers: response.headers } as T
}

export const customStorageFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
    const requestUrl = getUrl(
        process.env.SYSTEM_BASE_URL
            ? `${process.env.SYSTEM_BASE_URL}/api/system/share`
            : getRuntimeEnv('NEXT_PUBLIC_API_SYSTEM_BASE_URL')
              ? `${getRuntimeEnv('NEXT_PUBLIC_API_SYSTEM_BASE_URL')}/api/system/storage`
              : 'https://api.model.mta.swantech.vn/api/system/storage',
        url
    )

    const response = await fetchInstance(requestUrl, options)
    const data = await getBody<T>(response)

    return { status: response.status, data, headers: response.headers } as T
}
