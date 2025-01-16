import { QueryClient } from '@tanstack/react-query'
import { HttpStatusCode } from 'axios'
const queryClient = new QueryClient()
const AUTH_URL = ['auth/login', 'auth/logout', 'auth/refresh-token']
const interceptorsResponse = async (status: number, url: string) => {
    if (
        (status === HttpStatusCode.Unauthorized ||
            status === HttpStatusCode.Forbidden) &&
        AUTH_URL.every((item) => !url.includes(item))
    ) {
        //TODO: Logout
    }
}

const fetchInstance = (url: string, options?: RequestInit) => {
    return fetch(url, options || {}).then(async (res) => {
        await interceptorsResponse(res.status, res.url)
        return res
    })
}
export { fetchInstance, queryClient }
