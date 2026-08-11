import React from "react"
import { useRouter } from "next/router"
import { LeftOutlined } from "@ant-design/icons"
import { ROUTER_PATH } from "@workspace/router"
import {
  FileText,
  Grid3x3,
  Eye,
  FileCheck,
  ArrowRight,
  TrendingUp,
  Printer,
  BarChart2,
  FolderPlus,
  Settings,
  CheckSquare,
  ChevronRight,
  Pointer,
  type LucideIcon,
} from "lucide-react"
import { Col, Row, Tooltip } from "antd"
import { Panel } from "./shared"
import { QuyTrinhDeThiDetailView, QuyTrinhDeThiView } from "./type";

interface StepItem {
  num: number
  title: string
  icon: LucideIcon
  path?: string
  tooltip?: string
  action?: () => void
}

interface ReportItem {
  label: string
  icon: LucideIcon
  path?: string
}

interface DetailedViewProps {
  view: QuyTrinhDeThiDetailView
  setView: (view: QuyTrinhDeThiView) => void
}

export function DetailedView({ view, setView }: DetailedViewProps) {
  const router = useRouter()

  const subTitleMap: Record<QuyTrinhDeThiDetailView, string> = {
    "xay-dung": "Quy trình 1: Xây dựng ngân hàng câu hỏi",
    "thiet-lap-khung": "Quy trình 2: Thiết lập khung đề",
    "thiet-lap-ma-tran": "Quy trình 3: Thiết lập ma trận đề",
    "sinh-de": "Quy trình 4: Sinh đề thi",
    "xem-truoc": "Quy trình 5: Xem trước & Chỉnh sửa",
    "sinh-dap-an": "Quy trình 6: Sinh đáp án",
    "hoan-thien": "Quy trình 7: Hoàn thiện đề thi & Đáp án",
  }

  const stepsMap: Record<QuyTrinhDeThiDetailView, StepItem[]> = {
    "xay-dung": [
      {
        num: 1,
        title: "Tạo cây thư mục câu hỏi",
        icon: FolderPlus,
        path: ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI,
      },
      {
        num: 2,
        title: "Soạn thảo / Import câu hỏi",
        icon: FileText,
        path: ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI,
      },
      { num: 3, title: "Phê duyệt ngân hàng câu hỏi", icon: CheckSquare },
    ],
    "thiet-lap-khung": [
      {
        num: 1,
        title: "Khởi tạo khung đề thi",
        icon: FileText,
        path: ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_KHUNG_DE,
      },
      { num: 2, title: "Cấu hình số lượng câu hỏi", icon: Settings },
      { num: 3, title: "Phê duyệt khung đề", icon: CheckSquare },
    ],
    "thiet-lap-ma-tran": [
      { num: 1, title: "Xác định tỷ lệ độ khó", icon: BarChart2 },
      { num: 2, title: "Gán chuẩn đầu ra (CLO)", icon: CheckSquare },
      { num: 3, title: "Cấu hình phân bổ điểm", icon: Settings },
    ],
    "sinh-de": [
      { num: 1, title: "Sinh đề thủ công", icon: Pointer },
      { num: 2, title: "Sinh đề tự động", icon: Settings },
      { num: 3, title: "Kiểm tra trùng lặp", icon: CheckSquare },
    ],
    "xem-truoc": [
      { num: 1, title: "Xem trước bản in đề thi", icon: Eye },
      { num: 2, title: "Rà soát & chỉnh sửa câu hỏi", icon: FileText },
      { num: 3, title: "Đánh giá chất lượng đề thi", icon: CheckSquare },
    ],
    "sinh-dap-an": [
      { num: 1, title: "Tạo ma trận đáp án", icon: Grid3x3 },
      { num: 2, title: "Sinh mã đề & phiếu chấm", icon: FileText },
      { num: 3, title: "Phê duyệt bộ đáp án", icon: CheckSquare },
    ],
    "hoan-thien": [
      {
        num: 1,
        title: "Đóng gói bộ đề thi",
        icon: FolderPlus,
        path: ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_DANH_SACH_DE,
      },
      { num: 2, title: "Mã hóa & bảo mật", icon: Settings },
      { num: 3, title: "Nghiệm thu đợt sinh đề", icon: CheckSquare },
    ],
  }

  const reportsMap: Record<QuyTrinhDeThiDetailView, ReportItem[]> = {
    "xay-dung": [
      { label: "Danh sách ngân hàng câu hỏi", icon: FileText },
      { label: "Báo cáo duyệt câu hỏi", icon: CheckSquare },
    ],
    "thiet-lap-khung": [
      { label: "Danh sách khung đề thi", icon: FileText },
      { label: "Cấu trúc ma trận khung", icon: Grid3x3 },
    ],
    "thiet-lap-ma-tran": [
      { label: "Bản vẽ ma trận đề", icon: Grid3x3 },
      { label: "Báo cáo phân bổ chuẩn CLO", icon: BarChart2 },
    ],
    "sinh-de": [
      { label: "Danh sách đề thi vừa sinh", icon: FileText },
      { label: "Báo cáo trùng lặp đề", icon: BarChart2 },
    ],
    "xem-truoc": [
      { label: "Bản in đề thi (PDF)", icon: FileText },
      { label: "Nhật ký chỉnh sửa đề", icon: FileText },
    ],
    "sinh-dap-an": [
      { label: "Bộ đáp án & thang điểm", icon: FileCheck },
      { label: "Phiếu chấm tự động", icon: CheckSquare },
    ],
    "hoan-thien": [
      { label: "In / Xuất đề thi & đáp án", icon: Printer },
      { label: "Báo cáo & thống kê đợt sinh đề", icon: BarChart2 },
    ],
  }

  const steps = stepsMap[view] ?? []
  const reports = reportsMap[view] ?? []

  const handleStepClick = (step: { path?: string; action?: () => void }) => {
    if (step.action) {
      step.action()
    } else if (step.path) {
      router.push(step.path)
    }
  }

  return (
    <Row gutter={[16, 16]} className="dashboard-row min-h-0">
      <Col xs={24} lg={18} className="h-full flex flex-col">
        <Panel
          title={
            <button
              type="button"
              onClick={() => setView("main")}
              className="flex h-9 items-center gap-2 text-white/90 hover:text-white transition bg-transparent border-0 p-0 cursor-pointer font-bold uppercase tracking-[0.04em] text-[13px] text-left"
            >
              <LeftOutlined className="text-[10px] font-bold py-3 text-white" />
              <span>{subTitleMap[view]}</span>
            </button>
          }
          headerClassName="border-[#166534] bg-[#1b7a4b]"
          titleClassName="text-white"
          bodyClassName="px-6 py-6 relative overflow-x-auto flex-1 min-h-0 flex flex-col justify-center"
        >
          <div className="flex justify-center items-start gap-6 min-w-max px-4">
            {steps.map((step, idx) => {
              const IconComp = step.icon
              const isLast = idx === steps.length - 1
              const clickable = Boolean(step.path || step.action)

              const stepContent = (
                <div
                  onClick={() => handleStepClick(step)}
                  className={`group relative flex flex-col items-center text-center transition ${
                    clickable ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className="step-icon-container w-16 h-16 mb-3 flex shrink-0 items-center justify-center rounded-full bg-[#f0fdf4] text-[#0f8a4b] border border-[#dcfce7] transition group-hover:scale-110 group-hover:bg-[#0f8a4b] group-hover:text-white group-hover:border-[#0f8a4b]">
                    <IconComp className="step-icon w-7 h-7 transition-transform" />
                  </div>
                  <div className="step-num-badge w-6 h-6 mb-1.5 text-[11px] flex shrink-0 items-center justify-center rounded-full bg-[#0f8a4b] font-bold text-white shadow-sm">
                    {step.num}
                  </div>
                  <div className="step-label text-[13px] whitespace-pre-line font-bold uppercase tracking-wider text-[#374151] group-hover:text-[#0f8a4b] transition leading-normal max-w-[140px]">
                    {step.title}
                  </div>
                </div>
              )

              return (
                <React.Fragment key={step.num}>
                  {step.tooltip ? (
                    <Tooltip title={step.tooltip} placement="top">
                      {stepContent}
                    </Tooltip>
                  ) : (
                    stepContent
                  )}
                  {!isLast && (
                    <div className="step-arrow-container flex h-16 w-4 shrink-0 items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-[#9ca3af]" />
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
            <div className="flex items-center gap-2 text-[#0f8a4b] font-bold text-[13px] uppercase tracking-[0.04em]">
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
                    <div
                      onClick={() => item.path && router.push(item.path)}
                      className={`group report-item flex-1 flex items-center gap-3 hover:bg-[#fafafa] px-2 py-2 rounded-md transition ${
                        item.path ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <div className="report-item-icon-container w-9 h-9 flex shrink-0 items-center justify-center rounded-lg bg-[#e8f7ef] text-[#0f8a4b] transition group-hover:scale-105">
                        <IconComp className="report-item-icon w-4 h-4" />
                      </div>
                      <span className="report-item-label text-[13px] flex-1 font-bold text-[#374151] group-hover:text-[#0f8a4b] transition leading-snug uppercase">
                        {item.label}
                      </span>
                      {item.path && (
                        <ChevronRight className="h-4 w-4 text-[#9ca3af] opacity-50 group-hover:opacity-100 group-hover:text-[#0f8a4b] transition-all" />
                      )}
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
