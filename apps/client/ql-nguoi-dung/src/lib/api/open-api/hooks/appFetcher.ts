import { AppContext } from './appContext'
import { fetchInstance } from '@api/index'
import { API_BASE_URL } from '@constants/constants'
import qs from 'qs'
const baseUrl = API_BASE_URL.replace('/api/models', '')

export type ErrorWrapper<TError> =
    | TError
    | { status: 'unknown'; payload: string }

export type AppFetcherOptions<TBody, THeaders, TQueryParams, TPathParams> = {
    url: string
    method: string
    body?: TBody
    headers?: THeaders
    queryParams?: TQueryParams
    pathParams?: TPathParams
    signal?: AbortSignal
} & AppContext['fetcherOptions']

export async function appFetch<
    TData,
    TError,
    TBody extends {} | FormData | undefined | null,
    THeaders extends {},
    TQueryParams extends {},
    TPathParams extends {},
>({
    url,
    method,
    body,
    headers,
    pathParams,
    queryParams,
    signal,
}: AppFetcherOptions<
    TBody,
    THeaders,
    TQueryParams,
    TPathParams
>): Promise<TData> {
    try {
        const requestHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            ...headers,
        }

        /**
         * As the fetch API is being used, when multipart/form-data is specified
         * the Content-Type header must be deleted so that the browser can set
         * the correct boundary.
         * https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects#sending_files_using_a_formdata_object
         */
        if (
            requestHeaders['Content-Type']
                .toLowerCase()
                .includes('multipart/form-data')
        ) {
            delete requestHeaders['Content-Type']
        }

        const response = await fetchInstance(
            `${baseUrl}${resolveUrl(url, queryParams, pathParams)}`,
            {
                signal,
                method,
                body: body
                    ? body instanceof FormData
                        ? body
                        : JSON.stringify(body)
                    : undefined,
                headers: requestHeaders,
            }
        )

        if (!response.ok) {
            let error: ErrorWrapper<TError>
            try {
                error = await response.json()
            } catch (e) {
                error = {
                    status: 'unknown' as const,
                    payload:
                        e instanceof Error
                            ? `Unexpected error (${e.message})`
                            : 'Unexpected error',
                }
            }

            throw error
        }

        if (response.headers.get('content-type')?.includes('json')) {
            return await response.json()
        } else {
            // if it is not a json response, assume it is a blob and cast it to TData
            return (await response.blob()) as unknown as TData
        }
    } catch (e) {
        let errorObject: Error = {
            name: 'unknown' as const,
            message:
                e instanceof Error
                    ? `Network error (${e.message})`
                    : 'Network error',
            stack: e as string,
        }
        throw errorObject
    }
}

const resolveUrl = (
    url: string,
    queryParams: Record<string, string | Array<string>> = {},
    pathParams: Record<string, string> = {}
) => {
    let query = qs.stringify(queryParams, {
        arrayFormat: 'repeat',
    })
    if (query) query = `?${query}`
    return (
        url.replace(/\{\w*\}/g, (key) => pathParams[key.slice(1, -1)]) + query
    )
}
