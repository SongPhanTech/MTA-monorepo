import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import { getStorage, removeStorage, setStorage } from '@lib/storage'
import { QueryClient } from '@tanstack/react-query'
import { getSession, signOut } from 'next-auth/react'
const queryClient = new QueryClient()

const fetchInstance = async (url: string, options?: RequestInit) => {
    let accessToken = getStorage('ACCESS_TOKEN')
    if (!accessToken) {
        const data = await getSession()
        if (data) {
            accessToken = data?.user.access_token
            setStorage('ACCESS_TOKEN', accessToken)
        }
    }
    return fetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    }).then((res) => {
        if (res.status === 401) {
            signOut()
            removeStorage('ACCESS_TOKEN')
            signOutAction()
        }
        return res
    })
}
export { fetchInstance, queryClient }
