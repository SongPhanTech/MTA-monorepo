import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import { removeStorage } from '@lib/storage'
import { QueryClient } from '@tanstack/react-query'
const queryClient = new QueryClient()

const fetchInstance = async (url: string, options?: RequestInit) => {
    return fetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            'Content-Type': 'application/json',
        },
    }).then((res) => {
        if (res.status === 401) {
            removeStorage('ACCESS_TOKEN')
            removeStorage('REFRESH_TOKEN')
            signOutAction()
        }
        return res
    })
}
export { fetchInstance, queryClient }
