import { queryClient } from "@api/index"
import GiangVienAccessGuard from "@components/commons/giang-vien-access-guard"
import { Spinner } from "@components/commons/spinner"
import { colors } from "@constants/colors"
import CongGiangVienLayout from "@layouts/cong-giang-vien-layout"
import store from "@redux/store"
import "@styles/globals.css"
import * as modals from "@components/modal"
import { QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "@workspace/auth/react"
import { ROUTER_PATH } from "@workspace/router"
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
import type { AppProps } from "next/app"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { ReactHookModalProvider } from "react-hook-disclosure-modal"
import LoadingBar from "react-top-loading-bar"
import "@assets/css/cong-giang-vien.css"
import "@assets/css/custom.css"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { setupAppTimezone } from "@workspace/libs/timezone"
import { lightThemeCustom } from "@workspace/ui"
import "@workspace/libs"
import { fetchInstance } from "@workspace/libs/api/custom-instance"

setupAppTimezone()
dayjs.locale("vi")
dayjs.extend(weekOfYear)
dayjs.extend(isoWeeksInYear)
dayjs.extend(isLeapYear)
dayjs.extend(isSameOrBefore)
dayjs.extend(quarterOfYear)
dayjs.extend(isBetween)

// Toàn bộ app là cổng giảng viên nên mọi trang đều bọc trong CongGiangVienLayout.
// Trang dashboard và lịch của tôi tự quản lý khung nội dung nên dùng unLayout.
const UN_LAYOUT_PATHS = [ROUTER_PATH.CONG_GIANG_VIEN.HOME, ROUTER_PATH.CONG_GIANG_VIEN.LICH_CUA_TOI]

function App({ Component, pageProps }: AppProps) {
  const [progress, setProgress] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const unLayout = UN_LAYOUT_PATHS.includes(router.pathname)

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
          <title>Cổng giảng viên</title>
        </Head>
        <ConfigProvider theme={lightThemeCustom}>
          <QueryClientProvider client={queryClient}>
            <ZenStackHooksProvider
              value={{
                endpoint: `${getRuntimeEnv("NEXT_PUBLIC_API_MODEL_BASE_URL")}/api/model`,
                fetch: fetchInstance,
              }}
            >
              <GiangVienAccessGuard>
                <ReactHookModalProvider modals={modals}>
                  <CongGiangVienLayout unLayout={unLayout}>
                    <Component {...pageProps} />
                  </CongGiangVienLayout>
                  {/* <WidgetChatbot src={getRuntimeEnv("NEXT_PUBLIC_CHATBOT_SRC")} /> */}
                  <Spinner />
                </ReactHookModalProvider>
              </GiangVienAccessGuard>
            </ZenStackHooksProvider>
          </QueryClientProvider>
        </ConfigProvider>
      </StoreProvider>
    </SessionProvider>
  )
}

export default App
