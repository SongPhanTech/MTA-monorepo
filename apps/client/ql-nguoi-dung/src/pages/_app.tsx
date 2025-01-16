import { queryClient } from '@api/index'
import ModalWrapper from '@components/modal/wrapper'
import { colors } from '@constants/colors'
import store from '@redux/store'
import '@styles/globals.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { StoreProvider } from 'easy-peasy'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ReactNode, useEffect, useState } from 'react'
import LoadingBar from 'react-top-loading-bar'
import dayjs from 'dayjs'
import lightThemeCustom from '@styles/theme/global-theme-custom'
import { NextComponentType } from 'next'
import { SessionProvider } from 'next-auth/react'
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
                        {getLayout(<Component {...pageProps} />)}
                        <ModalWrapper />
                    </QueryClientProvider>
                </ConfigProvider>
            </StoreProvider>
        </SessionProvider>
    )
}

export default App
