import { getStorage, setStorage } from '@lib/storage'
import { QueryClient } from '@tanstack/react-query'
import { getSession } from 'next-auth/react'
const queryClient = new QueryClient()
const fetchInstance = async (url: string, options?: RequestInit) => {
    let accessToken = getStorage('ACCESS_TOKEN')
    if (!accessToken) {
        const data = await getSession()
        if (data) {
            setStorage('ACCESS_TOKEN', data.user.access_token)
            accessToken = data.user.access_token
        }
    }
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
