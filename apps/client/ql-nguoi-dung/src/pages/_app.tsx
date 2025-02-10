import { fetchInstance, queryClient } from '@api/index'
import { Spinner } from '@components/commons/spinner'
import ModalWrapper from '@components/modal/wrapper'
import { colors } from '@constants/colors'
import { API_BASE_URL } from '@constants/constants'
import store from '@redux/store'
import '@styles/globals.css'
import lightThemeCustom from '@styles/theme/global-theme-custom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Provider as ZenStackHooksProvider } from '@workspace/db/hooks'
import { ConfigProvider } from 'antd'
import dayjs from 'dayjs'
import { StoreProvider } from 'easy-peasy'
import type { NextComponentType } from 'next'
import { SessionProvider } from 'next-auth/react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { type ReactNode, useEffect, useState } from 'react'
import LoadingBar from 'react-top-loading-bar'
dayjs.locale('vi')
function App({ Component, pageProps }: AppProps) {
    const getLayout: (page: ReactNode) => ReactNode =
        (
            Component as NextComponentType & {
                getLayout?: (page: ReactNode) => ReactNode
            }
        ).getLayout ?? ((page) => page)
    const [progress, setProgress] = useState(0)
    const [isClient, setIsClient] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setIsClient(true)
    }, [])

    const onRouteChangeStart = () => {
        setProgress(40)
    }

    const onRouteChangeComplete = () => {
        setProgress(100)
    }

    const onRouteDone = () => {
        setProgress(0)
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        router.events.on('routeChangeStart', onRouteChangeStart)
        router.events.on('routeChangeComplete', onRouteChangeComplete)
        router.events.on('routeChangeError', onRouteChangeComplete)

        return () => {
            router.events.off('routeChangeStart', onRouteChangeStart)
            router.events.off('routeChangeComplete', onRouteChangeComplete)
            router.events.off('routeChangeError', onRouteChangeComplete)
        }
    }, [])

    if (!isClient) return null

    return (
        <SessionProvider session={pageProps.session}>
            <StoreProvider store={store}>
                <LoadingBar
                    color={colors.common.green}
                    waitingTime={400}
                    progress={progress}
                    onLoaderFinished={onRouteDone}
                />
                <Head>
                    <title>Học viện kỹ thuật quân sự</title>
                </Head>
                <ConfigProvider theme={lightThemeCustom}>
                    <QueryClientProvider client={queryClient}>
                        <ZenStackHooksProvider
                            value={{
                                endpoint: `${API_BASE_URL}/api/model`,
                                fetch: fetchInstance,
                            }}
                        >
                            {getLayout(<Component {...pageProps} />)}
                            <Spinner />
                            <ModalWrapper />
                        </ZenStackHooksProvider>
                    </QueryClientProvider>
                </ConfigProvider>
            </StoreProvider>
        </SessionProvider>
    )
}

export default App
