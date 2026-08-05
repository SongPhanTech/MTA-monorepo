import Loading from "@components/commons/loading"
import DefaultLayout from "@layouts/default-layout"
import { useGetClassRegisterSession } from "@workspace/libs/api/portal"
import { Tabs } from "antd"
import dayjs from "dayjs"
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
        <center>
          <b className="text-lg">{"Tạm ngừng đăng ký học. Vui lòng quay lại sau!"}</b>
        </center>
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
