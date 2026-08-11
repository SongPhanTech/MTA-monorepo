import QuyTrinhKhaoSatDashboard from "@components/dashboard/quy-trinh-khao-sat";
import QuyTrinhDeThiDashboard from "@components/dashboard/quy-trinh-quan-ly-de-thi";
import DashboardLayout from "@layouts/dashboard-layout"
import { useState } from "react";
function Page() {
  const [activeTab, setActiveTab] = useState<"de-thi" | "khao-sat">("de-thi")

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col justify-start bg-[#ebebeb] p-3 md:p-4">
      {/* TOP PILLS TAB */}
      <div className="mb-2 flex flex-col items-center gap-2 sm:relative sm:flex-row sm:justify-center shrink-0">
        <div className="inline-flex rounded-full border border-[#d9dee5] bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("de-thi")}
            className={`inline-flex items-center gap-1.5 rounded-full px-5 py-1 text-sm font-medium transition-all ${
              activeTab === "de-thi"
                ? "bg-[#0f8a4b] text-white shadow-sm"
                : "text-[#475467] hover:text-[#101828]"
            }`}
          >
            Quy trình quản lý đề thi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("khao-sat")}
            className={`inline-flex items-center gap-1.5 rounded-full px-5 py-1 text-sm font-medium transition-all ${
              activeTab === "khao-sat"
                ? "bg-[#0f8a4b] text-white shadow-sm"
                : "text-[#475467] hover:text-[#101828]"
            }`}
          >
            Quy trình nghiệp vụ khảo sát
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-col">
        {activeTab === "de-thi" ? <QuyTrinhDeThiDashboard /> : <QuyTrinhKhaoSatDashboard />}
      </div>
    </div>
  )
}

export default Page

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>
}
