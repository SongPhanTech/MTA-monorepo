import Loading from "@components/commons/loading"
import DefaultLayout from "@layouts/default-layout"
import { useGetClassRegisterSession } from "@workspace/libs/api/portal"
import { Tabs } from "antd"
import dayjs from "dayjs"
import { CalendarOff, Clock3 } from "lucide-react"
import { useState } from "react"
import DanhSachMonDangKy from "@components/commons/registered-courses-list"

dayjs.locale("vi")

export default function DangKyHocPage() {
  const [_filters, _setFilters] = useState({
    searchText: "",
  })
  const { data: classRegisterSession, isLoading } = useGetClassRegisterSession({
    query: {
      refetchOnWindowFocus: false,
    },
  })

  if (isLoading && !classRegisterSession) {
    return <Loading />
  }

  const sessions =
    classRegisterSession?.status === 200 && Array.isArray(classRegisterSession.data)
      ? classRegisterSession.data
      : []

  return (
    <div>
      {sessions.length === 0 ? (
        <div className="flex min-h-[52vh] items-center justify-center px-4 py-10 animate-page-enter">
          <div className="register-pause relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#028850]/15 bg-white px-8 py-12 text-center shadow-[0_12px_40px_-16px_rgba(2,136,80,0.28)]">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[#028850]/10 blur-2xl register-pause-blob"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -right-12 h-48 w-48 rounded-full bg-[#028850]/[0.08] blur-2xl register-pause-blob-delay"
            />

            <div className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full border border-[#028850]/25 register-pause-ring"
              />
              <span
                aria-hidden
                className="absolute inset-3 rounded-full border border-dashed border-[#028850]/30 register-pause-ring-reverse"
              />
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#028850] to-[#046b3f] text-white shadow-lg shadow-[#028850]/30 register-pause-icon">
                <CalendarOff size={28} strokeWidth={2.1} />
              </div>
            </div>

            <div className="relative space-y-3 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#028850]/8 px-3 py-1 text-xs font-medium tracking-wide text-[#028850]">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse-glow" />
                ĐỢT ĐĂNG KÝ ĐÃ ĐÓNG
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                Tạm ngừng đăng ký học
              </h2>

              <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-gray-500">
                Hiện chưa có đợt đăng ký nào đang mở. Vui lòng quay lại sau khi có thông báo lịch
                đăng ký mới.
              </p>
            </div>

            <div className="relative mt-8 inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-600 animate-fade-in-up-delay-1">
              <Clock3 size={16} className="text-[#028850]" />
              <span>Theo dõi thông báo để biết thời gian mở đăng ký</span>
            </div>
          </div>
        </div>
      ) : (
        <Tabs
          hideAdd
          type="card"
          items={sessions.map((session) => ({
            label: [
              session?.name,
              session?.semester?.name,
              session?.semester?.schoolYear?.name,
            ].join(" - "),
            key: session?.id,
            children: (
              <DanhSachMonDangKy
                sessionId={session?.id}
                curriculumVersions={(session?.curriculumVersions ?? [])
                  .filter((cv): cv is NonNullable<typeof cv> => Boolean(cv?.id))
                  .map((cv) => ({
                    id: cv.id ?? "",
                    name: cv.name ?? "",
                    code: cv.code ?? "",
                  }))}
                endDate={session?.endDate}
                creditLimit={session?.creditLimit ?? []}
                tuitionPerCredit={session?.tuitionPerCredit}
              />
            ),
          }))}
        />
      )}
    </div>
  )
}

DangKyHocPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout breadcrumbList={[{ title: "Đăng ký học" }]}>{page}</DefaultLayout>
}
