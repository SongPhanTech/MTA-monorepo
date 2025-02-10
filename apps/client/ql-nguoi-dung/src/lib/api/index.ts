import { QueryClient } from '@tanstack/react-query'
import { getSession } from 'next-auth/react'
const queryClient = new QueryClient()

const fetchInstance = async (url: string, options?: RequestInit) => {
    const data = await getSession()
    const accessToken = data?.user.access_token
    return fetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    })
}
export { fetchInstance, queryClient }
