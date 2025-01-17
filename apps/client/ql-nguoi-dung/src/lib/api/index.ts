import { QueryClient } from '@tanstack/react-query'
import { getSession } from 'next-auth/react'
const queryClient = new QueryClient()
const fetchInstance = async (url: string, options?: RequestInit) => {
    const session = await getSession()
    return fetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            Authorization: `Bearer ${session?.user?.access_token}`,
            'Content-Type': 'application/json',
        },
    })
}
export { fetchInstance, queryClient }
