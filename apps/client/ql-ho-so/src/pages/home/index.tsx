import QuyTrinhQuanLyHoSoDashboard from "@components/dashboard/quy-trinh-quan-ly-ho-so"
import DashboardLayout from "@layouts/dashboard-layout"

function Page() {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-start bg-[#ebebeb] p-3 md:p-4">
      <div className="mb-2 flex shrink-0 flex-col items-center gap-2 sm:relative sm:flex-row sm:justify-center">
        <div className="inline-flex flex-wrap justify-center rounded-full border border-[#d9dee5] bg-white p-1 shadow-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0f8a4b] px-5 py-1 text-sm font-medium text-white shadow-sm">
            Quy trình nghiệp vụ quản lý hồ sơ
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-col">
        <QuyTrinhQuanLyHoSoDashboard />
      </div>
    </div>
  )
}

export default Page

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>
}
