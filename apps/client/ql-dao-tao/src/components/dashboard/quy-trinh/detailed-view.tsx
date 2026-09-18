import React from "react"
import { useRouter } from "next/router"
import { LeftOutlined } from "@ant-design/icons"
import { ROUTER_PATH } from "@workspace/router"
import {
  CalendarRange,
  FolderPlus,
  Users2,
  Megaphone,
  UserCog,
  CheckSquare,
  CalendarCheck,
  ArrowRight,
  CalendarClock,
  FileText,
  Barcode,
  Laptop,
  CalendarPlus,
  FileSpreadsheet,
  Gavel,
  Award,
  TrendingUp,
  LineChart,
  Table,
  PieChart,
  GraduationCap,
  ExternalLink,
  Presentation,
  FileBadge,
  Building2,
  Trophy,
  UserCheck,
  AlertTriangle,
  ShieldAlert,
  Coins,
  Clock,
  PencilLine,
  type LucideIcon,
} from "lucide-react"
import { Col, Row, Dropdown, Tooltip } from "antd"
import { Panel } from "./shared"
import type { QuyTrinhDetailView, QuyTrinhView } from "./types"
import { useThesisTrack, type ThesisTrack } from "./thesis-track"

interface StepItem {
  num: number
  title: string
  icon: LucideIcon
  path?: string
  tooltip?: string
  subSteps?: {
    title: string
    path?: string
  }[]
  action?: () => void
}

interface ReportItem {
  label: string
  icon: LucideIcon
  path?: string
  track?: Exclude<ThesisTrack, "both">
}

interface DetailedViewProps {
  view: QuyTrinhDetailView
  setView: (view: QuyTrinhView) => void
}

export function DetailedView({ view, setView }: DetailedViewProps) {
  const router = useRouter()
  const thesisTrack = useThesisTrack()

  const lenKeHoachSteps: StepItem[] = [
    {
      num: 1,
      title: "Lên kế hoạch giảng dạy",
      icon: CalendarRange,
      path: ROUTER_PATH.QL_DAO_TAO.KE_HOACH_GIAO_DUC,
    },
    { num: 2, title: "Mở lớp môn học", icon: FolderPlus },
    { num: 3, title: "Ghép lớp", icon: Users2 },
    { num: 4, title: "Báo dạy", icon: Megaphone },
    { num: 5, title: "Phân công\ngiảng dạy\n(Khoa/Viện/BM)", icon: UserCog },
    { num: 6, title: "Duyệt báo dạy", icon: CheckSquare },
    { num: 7, title: "Đưa LMH vào giảng dạy", icon: CalendarCheck },
  ]

  const toChucThiSteps: StepItem[] = [
    {
      num: 1,
      title: "Lên kế hoạch thi",
      icon: CalendarCheck,
      path: ROUTER_PATH.QL_DAO_TAO.TO_CHUC_THI_LAP_DANH_SANH_THI,
    },
    {
      num: 2,
      title: "Đặt hạn\nnhập điểm",
      icon: CalendarClock,
      subSteps: [{ title: "Đặt hạn nhập điểm TX/CC" }, { title: "Đặt hạn nhập điểm thi" }],
    },
    { num: 3, title: "Nhập điểm\nquá trình", icon: FileText },
    { num: 4, title: "Lên danh\nsách thi", icon: Users2 },
    { num: 5, title: "Đánh phách", icon: Barcode },
    {
      num: 6,
      title: "Nhập điểm thi",
      icon: Laptop,
      subSteps: [{ title: "Nhập điểm thi theo phách" }, { title: "Nhập điểm thi môn vấn đáp" }],
    },
  ]

  const xetTotNghiepSteps: StepItem[] = [
    {
      num: 1,
      title: "Khởi tạo\nđợt xét",
      icon: CalendarPlus,
      path: ROUTER_PATH.QL_DAO_TAO.XET_TOT_NGHIEP_QL_DOT_XET_TOT_NGHIEP,
    },
    { num: 2, title: "Tổng hợp\nđiều kiện", icon: FileSpreadsheet },
    { num: 3, title: "Kiểm tra chuẩn đầu ra", icon: CheckSquare },
    { num: 4, title: "Lập danh sách\nđủ điều kiện", icon: UserCog },
    { num: 5, title: "Thành lập\nhội đồng", icon: Users2 },
    { num: 6, title: "Xét tốt nghiệp", icon: Gavel },
    { num: 7, title: "Công nhận\ntốt nghiệp", icon: Award },
  ]

  // Khóa luận tốt nghiệp — neo theo lớp môn học
  const quanLyKhoaLuanSteps: StepItem[] = [
    {
      num: 1,
      title: "Chọn lớp &\nimport đề tài",
      icon: FolderPlus,
      path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_DM_DO_AN,
      tooltip: "Khóa luận tốt nghiệp",
    },
    {
      num: 2,
      title: "Phân công GVHD",
      icon: UserCog,
      tooltip: "Phân công giảng viên hướng dẫn",
    },
    {
      num: 3,
      title: "Thành lập\nhội đồng",
      icon: Users2,
      tooltip: "Thành lập hội đồng bảo vệ khóa luận tốt nghiệp",
    },
    {
      num: 4,
      title: "Tổ chức\nbảo vệ",
      icon: Presentation,
      tooltip: "Tổ chức bảo vệ khóa luận tốt nghiệp",
    },
    {
      num: 5,
      title: "Nhập điểm",
      icon: FileSpreadsheet,
      tooltip: "Nhập điểm bảo vệ khóa luận tốt nghiệp",
    },
  ]

  // Luận văn / luận án — neo theo đợt xét
  const quanLyLuanVanSteps: StepItem[] = [
    {
      num: 1,
      title: "Khởi tạo\nđợt bảo vệ",
      icon: CalendarPlus,
      path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_LUAN_VAN_QL_DOT_XET_LUAN_VAN,
      tooltip: "Đợt xét luận văn/luận án",
    },
    {
      num: 2,
      title: "Giao\nđề tài",
      icon: FolderPlus,
      tooltip: "Giao đề tài luận văn / luận án cho học viên",
    },
    {
      num: 3,
      title: "Phân công\nGVHD",
      icon: UserCog,
      tooltip: "Phân công giảng viên hướng dẫn",
    },
    {
      num: 4,
      title: "Thực hiện\nđề tài",
      icon: FileText,
      tooltip: "Học viên thực hiện đề tài luận văn / luận án",
    },
    {
      num: 5,
      title: "Thành lập\nhội đồng",
      icon: Users2,
      tooltip: "Thành lập hội đồng bảo vệ luận văn / luận án",
    },
    {
      num: 6,
      title: "Tổ chức\nbảo vệ",
      icon: Presentation,
      tooltip: "Tổ chức bảo vệ luận văn / luận án",
    },
    {
      num: 7,
      title: "Nhập điểm &\nnhận xét",
      icon: FileSpreadsheet,
      tooltip: "Nhập điểm và nhận xét kết quả bảo vệ",
    },
  ]

  // Nguồn nhập → sửa → tổng hợp rèn luyện → tổng kết → nghiệp vụ đầu ra
  const quanLyDiemSteps: StepItem[] = [
    {
      num: 1,
      title: "Điểm chứng chỉ",
      icon: FileBadge,
      path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_DIEM_CHUNG_CHI,
      tooltip: "Quản lý điểm chứng chỉ của học viên",
    },
    {
      num: 2,
      title: "Điểm chuyển trường,\nliên kết",
      icon: Building2,
      tooltip: "Điểm SV/HV chuyển trường và điểm liên kết",
    },
    {
      num: 3,
      title: "Điểm giải thưởng",
      icon: Trophy,
      path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_DIEM_OLYMPIC,
      tooltip: "Điểm giải thưởng, olympic và điểm cộng",
    },
    {
      num: 4,
      title: "Sửa điểm",
      icon: PencilLine,
      tooltip: "Điều chỉnh, chỉnh sửa điểm đã nhập",
    },
    {
      num: 5,
      title: "Điểm rèn luyện\nHK/NH",
      icon: UserCheck,
      tooltip: "Tổng hợp điểm rèn luyện theo học kỳ và năm học",
    },
    {
      num: 6,
      title: "Tổng kết\nHK/NH",
      icon: Clock,
      tooltip: "Tổng kết kết quả học tập theo học kỳ và năm học",
    },
  ]

  const quanLyDiemOutcomes = [
    {
      label: "Xét học bổng",
      icon: GraduationCap,
      color: "#1b7a4b",
      bg: "#f0fdf4",
      tooltip: "Xét học bổng dựa trên kết quả tổng kết học tập",
    },
    {
      label: "Cảnh báo học tập",
      icon: AlertTriangle,
      color: "#d97706",
      bg: "#fdf2e9",
      tooltip: "Cảnh báo học tập theo kết quả học tập",
    },
    {
      label: "Cảnh báo học đường",
      icon: ShieldAlert,
      color: "#b91c1c",
      bg: "#fef2f2",
      tooltip: "Cảnh báo học đường theo quy chế đào tạo",
    },
  ]

  const stepsMap: Record<Exclude<QuyTrinhDetailView, "quan-ly-khoa-luan">, StepItem[]> = {
    "len-ke-hoach": lenKeHoachSteps,
    "to-chuc-thi": toChucThiSteps,
    "xet-tot-nghiep": xetTotNghiepSteps,
    "quan-ly-diem": quanLyDiemSteps,
  }
  const steps = view === "quan-ly-khoa-luan" ? [] : stepsMap[view]

  const leftForkSteps = view === "quan-ly-diem" ? steps.slice(0, 3) : []
  const flowSteps = view === "quan-ly-diem" ? steps.slice(3) : steps

  const reportsMap: Record<QuyTrinhDetailView, ReportItem[]> = {
    "len-ke-hoach": [
      { label: "Lịch huấn luyện (thời khóa biểu, giảng viên, phòng học)", icon: CalendarRange },
      { label: "Danh sách lớp môn học đã triển khai", icon: Users2 },
      { label: "Phân công giảng dạy được phê duyệt", icon: UserCog },
      { label: "Kế hoạch giảng dạy được phê duyệt", icon: FileText },
    ],
    "to-chuc-thi": [
      { label: "Kết quả học phần", icon: LineChart },
      { label: "Bảng điểm học viên", icon: Table },
      { label: "Kết quả thi", icon: Award },
      { label: "Báo cáo kết quả thi", icon: PieChart },
      { label: "Dữ liệu phục vụ xét", icon: GraduationCap },
    ],
    "xet-tot-nghiep": [
      { label: "Danh sách đủ điều kiện tốt nghiệp", icon: Users2 },
      { label: "Quyết định công nhận tốt nghiệp", icon: FileText },
      { label: "Dữ liệu cấp bằng", icon: GraduationCap },
      { label: "Báo cáo kết quả tốt nghiệp", icon: TrendingUp },
    ],
    "quan-ly-khoa-luan": [
      {
        label: "Kết quả bảo vệ khóa luận tốt nghiệp",
        icon: LineChart,
        track: "kltn",
      },
      {
        label: "Kết quả bảo vệ luận văn / luận án",
        icon: Award,
        track: "luan-van",
      },
      { label: "Thống kê kết quả bảo vệ", icon: PieChart },
      {
        label: "Danh sách học viên hoàn thành khóa luận tốt nghiệp",
        icon: Users2,
        track: "kltn",
      },
      {
        label: "Danh sách học viên hoàn thành luận văn / luận án",
        icon: Users2,
        track: "luan-van",
      },
      {
        label: "Thanh toán hội đồng luận văn / luận án",
        icon: Coins,
        track: "luan-van",
      },
      {
        label: "Thanh toán GVHD luận văn / luận án",
        icon: Coins,
        track: "luan-van",
      },
      { label: "Dữ liệu xét tốt nghiệp", icon: GraduationCap },
    ],
    "quan-ly-diem": [
      { label: "Kết quả học tập theo học kỳ / năm học", icon: LineChart },
      { label: "Kết quả rèn luyện theo học kỳ / năm học", icon: Award },
      { label: "Danh sách học viên được xét học bổng", icon: Coins },
      { label: "Danh sách học viên bị cảnh báo học tập", icon: AlertTriangle },
      { label: "Danh sách học viên bị cảnh báo học đường", icon: ShieldAlert },
      { label: "Kết quả xử lý học tập", icon: FileText },
      { label: "Dữ liệu phục vụ xét tốt nghiệp", icon: GraduationCap },
    ],
  }
  const reports =
    view === "quan-ly-khoa-luan" && thesisTrack !== "both"
      ? reportsMap[view].filter((item) => !item.track || item.track === thesisTrack)
      : reportsMap[view]

  const khoaLuanTitle =
    thesisTrack === "kltn"
      ? "Quy trình quản lý khóa luận tốt nghiệp"
      : thesisTrack === "luan-van"
        ? "Quy trình quản lý luận văn / luận án"
        : "Quy trình quản lý khóa luận tốt nghiệp / Luận văn / Luận án"

  const subTitleMap: Record<QuyTrinhDetailView, string> = {
    "len-ke-hoach": "Nghiệp vụ lên kế hoạch và tổ chức giảng dạy",
    "to-chuc-thi": "Nghiệp vụ tổ chức thi",
    "xet-tot-nghiep": "Quy trình xét tốt nghiệp",
    "quan-ly-khoa-luan": khoaLuanTitle,
    "quan-ly-diem": "Quy trình quản lý điểm",
  }

  const handleStepClick = (step: { path?: string; action?: () => void }) => {
    if (step.action) {
      step.action()
    } else if (step.path) {
      router.push(step.path)
    }
  }

  const renderFlowSteps = (
    flowStepsToRender: StepItem[],
    flowKey: string,
    showTrailingArrow = false
  ) =>
    flowStepsToRender.map((step, idx) => {
      const IconComp = step.icon
      const isLast = idx === flowStepsToRender.length - 1
      const clickable = Boolean(step.path || step.action)

      const stepContent = (
        <div
          onClick={() => handleStepClick(step)}
          className={`group flex w-full min-w-0 flex-col items-center text-center transition ${
            clickable ? "cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="step-icon-container mb-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#dcfce7] bg-[#f0fdf4] text-[#0f8a4b] transition group-hover:scale-105 group-hover:border-[#0f8a4b] group-hover:bg-[#0f8a4b] group-hover:text-white max-xl:mb-1 max-xl:h-8 max-xl:w-8">
            <IconComp className="step-icon h-5 w-5 transition-transform max-xl:h-3.5 max-xl:w-3.5" />
          </div>
          <div className="step-num-badge mb-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0f8a4b] text-[10px] font-bold text-white shadow-sm max-xl:mb-0.5 max-xl:h-3.5 max-xl:w-3.5 max-xl:text-[7px]">
            {step.num}
          </div>
          <div className="step-label w-full px-0.5 text-[11px] font-bold uppercase leading-tight tracking-wide text-[#374151] transition whitespace-pre-line group-hover:text-[#0f8a4b] max-xl:text-[8px] max-xl:tracking-normal">
            {step.title}
          </div>
        </div>
      )

      const withTooltip = step.tooltip ? (
        <Tooltip title={step.tooltip} placement="top">
          {stepContent}
        </Tooltip>
      ) : (
        stepContent
      )

      return (
        <div key={`${flowKey}-${step.num}`} className="flex min-w-0 flex-1 items-start">
          <div className="min-w-0 flex-1">
            {step.subSteps ? (
              <Dropdown
                menu={{
                  items: step.subSteps.map((sub, sIdx) => ({
                    key: `${flowKey}-${idx}-${sIdx}`,
                    label: sub.title,
                    ...(sub.path
                      ? { onClick: () => router.push(sub.path!) }
                      : { style: { cursor: "default" } }),
                  })),
                }}
                trigger={["hover"]}
                placement="bottomCenter"
              >
                <div className="w-full min-w-0">{withTooltip}</div>
              </Dropdown>
            ) : (
              <div className="w-full min-w-0">{withTooltip}</div>
            )}
          </div>

          {(!isLast || showTrailingArrow) && (
            <div className="flex h-12 shrink-0 items-center justify-center px-0.5 max-xl:h-8">
              <ArrowRight className="h-3.5 w-3.5 text-[#cbd5e1]" />
            </div>
          )}
        </div>
      )
    })

  return (
    <Row gutter={[12, 12]} align="stretch" className="dashboard-row min-h-0">
      <Col xs={24} lg={18} className="flex min-w-0 flex-col">
        <Panel
          title={
            <button
              type="button"
              onClick={() => setView("main")}
              className="flex h-8 max-xl:h-7 items-center gap-2 border-0 bg-transparent p-0 text-left text-[12px] max-xl:text-[10px] font-bold uppercase leading-tight tracking-[0.04em] text-white/90 transition hover:text-white cursor-pointer"
            >
              <LeftOutlined className="text-[10px] font-bold text-white" />
              <span>{subTitleMap[view]}</span>
            </button>
          }
          headerClassName="border-[#166534] bg-[#1b7a4b] py-0.5"
          titleClassName="text-white"
          bodyClassName={`quy-trinh-panel-body relative flex min-h-0 flex-1 flex-col justify-center px-2 py-3 sm:px-4 ${
            view === "quan-ly-khoa-luan" && thesisTrack === "both" ? "gap-3" : ""
          }`}
        >
          {view === "quan-ly-khoa-luan" ? (
            <>
              {(thesisTrack === "kltn" || thesisTrack === "both") && (
                <div className="flex min-w-0 flex-col gap-1.5">
                  {thesisTrack === "both" && (
                    <div className="px-1 text-[11px] max-xl:text-[9px] font-bold uppercase tracking-[0.06em] text-[#0f8a4b]">
                      Khóa luận tốt nghiệp
                    </div>
                  )}
                  <div className="flex w-full min-w-0 items-start">
                    {renderFlowSteps(quanLyKhoaLuanSteps, "kltn")}
                  </div>
                </div>
              )}
              {thesisTrack === "both" && (
                <div className="mx-1 border-t border-dashed border-[#d1d5db]" />
              )}
              {(thesisTrack === "luan-van" || thesisTrack === "both") && (
                <div className="flex min-w-0 flex-col gap-1.5">
                  {thesisTrack === "both" && (
                    <div className="px-1 text-[11px] max-xl:text-[9px] font-bold uppercase tracking-[0.06em] text-[#0f8a4b]">
                      Luận văn / Luận án
                    </div>
                  )}
                  <div className="flex w-full min-w-0 items-start">
                    {renderFlowSteps(quanLyLuanVanSteps, "luan-van")}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              className={`flex w-full min-w-0 ${
                view === "quan-ly-diem" ? "items-center gap-1 max-xl:gap-0.5" : "items-start"
              }`}
            >
              {view === "quan-ly-diem" && (
                <div className="flex shrink-0 items-center gap-1">
                  <div className="flex flex-col justify-center gap-1.5">
                    {leftForkSteps.map((branch, bIdx) => {
                      const BranchIcon = branch.icon
                      const branchBox = (
                        <div
                          onClick={() => handleStepClick(branch)}
                          className={`group fork-card flex min-w-[108px] max-xl:min-w-[76px] flex-col items-center justify-center rounded-lg border border-[#e8eaed] bg-white p-1.5 max-xl:p-1 text-center shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
                            branch.path
                              ? "cursor-pointer hover:border-[#0f8a4b]/30 hover:shadow-md"
                              : "cursor-default"
                          }`}
                        >
                          <div className="fork-icon-container mb-1 flex h-8 w-8 max-xl:h-6 max-xl:w-6 items-center justify-center rounded-lg bg-[#f0fdf4] text-[#0f8a4b] transition group-hover:scale-105">
                            <BranchIcon className="fork-icon h-4 w-4 max-xl:h-3 max-xl:w-3" />
                          </div>
                          <span className="fork-label text-[10px] max-xl:text-[7.5px] font-bold uppercase leading-tight tracking-wide max-xl:tracking-normal text-[#374151] whitespace-pre-line">
                            {branch.title}
                          </span>
                        </div>
                      )

                      const withTooltip = branch.tooltip ? (
                        <Tooltip title={branch.tooltip} placement="left">
                          {branchBox}
                        </Tooltip>
                      ) : (
                        branchBox
                      )

                      return branch.subSteps ? (
                        <Dropdown
                          key={branch.num}
                          menu={{
                            items: branch.subSteps.map((sub, sIdx) => ({
                              key: `diem-left-${bIdx}-${sIdx}`,
                              label: sub.title,
                              ...(sub.path
                                ? { onClick: () => router.push(sub.path!) }
                                : { style: { cursor: "default" } }),
                            })),
                          }}
                          trigger={["hover"]}
                          placement="bottomLeft"
                        >
                          {withTooltip}
                        </Dropdown>
                      ) : (
                        <div key={branch.num}>{withTooltip}</div>
                      )
                    })}
                  </div>
                  <div className="fork-bracket relative flex h-[140px] max-xl:h-[96px] w-3 shrink-0 items-stretch self-center rounded-r border-y-2 border-r-2 border-[#9ca3af]" />
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 self-center text-[#9ca3af]" />
                </div>
              )}

              <div className="flex min-w-0 flex-1 items-start">
                {renderFlowSteps(flowSteps, view, view === "quan-ly-diem")}
              </div>

              {view === "quan-ly-diem" && (
                <div className="flex shrink-0 items-center gap-1">
                  <div className="fork-bracket relative flex h-[140px] max-xl:h-[96px] w-3 shrink-0 items-stretch self-center rounded-l border-y-2 border-l-2 border-[#9ca3af]" />
                  <div className="flex flex-col justify-center gap-1.5">
                    {quanLyDiemOutcomes.map((branch, bIdx) => {
                      const BranchIcon = branch.icon
                      return (
                        <Tooltip key={bIdx} title={branch.tooltip} placement="right">
                          <div className="group fork-card flex min-w-[108px] max-xl:min-w-[76px] cursor-default flex-col items-center justify-center rounded-lg border border-[#e8eaed] bg-white p-1.5 max-xl:p-1 text-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                            <div
                              className="fork-icon-container mb-1 flex h-8 w-8 max-xl:h-6 max-xl:w-6 items-center justify-center rounded-lg transition"
                              style={{ backgroundColor: branch.bg, color: branch.color }}
                            >
                              <BranchIcon className="fork-icon h-4 w-4 max-xl:h-3 max-xl:w-3" />
                            </div>
                            <span className="fork-label text-[10px] max-xl:text-[7.5px] font-bold uppercase leading-tight tracking-wide max-xl:tracking-normal text-[#374151]">
                              {branch.label}
                            </span>
                          </div>
                        </Tooltip>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </Panel>
      </Col>

      {/* REPORTS PANEL */}
      <Col xs={24} lg={6} className="flex min-w-0 flex-col">
        <Panel
          title={
            <div className="flex items-center gap-2 text-[#0f8a4b] font-bold text-[13px] uppercase tracking-[0.04em]">
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
            <div className="flex flex-col justify-center gap-1 min-h-full">
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
                        <ExternalLink className="h-4 w-4 text-[#9ca3af] opacity-50 group-hover:opacity-100 group-hover:text-[#0f8a4b] transition-all" />
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
