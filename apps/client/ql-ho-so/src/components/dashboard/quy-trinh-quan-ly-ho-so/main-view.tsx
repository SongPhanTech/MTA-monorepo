import { ROUTER_PATH } from "@workspace/router"
import { Col, Row } from "antd"
import {
  ArrowRight,
  Award,
  BarChart2,
  BookUser,
  Briefcase,
  FileDown,
  FileText,
  GraduationCap,
  Library,
  type LucideIcon,
  ScrollText,
  TrendingUp,
  UserPlus,
  UserRound,
} from "lucide-react"
import { useRouter } from "next/router"
import { Fragment } from "react"
import { Panel } from "./shared"

type ProcessStep = {
  num: number
  title: string
  icon: LucideIcon
  path?: string
}

type OutputItem = {
  label: string
  icon: LucideIcon
  path?: string
}

const mainSteps: ProcessStep[] = [
  {
    num: 1,
    title: "THIẾT LẬP\nDANH MỤC",
    icon: Library,
    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO,
  },
  {
    num: 2,
    title: "TẠO MỚI\nHỒ SƠ",
    icon: UserPlus,
    path: ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_TAO_MOI,
  },
  {
    num: 3,
    title: "THÔNG TIN\nCÁ NHÂN",
    icon: UserRound,
    path: ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO,
  },
  {
    num: 4,
    title: "TRÌNH ĐỘ,\nHỌC HÀM HỌC VỊ",
    icon: GraduationCap,
    path: ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO,
  },
  {
    num: 5,
    title: "QUÁ TRÌNH\nCÔNG TÁC",
    icon: Briefcase,
    path: ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO,
  },
  {
    num: 6,
    title: "KHEN THƯỞNG\nKỶ LUẬT",
    icon: Award,
    path: ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO,
  },
  {
    num: 7,
    title: "KHAI THÁC\nHỒ SƠ",
    icon: BookUser,
    path: ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO,
  },
]

const reports: OutputItem[] = [
  {
    label: "SƠ YẾU LÝ LỊCH",
    icon: ScrollText,
    path: ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO,
  },
  {
    label: "DANH SÁCH CÁN BỘ / GIẢNG VIÊN",
    icon: FileText,
    path: ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO,
  },
  {
    label: "HỒ SƠ CỦA TÔI",
    icon: BookUser,
    path: ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_ME,
  },
  {
    label: "IN / XUẤT HỒ SƠ",
    icon: FileDown,
    path: ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO,
  },
  {
    label: "BÁO CÁO THỐNG KÊ",
    icon: BarChart2,
    path: ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO,
  },
]

export function MainView() {
  const router = useRouter()

  const goTo = (path?: string) => {
    if (path) router.push(path)
  }

  return (
    <Row gutter={[16, 16]} className="dashboard-row min-h-0">
      <Col xs={24} lg={18} className="flex h-full min-w-0 flex-col">
        <Panel
          title={
            <div className="flex items-center gap-2 text-[13px] font-bold">
              <BookUser className="h-5 w-5 text-white" />
              <span>QUY TRÌNH NGHIỆP VỤ QUẢN LÝ HỒ SƠ</span>
            </div>
          }
          headerClassName="border-[#166534] bg-[#1b7a4b]"
          titleClassName="text-white"
          bodyClassName="px-4 py-4 relative flex flex-col justify-center flex-1 min-h-0 overflow-x-auto"
        >
          <div className="my-auto flex min-w-max items-start justify-between gap-1 px-2 lg:gap-2">
            {mainSteps.map((step, idx) => {
              const IconComp = step.icon
              const isLast = idx === mainSteps.length - 1
              return (
                <Fragment key={step.num}>
                  <button
                    type="button"
                    onClick={() => goTo(step.path)}
                    className="group flex min-w-[100px] flex-1 cursor-pointer flex-col items-center bg-transparent text-center transition"
                  >
                    <div className="step-icon-container mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-[#dcfce7] bg-[#f0fdf4] text-[#0f8a4b] transition group-hover:scale-105 group-hover:border-[#0f8a4b] group-hover:bg-[#0f8a4b] group-hover:text-white lg:h-16 lg:w-16">
                      <IconComp className="step-icon h-6 w-6 transition-transform lg:h-7 lg:w-7" />
                    </div>
                    <div className="step-num-badge mb-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#0f8a4b] text-[11px] font-bold text-white shadow-sm">
                      {step.num}
                    </div>
                    <div className="step-label px-1 text-[12px] font-bold uppercase leading-snug tracking-wider text-[#374151] transition group-hover:text-[#0f8a4b] whitespace-pre-line lg:text-[13px]">
                      {step.title}
                    </div>
                  </button>

                  {!isLast && (
                    <div className="step-arrow-container flex h-14 shrink-0 items-center justify-center lg:h-16">
                      <ArrowRight className="h-4 w-4 text-[#9ca3af] lg:h-5 lg:w-5" />
                    </div>
                  )}
                </Fragment>
              )
            })}
          </div>
        </Panel>
      </Col>

      <Col xs={24} lg={6} className="flex h-full flex-col">
        <Panel
          title={
            <div className="flex items-center gap-2 text-[13px] font-bold text-[#0f8a4b]">
              <TrendingUp className="h-5 w-5" />
              <span>ĐẦU RA</span>
            </div>
          }
          action={
            <span className="rounded border border-[#fde68a] bg-[#fef3c7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d97706]">
              ĐẦU RA
            </span>
          }
          bodyClassName="px-4 py-2 flex flex-col flex-1 min-h-0"
        >
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="flex h-full flex-col justify-between py-1">
              {reports.map((item, idx) => {
                const IconComp = item.icon
                return (
                  <Fragment key={item.label}>
                    <button
                      type="button"
                      onClick={() => goTo(item.path)}
                      className="report-item group flex flex-1 cursor-pointer items-center gap-3 rounded-md bg-transparent px-2 py-2 text-left transition hover:bg-[#fafafa]"
                    >
                      <div className="report-item-icon-container flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f7ef] text-[#0f8a4b] transition group-hover:scale-105">
                        <IconComp className="report-item-icon h-4 w-4" />
                      </div>
                      <span className="report-item-label flex-1 text-[13px] font-bold uppercase leading-snug text-[#374151] transition group-hover:text-[#0f8a4b]">
                        {item.label}
                      </span>
                    </button>
                    {idx < reports.length - 1 && (
                      <div className="mx-2 my-1 h-px shrink-0 bg-[#f3f4f6]" />
                    )}
                  </Fragment>
                )
              })}
            </div>
          </div>
        </Panel>
      </Col>
    </Row>
  )
}
