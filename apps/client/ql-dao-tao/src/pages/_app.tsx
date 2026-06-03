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
import "@assets/css/custom.css"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { lightThemeCustom } from "@workspace/ui"
import GiangVienLayout from "@layouts/giang-vien-layout"
import { useGiangVien } from "@hooks/use-giang-vien"
import { useLayoutMode } from "@/stores/layout-mode"

dayjs.locale("vi")
dayjs.extend(weekOfYear)
dayjs.extend(isoWeeksInYear)
dayjs.extend(isLeapYear)
dayjs.extend(isSameOrBefore)
dayjs.extend(quarterOfYear)
dayjs.extend(isBetween)

// Chọn layout — phải nằm TRONG các Provider (Session/QueryClient/ZenStack) vì useGiangVien cần chúng.
// Mặc định sang Cổng Giảng viên khi là giảng viên, kể cả khi chưa có lựa chọn mode (vào deep link).
function AppContent({
  Component,
  pageProps,
}: {
  Component: AppProps["Component"]
  pageProps: AppProps["pageProps"]
}) {
  const mode = useLayoutMode()
  const { isGiangVien, isLoading } = useGiangVien()

  // Chưa chọn mode và đang xác định vai trò -> chờ, tránh nháy từ layout mặc định sang Cổng GV.
  if (mode === null && isLoading) return null

  const componentWithLayout = Component as NextComponentType & {
    getLayout?: (page: ReactNode) => ReactNode
  }
  const getLayout: (page: ReactNode) => ReactNode =
    componentWithLayout.getLayout ?? ((page) => page)
  const effectiveMode = mode ?? (isGiangVien ? "giang-vien" : "quan-tri")

  const pageElement = <Component {...pageProps} />

  // Các trang không khai báo getLayout (in ấn, đứng độc lập) vẫn render nguyên bản.
  if (effectiveMode === "giang-vien" && componentWithLayout.getLayout) {
    return <GiangVienLayout>{pageElement}</GiangVienLayout>
  }
  return <>{getLayout(pageElement)}</>
}

function App({ Component, pageProps }: AppProps) {
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
                <AppContent Component={Component} pageProps={pageProps} />

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
