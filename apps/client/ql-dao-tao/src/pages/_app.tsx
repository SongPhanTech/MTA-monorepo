import { fetchInstance, queryClient } from "@api/index"
import { Spinner } from "@components/commons/spinner"
import { colors } from "@constants/colors"
import store from "@redux/store"
import "@styles/globals.css"
import * as modals from "@components/modal"
import { QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "@workspace/auth/react"
import { Provider as ZenStackHooksProvider } from "@workspace/db/hooks"
import { ConfigProvider } from "antd"
import dayjs from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
import isLeapYear from "dayjs/plugin/isLeapYear"
import isoWeeksInYear from "dayjs/plugin/isoWeeksInYear"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import quarterOfYear from "dayjs/plugin/quarterOfYear"
import weekOfYear from "dayjs/plugin/weekOfYear"
import { StoreProvider } from "easy-peasy"
import type { NextComponentType } from "next"
import type { AppProps } from "next/app"
import Head from "next/head"
import { useRouter } from "next/router"
import { type ReactNode, useEffect, useState } from "react"
import { ReactHookModalProvider } from "react-hook-disclosure-modal"
import LoadingBar from "react-top-loading-bar"
// import "@assets/css/cong-giang-vien.css"
// import "@assets/css/custom.css"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { lightThemeCustom } from "@workspace/ui"
import { isCongGiangVienRoute } from "@constants/cong-giang-vien-path"
import CongGiangVienLayout from "@layouts/cong-giang-vien-layout"
import { useGiangVien } from "@hooks/use-giang-vien"
import { ROUTER_PATH } from "@workspace/router"
import { setLayoutMode, useLayoutMode } from "@/stores/layout-mode"

dayjs.locale("vi")
dayjs.extend(weekOfYear)
dayjs.extend(isoWeeksInYear)
dayjs.extend(isLeapYear)
dayjs.extend(isSameOrBefore)
dayjs.extend(quarterOfYear)
dayjs.extend(isBetween)

// // Layout cổng GV mới chỉ áp dụng cho route /cong-giang-vien/* khi user là giảng viên.
// function AppContent({
//   Component,
//   pageProps,
// }: {
//   Component: AppProps["Component"]
//   pageProps: AppProps["pageProps"]
// }) {
//   const router = useRouter()
//   const mode = useLayoutMode()
//   const { isGiangVien } = useGiangVien()
//   const pathname = router.pathname
//   const onCongGiangVienRoute = isCongGiangVienRoute(pathname)

//   // biome-ignore lint/correctness/useExhaustiveDependencies: <>
//   useEffect(() => {
//     if (!isLoading && !isGiangVien && mode === "giang-vien") {
//       setLayoutMode("quan-tri")
//     }
//   }, [isLoading, isGiangVien, mode])

//   // biome-ignore lint/correctness/useExhaustiveDependencies: <>
//   useEffect(() => {
//     if (!isLoading && !isGiangVien && onCongGiangVienRoute) {
//       router.replace(ROUTER_PATH.QL_DAO_TAO.HOME)
//     }
//   }, [isLoading, isGiangVien, onCongGiangVienRoute, router.replace])

//   if (onCongGiangVienRoute && isLoading) return null
//   if (mode === null && isLoading) return null

//   const componentWithLayout = Component as NextComponentType & {
//     getLayout?: (page: ReactNode) => ReactNode
//   }
//   const getLayout: (page: ReactNode) => ReactNode =
//     componentWithLayout.getLayout ?? ((page) => page)

//   const pageElement = <Component {...pageProps} />
//   const useCongGiangVienLayout = isGiangVien && onCongGiangVienRoute
//   const unLayout = pathname === ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_GIANG_VIEN

//   if (useCongGiangVienLayout) {
//     return <CongGiangVienLayout unLayout={unLayout}>{pageElement}</CongGiangVienLayout>
//   }
//   return <>{getLayout(pageElement)}</>
// }

function App({ Component, pageProps }: AppProps) {
  const [progress, setProgress] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  const getLayout: (page: ReactNode) => ReactNode =
    (
      Component as NextComponentType & {
        getLayout?: (page: ReactNode) => ReactNode
      }
    ).getLayout ?? ((page) => page)

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
                endpoint: `${getRuntimeEnv("NEXT_PUBLIC_API_MODEL_BASE_URL")}/api/model`,
                fetch: fetchInstance,
              }}
            >
              <ReactHookModalProvider modals={modals}>
                {getLayout(<Component {...pageProps} />)}

                {/* <WidgetChatbot src={getRuntimeEnv('NEXT_PUBLIC_CHATBOT_SRC')} /> */}
                <Spinner />
              </ReactHookModalProvider>
            </ZenStackHooksProvider>
          </QueryClientProvider>
        </ConfigProvider>
      </StoreProvider>
    </SessionProvider>
  )
}

export default App
