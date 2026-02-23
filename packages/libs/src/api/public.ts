/**
 * My API
 * OpenAPI spec version: 1.0.0
 */
import { useQuery } from '@tanstack/react-query'
import type {
    DataTag,
    DefinedInitialDataOptions,
    DefinedUseQueryResult,
    QueryClient,
    QueryFunction,
    QueryKey,
    UndefinedInitialDataOptions,
    UseQueryOptions,
    UseQueryResult,
} from '@tanstack/react-query'

import { customPublicFetch } from './custom-instance'
import { getRuntimeEnv } from '../utils'

type AwaitedInput<T> = PromiseLike<T> | T

type Awaited<O> = O extends AwaitedInput<infer T> ? T : never

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1]

export interface VersionApp {
    Id: string
    sTenVersion: string
    sDescription: string
    dNgayPhatHanh: string
}

export type getVersionAppsResponse200 = {
    data: VersionApp[]
    status: 200
}

export type getVersionAppsResponseError = {
    data: { message: string }
    status: number 
}

export type getVersionAppsResponseSuccess = getVersionAppsResponse200 & {
    headers: Headers
}

export type getVersionAppsResponse =
    | getVersionAppsResponseSuccess
    | (getVersionAppsResponseError & { headers: Headers })

export const getGetVersionAppsUrl = () => {
    return `/VersionApps`
}

export const getVersionApps = async (options?: RequestInit): Promise<getVersionAppsResponse> => {
    return customPublicFetch<getVersionAppsResponse>(getGetVersionAppsUrl(), {
        ...options,
        method: 'GET',
    })
}

export const getGetVersionAppsQueryKey = () => {
    return [`/VersionApps`] as const
}

export const getGetVersionAppsQueryOptions = <
    TData = Awaited<ReturnType<typeof getVersionApps>>,
    TError = { message: string },
>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getVersionApps>>, TError, TData>>
    request?: SecondParameter<typeof customPublicFetch>
}) => {
    const { query: queryOptions, request: requestOptions } = options ?? {}

    const queryKey = queryOptions?.queryKey ?? getGetVersionAppsQueryKey()

    const queryFn: QueryFunction<Awaited<ReturnType<typeof getVersionApps>>> = ({ signal }) =>
        getVersionApps({ signal, ...requestOptions })

    return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
        Awaited<ReturnType<typeof getVersionApps>>,
        TError,
        TData
    > & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetVersionAppsQueryResult = NonNullable<Awaited<ReturnType<typeof getVersionApps>>>
export type GetVersionAppsQueryError = { message: string }

export function useGetVersionApps<
    TData = Awaited<ReturnType<typeof getVersionApps>>,
    TError = { message: string },
>(
    options?: {
        query?: Partial<
            UseQueryOptions<Awaited<ReturnType<typeof getVersionApps>>, TError, TData>
        > &
            Pick<
                UndefinedInitialDataOptions<
                    Awaited<ReturnType<typeof getVersionApps>>,
                    TError,
                    Awaited<ReturnType<typeof getVersionApps>>
                >,
                'initialData'
            >
        request?: SecondParameter<typeof customPublicFetch>
    },
    queryClient?: QueryClient
): UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {
    const queryOptions = getGetVersionAppsQueryOptions(options)

    const query = useQuery(queryOptions, queryClient) as UseQueryResult<TData, TError> & {
        queryKey: DataTag<QueryKey, TData, TError>
    }

    query.queryKey = queryOptions.queryKey

    return query
}

export function useAppVersionInfo(options?: { request?: RequestInit }) {
    const query = useGetVersionApps({ request: options?.request })
    const appCode = getRuntimeEnv('NEXT_PUBLIC_APP_CODE') || process.env.NEXT_PUBLIC_APP_CODE

    const versionData = query.data?.data?.[0]

    return {
        ...query,
        appCode,
        version: versionData?.sTenVersion,
        description: versionData?.sDescription,
        releaseDate: versionData?.dNgayPhatHanh,
    }
}