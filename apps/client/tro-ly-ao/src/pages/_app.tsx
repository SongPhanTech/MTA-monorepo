import { fetchInstance, queryClient } from "@api/index"
import { Spinner } from "@components/commons/spinner"
import { colors } from "@constants/colors"
import store from "@redux/store"
import "@styles/globals.css"
import * as modals from "@components/modal"
import { QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "@workspace/auth/react"
import { Provider as ZenStackHooksProvider } from "@workspace/db/hooks"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { setupAppTimezone } from "@workspace/libs/timezone"
import { lightThemeCustom } from "@workspace/ui"
import { ConfigProvider } from "antd"
import dayjs from "dayjs"
import { StoreProvider } from "easy-peasy"
import type { NextComponentType } from "next"
import type { AppProps } from "next/app"
import Head from "next/head"
import { useRouter } from "next/router"
import { type ReactNode, useEffect, useState } from "react"
import { ReactHookModalProvider } from "react-hook-disclosure-modal"
import LoadingBar from "react-top-loading-bar"

setupAppTimezone()
dayjs.locale("vi")

// Pages that require SSO authentication (using SessionProvider)
const ADMIN_PATHS = ["/quan-tri"]

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

  // Check if current page requires auth
  const requiresAuth = ADMIN_PATHS.some((path) => router.pathname.startsWith(path))

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    router.events.on("routeChangeStart", onRouteChangeStart)
    router.events.on("routeChangeComplete", onRouteChangeComplete)
    router.events.on("routeChangeError", onRouteChangeComplete)

    return () => {
      router.events.off("routeChangeStart", onRouteChangeStart)
      router.events.off("routeChangeComplete", onRouteChangeComplete)
      router.events.off("routeChangeError", onRouteChangeComplete)
    }
  }, [])

  if (!isClient) return null

  const appContent = (
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
              endpoint: `${getRuntimeEnv("NEXT_PUBLIC_API_MODEL_BASE_URL")}/api/model`,
              fetch: fetchInstance,
            }}
          >
            <ReactHookModalProvider modals={modals}>
              {getLayout(<Component {...pageProps} />)}
              <Spinner />
            </ReactHookModalProvider>
          </ZenStackHooksProvider>
        </QueryClientProvider>
      </ConfigProvider>
    </StoreProvider>
  )

  // Only wrap with SessionProvider for admin pages that need SSO
  if (requiresAuth) {
    return <SessionProvider session={pageProps.session}>{appContent}</SessionProvider>
  }

  // Public pages (chatbot) - no SessionProvider, no SSO check
  return appContent
}

export default App
