import React from "react"
import {
  ClipboardCheck,
  FolderPlus,
  Megaphone,
  User,
  BarChart2,
  PieChart,
  CalendarCheck,
  ArrowRight,
  TrendingUp,
  FileText,
  FileDown,
} from "lucide-react"
import { Col, Row } from "antd"
import { Panel } from "./shared"

export function MainView() {
  const mainSteps = [
    {
      num: 1,
      title: "CHUẨN BỊ\nKHẢO SÁT",
      icon: ClipboardCheck,
    },
    {
      num: 2,
      title: "TẠO ĐỢT\nKHẢO SÁT",
      icon: FolderPlus,
    },
    {
      num: 3,
      title: "TRIỂN KHAI\nKHẢO SÁT",
      icon: Megaphone,
    },
    {
      num: 4,
      title: "THỰC HIỆN\nKHẢO SÁT",
      icon: User,
    },
    {
      num: 5,
      title: "TỔNG HỢP\nKẾT QUẢ",
      icon: BarChart2,
    },
    {
      num: 6,
      title: "PHÂN TÍCH &\nBÁO CÁO",
      icon: PieChart,
    },
    {
      num: 7,
      title: "KẾT THÚC\nKHẢO SÁT",
      icon: CalendarCheck,
    },
  ]

  const reports = [
    { label: "KẾT QUẢ KHẢO SÁT", icon: FileText },
    { label: "BÁO CÁO THỐNG KÊ", icon: BarChart2 },
    { label: "BÁO CÁO PHÂN TÍCH", icon: TrendingUp },
    { label: "XUẤT BÁO CÁO FILE WORD / EXCEL / PDF", icon: FileDown },
  ]

  return (
    <Row gutter={[16, 16]} className="dashboard-row min-h-0">
      <Col xs={24} lg={18} className="h-full flex flex-col min-w-0">
        <Panel
          title={
            <div className="flex items-center gap-2 font-bold text-[13px]">
              <ClipboardCheck className="h-5 w-5 text-white" />
              <span>QUY TRÌNH NGHIỆP VỤ KHẢO SÁT</span>
            </div>
          }
          headerClassName="border-[#166534] bg-[#1b7a4b]"
          titleClassName="text-white"
          bodyClassName="px-4 py-4 relative flex flex-col justify-center flex-1 min-h-0 overflow-x-auto"
        >
          <div className="flex items-start justify-between gap-1 lg:gap-2 px-2 min-w-max my-auto">
            {mainSteps.map((step, idx) => {
              const IconComp = step.icon
              const isLast = idx === mainSteps.length - 1
              return (
                <React.Fragment key={step.num}>
                  <div className="group flex cursor-default flex-col items-center text-center transition flex-1 min-w-[100px]">
                    <div className="step-icon-container w-14 h-14 lg:w-16 lg:h-16 mb-2 flex items-center justify-center rounded-full bg-[#f0fdf4] text-[#0f8a4b] border border-[#dcfce7] transition group-hover:scale-105 group-hover:bg-[#0f8a4b] group-hover:text-white group-hover:border-[#0f8a4b]">
                      <IconComp className="step-icon w-6 h-6 lg:w-7 lg:h-7 transition-transform" />
                    </div>
                    <div className="step-num-badge w-6 h-6 mb-1.5 text-[11px] flex items-center justify-center rounded-full bg-[#0f8a4b] font-bold text-white shadow-sm">
                      {step.num}
                    </div>
                    <div className="step-label text-[12px] lg:text-[13px] whitespace-pre-line font-bold uppercase tracking-wider text-[#374151] group-hover:text-[#0f8a4b] transition leading-snug px-1">
                      {step.title}
                    </div>
                  </div>

                  {!isLast && (
                    <div className="step-arrow-container flex h-14 lg:h-16 items-center justify-center shrink-0">
                      <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 text-[#9ca3af]" />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </Panel>
      </Col>

      <Col xs={24} lg={6} className="h-full flex flex-col">
        <Panel
          title={
            <div className="flex items-center gap-2 text-[#0f8a4b] font-bold text-[13px]">
              <TrendingUp className="h-5 w-5" />
              <span>ĐẦU RA</span>
            </div>
          }
          action={
            <span className="text-[10px] font-bold text-[#d97706] bg-[#fef3c7] px-2 py-0.5 rounded uppercase tracking-wider border border-[#fde68a]">
              ĐẦU RA
            </span>
          }
          bodyClassName="px-4 py-2 flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="flex flex-col justify-between h-full py-1">
              {reports.map((item, idx) => {
                const IconComp = item.icon
                return (
                  <React.Fragment key={idx}>
                    <div className="group report-item flex-1 flex items-center gap-3 hover:bg-[#fafafa] px-2 py-2 rounded-md transition cursor-default">
                      <div className="report-item-icon-container w-9 h-9 flex shrink-0 items-center justify-center rounded-lg bg-[#e8f7ef] text-[#0f8a4b] transition group-hover:scale-105">
                        <IconComp className="report-item-icon w-4 h-4" />
                      </div>
                      <span className="report-item-label text-[13px] flex-1 font-bold text-[#374151] group-hover:text-[#0f8a4b] transition leading-snug uppercase">
                        {item.label}
                      </span>
                    </div>
                    {idx < reports.length - 1 && (
                      <div className="h-[1px] bg-[#f3f4f6] mx-2 shrink-0 my-1" />
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
