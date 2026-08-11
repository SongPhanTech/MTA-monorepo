import React from "react"
import { useRouter } from "next/router"
import { LeftOutlined } from "@ant-design/icons"
import { ROUTER_PATH } from "@workspace/router"
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
  CheckSquare,
  Users,
  Settings,
  HelpCircle,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"
import { Col, Row, Tooltip } from "antd"
import { Panel } from "./shared"
import type { QuyTrinhDetailView, QuyTrinhView } from "./types"

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
  view: QuyTrinhDetailView
  setView: (view: QuyTrinhView) => void
}

export function DetailedView({ view, setView }: DetailedViewProps) {
  const router = useRouter()

  const subTitleMap: Record<QuyTrinhDetailView, string> = {
    "chuan-bi": "Quy trình 1: Chuẩn bị khảo sát",
    "tao-dot": "Quy trình 2: Tạo đợt khảo sát",
    "trien-khai": "Quy trình 3: Triển khai khảo sát",
    "thuc-hien": "Quy trình 4: Thực hiện khảo sát",
    "tong-hop": "Quy trình 5: Tổng hợp kết quả",
    "phan-tich": "Quy trình 6: Phân tích & Báo cáo",
    "ket-thuc": "Quy trình 7: Kết thúc khảo sát",
  }

  const stepsMap: Record<QuyTrinhDetailView, StepItem[]> = {
    "chuan-bi": [
      {
        num: 1,
        title: "Tạo chủ đề khảo sát",
        icon: HelpCircle,
        path: ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_CAU_HOI_KHAO_SAT,
      },
      {
        num: 2,
        title: "Xây dựng bộ câu hỏi",
        icon: FileText,
        path: ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_CAU_HOI_KHAO_SAT,
      },
      { num: 3, title: "Xác định đối tượng", icon: Users },
      {
        num: 4,
        title: "Cấu hình chung",
        icon: Settings,
        path: ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
      },
    ],
    "tao-dot": [
      {
        num: 1,
        title: "Khởi tạo đợt khảo sát",
        icon: FolderPlus,
        path: ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
      },
      { num: 2, title: "Gán bộ câu hỏi & đợt", icon: ClipboardCheck },
      { num: 3, title: "Chọn đối tượng học viên", icon: Users },
      { num: 4, title: "Phê duyệt đợt", icon: CheckSquare },
    ],
    "trien-khai": [
      {
        num: 1,
        title: "Tạo cuộc khảo sát",
        icon: Megaphone,
        path: ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_DANH_SACH_KHAO_SAT,
      },
      { num: 2, title: "Gửi thông báo làm khảo sát", icon: Users },
      { num: 3, title: "Theo dõi tiến độ", icon: BarChart2 },
    ],
    "thuc-hien": [
      { num: 1, title: "Học viên nhận phiếu", icon: User },
      { num: 2, title: "Trả lời câu hỏi khảo sát", icon: FileText },
      { num: 3, title: "Nộp bài khảo sát", icon: CheckSquare },
    ],
    "tong-hop": [
      { num: 1, title: "Thu thập dữ liệu", icon: BarChart2 },
      { num: 2, title: "Tổng hợp câu trả lời", icon: PieChart },
      { num: 3, title: "Xuất dữ liệu thô", icon: FileDown },
    ],
    "phan-tich": [
      {
        num: 1,
        title: "Báo cáo khảo sát giảng viên",
        icon: PieChart,
        path: ROUTER_PATH.KHAO_THI.BAO_CAO_KHAO_SAT_GIANG_VIEN,
      },
      { num: 2, title: "Phân tích số liệu", icon: TrendingUp },
      { num: 3, title: "Xuất báo cáo PDF/Excel", icon: FileDown },
    ],
    "ket-thuc": [
      { num: 1, title: "Khóa đợt khảo sát", icon: CalendarCheck },
      { num: 2, title: "Lưu trữ hồ sơ", icon: FileText },
      { num: 3, title: "Đánh giá & nghiệm thu", icon: CheckSquare },
    ],
  }

  const reportsMap: Record<QuyTrinhDetailView, ReportItem[]> = {
    "chuan-bi": [
      { label: "Danh sách bộ câu hỏi", icon: FileText },
      { label: "Báo cáo đối tượng khảo sát", icon: Users },
    ],
    "tao-dot": [
      { label: "Báo cáo đợt khảo sát", icon: FolderPlus },
      { label: "Danh sách đối tượng tham gia", icon: Users },
    ],
    "trien-khai": [
      { label: "Báo cáo tiến độ khảo sát", icon: BarChart2 },
      { label: "Danh sách đã/chưa khảo sát", icon: Users },
    ],
    "thuc-hien": [
      { label: "Báo cáo tỷ lệ hoàn thành", icon: CheckSquare },
      { label: "Thống kê người làm khảo sát", icon: User },
    ],
    "tong-hop": [
      { label: "Dữ liệu tổng hợp kết quả", icon: BarChart2 },
      { label: "Thống kê câu trả lời chi tiết", icon: PieChart },
    ],
    "phan-tich": [
      {
        label: "Báo cáo khảo sát giảng viên",
        icon: PieChart,
        path: ROUTER_PATH.KHAO_THI.BAO_CAO_KHAO_SAT_GIANG_VIEN,
      },
      { label: "Báo cáo đánh giá chất lượng", icon: TrendingUp },
      { label: "Xuất báo cáo Word/Excel/PDF", icon: FileDown },
    ],
    "ket-thuc": [
      { label: "Báo cáo tổng kết đợt khảo sát", icon: CalendarCheck },
      { label: "Hồ sơ lưu trữ khảo sát", icon: FileText },
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
