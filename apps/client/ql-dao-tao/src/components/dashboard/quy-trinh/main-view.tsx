import React from "react"
import { useRouter } from "next/router"
import {
  CalendarCheck,
  UserPlus,
  ClipboardList,
  Award,
  GraduationCap,
  FileText,
  Scroll,
  TrendingUp,
  ChevronRight,
  Gift,
  AlertCircle,
  BarChart2,
} from "lucide-react"
import { Col, Row } from "antd"
import { Panel } from "./shared"
import type { QuyTrinhView } from "./types"

interface MainViewProps {
  setView: (view: QuyTrinhView) => void
}

export function MainView({ setView }: MainViewProps) {
  const router = useRouter()

  const mainSteps = [
    {
      num: 1,
      title: "Lên kế hoạch & \nTổ chức giảng dạy",
      icon: CalendarCheck,
      action: () => setView("len-ke-hoach"),
    },
    {
      num: 2,
      title: "Đăng ký học",
      icon: UserPlus,
      path: "",
    },
    {
      num: 3,
      title: "Tổ chức thi",
      icon: ClipboardList,
      action: () => setView("to-chuc-thi"),
    },
    {
      num: 4,
      title: "Quản lý điểm",
      icon: Award,
      action: () => setView("quan-ly-diem"),
    },
    {
      num: 5,
      title: "Học bổng /\nCảnh báo",
      icon: GraduationCap,
      path: "",
    },
    {
      num: 6,
      title: "Quản lý khóa luận\n/ Luận văn / Luận án",
      icon: FileText,
      action: () => setView("quan-ly-khoa-luan"),
    },
    {
      num: 7,
      title: "Xét tốt nghiệp",
      icon: Award,
      action: () => setView("xet-tot-nghiep"),
    },
    {
      num: 8,
      title: "Quản lý văn bằng",
      icon: Scroll,
      path: "",
    },
  ]

  const handleStepClick = (step: { path?: string; action?: () => void }) => {
    if (step.action) {
      step.action()
    } else if (step.path) {
      router.push(step.path)
    }
  }

  const reports = [
    { label: "Danh sách học viên đủ điều kiện tốt nghiệp", icon: UserPlus },
    { label: "Văn bằng, chứng chỉ", icon: Scroll },
    { label: "Kết quả học tập toàn khóa", icon: BarChart2 },
    { label: "Danh sách học viên được học bổng / khen thưởng", icon: Gift },
    { label: "Danh sách học viên bị cảnh báo học tập", icon: AlertCircle },
    { label: "Báo cáo thống kê đào tạo", icon: TrendingUp },
  ] as { label: string; icon: any; path?: string }[]

  return (
    <Row gutter={[12, 12]} align="stretch" className="dashboard-row min-h-0">
      <Col xs={24} lg={18} className="flex flex-col">
        <Panel
          title={
            <div className="flex items-center gap-2 font-bold text-[13px]">
              <GraduationCap className="h-5 w-5 text-white" />
              <span>QUY TRÌNH NGHIỆP VỤ ĐÀO TẠO</span>
            </div>
          }
          headerClassName="border-[#166534] bg-[#1b7a4b]"
          titleClassName="text-white"
          bodyClassName="quy-trinh-panel-body px-6 py-4 relative flex flex-col justify-center flex-1 min-h-0"
        >
          <div className="step-container-gap relative flex flex-col gap-10 max-xl:gap-4">
            <div className="absolute top-1/2 left-[12.5%] right-[12.5%] h-[2px] -translate-y-1/2 bg-[#0f8a4b]" />
            <div className="absolute top-1/2 right-[12.5%] -translate-y-1/2 translate-x-2 border-t-[6px] border-b-[6px] border-l-[10px] border-t-transparent border-b-transparent border-l-[#0f8a4b]" />

            {[mainSteps.slice(0, 4), mainSteps.slice(4, 8)].map((row, rowIdx) => (
              <div key={rowIdx} className="z-10 grid grid-cols-4">
                {row.map((step) => {
                  const IconComp = step.icon
                  const clickable = Boolean(step.action || step.path)
                  return (
                    <div
                      key={step.num}
                      onClick={() => clickable && handleStepClick(step)}
                      className={`group flex min-w-0 w-full flex-col items-center text-center transition ${
                        clickable ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <div className="step-icon-container mb-3 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#dcfce7] bg-[#f0fdf4] text-[#0f8a4b] transition group-hover:scale-105 group-hover:border-[#0f8a4b] group-hover:bg-[#0f8a4b] group-hover:text-white max-xl:mb-1.5 max-xl:h-9 max-xl:w-9">
                        <IconComp className="step-icon h-7 w-7 transition-transform max-xl:h-4 max-xl:w-4" />
                      </div>
                      <div className="step-num-badge mb-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0f8a4b] text-[11px] font-bold text-white shadow-sm max-xl:mb-0.5 max-xl:h-4 max-xl:w-4 max-xl:text-[8px]">
                        {step.num}
                      </div>
                      <div className="step-label w-full max-w-full px-0.5 text-[13px] font-bold uppercase leading-relaxed tracking-wider text-[#374151] transition whitespace-pre-line group-hover:text-[#0f8a4b] max-xl:px-0.5 max-xl:text-[8.5px] max-xl:leading-tight max-xl:tracking-normal">
                        {step.title}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </Panel>
      </Col>

      <Col xs={24} lg={6} className="flex flex-col">
        <Panel
          title={
            <div className="flex items-center gap-2 text-[#0f8a4b] font-bold text-[13px]">
              <TrendingUp className="h-5 w-5" />
              <span>BÁO CÁO</span>
            </div>
          }
          action={
            <span className="bg-[#fdf2e9] text-[#d97706] rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider">
              ĐẦU RA
            </span>
          }
          bodyClassName="quy-trinh-report-body px-4 py-2 flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="flex flex-col gap-1.5">
              {reports.map((item, idx) => {
                const IconComp = item.icon
                return (
                  <React.Fragment key={idx}>
                    <div
                      onClick={() => item.path && router.push(item.path)}
                      className={`group report-item flex items-center gap-3 rounded-md px-2 py-3.5 transition hover:bg-[#fafafa] max-xl:gap-2 max-xl:px-1 max-xl:py-1.5 ${
                        item.path ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <div className="report-item-icon-container flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f7ef] text-[#0f8a4b] transition group-hover:scale-105 max-xl:h-6 max-xl:w-6">
                        <IconComp className="report-item-icon h-4 w-4 max-xl:h-3 max-xl:w-3" />
                      </div>
                      <span className="report-item-label flex-1 text-[13px] font-medium leading-snug text-[#4b5563] transition group-hover:text-[#0f8a4b] max-xl:text-[11px]">
                        {item.label}
                      </span>
                      {item.path && (
                        <ChevronRight className="h-4 w-4 text-[#9ca3af] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      )}
                    </div>
                    {idx < reports.length - 1 && (
                      <div className="h-[1px] bg-[#f3f4f6] mx-2 shrink-0" />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </Panel>
      </Col>
    </Row>
  )
}
