import { QueryClient } from '@tanstack/react-query'
const queryClient = new QueryClient()

const fetchInstance = async (url: string, options?: RequestInit) => {
    // let accessToken = getStorage('ACCESS_TOKEN')
    // if (!accessToken) {
    //     const data = await getSession()
    //     if (data) {
    //         accessToken = data?.access_token
    //         setStorage('ACCESS_TOKEN', accessToken)
    //     }
    // }
    return fetch(url, {
        ...options,
        credentials: 'include',
    })
        .then((res) => {
            if (res.status === 401) {
                if (typeof window !== 'undefined') {
                    const event = new CustomEvent('mta-session-expired', {
                        detail: {
                            message: 'Phiên đăng nhập hết hạn',
                        },
                    })
                    window.dispatchEvent(event)
                }
                console.log('code come here 401')
            }
            return res
        })
}
export { fetchInstance, queryClient }
