import React from "react"
import {
  GraduationCap,
  Database,
  FileText,
  Grid3x3,
  Shuffle,
  Pointer,
  Settings,
  FileCheck,
  Printer,
  Folder,
  BarChart2,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import { Col, Row } from "antd"
import { Panel } from "./shared"

export function MainView() {
  const stepsBefore = [
    {
      num: 1,
      title: "XÂY DỰNG\nNGÂN HÀNG CÂU HỎI",
      icon: Database,
    },
    {
      num: 2,
      title: "THIẾT LẬP\nKHUNG ĐỀ",
      icon: FileText,
    },
    {
      num: 3,
      title: "THIẾT LẬP\nMA TRẬN ĐỀ",
      icon: Grid3x3,
    },
    {
      num: 4,
      title: "SINH ĐỀ",
      icon: Shuffle,
    },
  ]

  const stepsAfter = [
    {
      num: 5,
      title: "SINH ĐÁP ÁN",
      icon: FileCheck,
    },
    {
      num: 6,
      title: "HOÀN THIỆN\nĐỀ THI & ĐÁP ÁN",
      icon: FileCheck,
    },
  ]

  const reports = [
    { label: "IN / XUẤT ĐỀ THI & ĐÁP ÁN", icon: Printer },
    { label: "LƯU TRỮ", icon: Folder },
    { label: "BÁO CÁO & THỐNG KÊ", icon: BarChart2 },
  ] as { label: string; icon: any }[]

  return (
    <Row gutter={[16, 16]} className="dashboard-row min-h-0">
      {/* LEFT PANEL: MAIN PROCESS DIAGRAM */}
      <Col xs={24} lg={18} className="h-full flex flex-col min-w-0">
        <Panel
          title={
            <div className="flex items-center gap-2 font-bold text-[13px]">
              <GraduationCap className="h-5 w-5 text-white" />
              <span>QUY TRÌNH NGHIỆP VỤ QUẢN LÝ ĐỀ THI</span>
            </div>
          }
          headerClassName="border-[#166534] bg-[#1b7a4b]"
          titleClassName="text-white"
          bodyClassName="px-3 py-3 relative flex flex-col justify-center flex-1 min-h-0 overflow-auto"
        >
          <div className="w-full h-full min-w-[680px] min-h-[220px] flex items-center justify-center relative pt-12 pb-3">
            {/* MAIN PROCESS WORKFLOW INLINE */}
            <div className="flex items-start justify-between w-full px-1 relative z-10">
              {/* STEPS 1 - 4 */}
              {stepsBefore.map((step) => {
                const IconComp = step.icon
                const isStep4 = step.num === 4
                return (
                  <React.Fragment key={step.num}>
                    <div className="group flex flex-col items-center text-center transition flex-1 min-w-0 px-0.5 relative cursor-default">
                      <div className="step-icon-container w-12 h-12 xl:w-14 xl:h-14 mb-1.5 flex items-center justify-center rounded-full bg-[#f0fdf4] text-[#0f8a4b] border border-[#dcfce7] transition group-hover:scale-105 group-hover:bg-[#0f8a4b] group-hover:text-white group-hover:border-[#0f8a4b]">
                        <IconComp className="step-icon w-5 h-5 xl:w-6 xl:h-6 transition-transform" />
                      </div>
                      <div className="step-num-badge w-5 h-5 mb-1 text-[10px] xl:text-[11px] flex items-center justify-center rounded-full bg-[#0f8a4b] font-bold text-white shadow-sm">
                        {step.num}
                      </div>
                      <div className="step-label text-[10px] xl:text-[11.5px] whitespace-pre-line font-bold uppercase tracking-wide text-[#374151] group-hover:text-[#0f8a4b] transition leading-tight px-0.5">
                        {step.title}
                      </div>
                    </div>

                    {!isStep4 && (
                      <div className="step-arrow-container flex h-12 xl:h-14 items-center justify-center shrink-0 px-0.5">
                        <ArrowRight className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-[#9ca3af]" />
                      </div>
                    )}
                  </React.Fragment>
                )
              })}

              {/* BRANCH BLOCK FOR 4.1 AND 4.2 */}
              <div className="flex items-start shrink-0 px-0.5 relative">
                {/* Left Split Connector from Step 4 (Dashed) */}
                <div className="flex h-12 xl:h-14 items-center justify-center shrink-0 relative">
                  <svg
                    width="22"
                    height="120"
                    viewBox="0 0 22 120"
                    fill="none"
                    className="shrink-0 absolute top-1/2 -translate-y-1/2 left-0"
                  >
                    <path
                      d="M 0 60 H 11 V 16 H 22 M 11 60 V 104 H 22"
                      stroke="#0f8a4b"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="w-[22px]" />
                </div>

                {/* Sub-cards 4.1 & 4.2 */}
                <div className="flex flex-col justify-between gap-8 py-1 shrink-0 -mt-[39px] xl:-mt-[35px]">
                  {/* CARD 4.1: SINH ĐỀ THỦ CÔNG */}
                  <div className="group bg-[#f0fdf4] hover:bg-[#0f8a4b] border border-[#dcfce7] hover:border-[#0f8a4b] rounded-lg px-3 py-1.5 flex items-center gap-2 transition cursor-default shadow-sm">
                    <div className="w-5 h-5 flex items-center justify-center rounded-full bg-[#0f8a4b] text-white group-hover:bg-white group-hover:text-[#0f8a4b] font-bold text-[9.5px] shadow-sm shrink-0 transition">
                      4.1
                    </div>
                    <Pointer className="w-3.5 h-3.5 text-[#0f8a4b] group-hover:text-white transition shrink-0" />
                    <span className="text-[10px] xl:text-[11px] font-bold uppercase tracking-wide text-[#374151] group-hover:text-white transition whitespace-nowrap">
                      SINH ĐỀ THỦ CÔNG
                    </span>
                  </div>

                  {/* CARD 4.2: SINH ĐỀ TỰ ĐỘNG */}
                  <div className="group bg-[#f0fdf4] hover:bg-[#0f8a4b] border border-[#dcfce7] hover:border-[#0f8a4b] rounded-lg px-3 py-1.5 flex items-center gap-2 transition cursor-default shadow-sm">
                    <div className="w-5 h-5 flex items-center justify-center rounded-full bg-[#0f8a4b] text-white group-hover:bg-white group-hover:text-[#0f8a4b] font-bold text-[9.5px] shadow-sm shrink-0 transition">
                      4.2
                    </div>
                    <Settings className="w-3.5 h-3.5 text-[#0f8a4b] group-hover:text-white transition shrink-0" />
                    <span className="text-[10px] xl:text-[11px] font-bold uppercase tracking-wide text-[#374151] group-hover:text-white transition whitespace-nowrap">
                      SINH ĐỀ TỰ ĐỘNG
                    </span>
                  </div>
                </div>

                {/* Right Merge & Arrow Connector to Step 5 (Dashed) */}
                <div className="flex h-12 xl:h-14 items-center justify-center shrink-0 relative">
                  <svg
                    width="32"
                    height="120"
                    viewBox="0 0 32 120"
                    fill="none"
                    className="shrink-0 absolute top-1/2 -translate-y-1/2 left-0"
                  >
                    <path
                      d="M 0 16 H 11 V 60 H 22 M 0 104 H 11 V 60"
                      stroke="#0f8a4b"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 19 55 L 27 60 L 19 65"
                      stroke="#0f8a4b"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="w-[32px]" />
                </div>
              </div>

              {/* STEPS 5 - 7 */}
              {stepsAfter.map((step, idx) => {
                const IconComp = step.icon
                const isLast = idx === stepsAfter.length - 1
                return (
                  <React.Fragment key={step.num}>
                    <div className="group flex flex-col items-center text-center transition flex-1 min-w-0 px-0.5 relative cursor-default">
                      <div className="step-icon-container w-12 h-12 xl:w-14 xl:h-14 mb-1.5 flex items-center justify-center rounded-full bg-[#f0fdf4] text-[#0f8a4b] border border-[#dcfce7] transition group-hover:scale-105 group-hover:bg-[#0f8a4b] group-hover:text-white group-hover:border-[#0f8a4b]">
                        <IconComp className="step-icon w-5 h-5 xl:w-6 xl:h-6 transition-transform" />
                      </div>
                      <div className="step-num-badge w-5 h-5 mb-1 text-[10px] xl:text-[11px] flex items-center justify-center rounded-full bg-[#0f8a4b] font-bold text-white shadow-sm">
                        {step.num}
                      </div>
                      <div className="step-label text-[10px] xl:text-[11.5px] whitespace-pre-line font-bold uppercase tracking-wide text-[#374151] group-hover:text-[#0f8a4b] transition leading-tight px-0.5">
                        {step.title}
                      </div>
                    </div>

                    {!isLast && (
                      <div className="step-arrow-container flex h-12 xl:h-14 items-center justify-center shrink-0 px-0.5">
                        <ArrowRight className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-[#9ca3af]" />
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </Panel>
      </Col>

      {/* RIGHT PANEL: ĐẦU RA */}
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
                        <IconComp className="report-item-icon w-4.5 h-4.5" />
                      </div>
                      <span className="report-item-label text-[11.5px] xl:text-[12.5px] flex-1 font-bold text-[#374151] group-hover:text-[#0f8a4b] transition leading-tight uppercase">
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
