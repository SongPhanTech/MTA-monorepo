import { Modal, Tag } from "antd"
import {
  ArrowRight,
  Cloud,
  Globe,
  Laptop,
  Lock,
  Server,
  Users,
} from "lucide-react"
import type { ReactNode } from "react"

type SyncProcessModalProps = {
  open: boolean
  onClose: () => void
}

type EnvBadgeProps = {
  variant: "internal" | "internet"
  children: ReactNode
}

function EnvBadge({ variant, children }: EnvBadgeProps) {
  const isInternal = variant === "internal"
  return (
    <Tag
      className={`m-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        isInternal
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {children}
    </Tag>
  )
}

function FlowNode({
  icon,
  label,
  badge,
  tone,
}: {
  icon: ReactNode
  label: string
  badge: ReactNode
  tone: "blue" | "green" | "slate"
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50/80 text-blue-700 group-hover:border-blue-300 group-hover:bg-blue-100/80"
      : tone === "green"
        ? "border-emerald-200 bg-emerald-50/80 text-emerald-700 group-hover:border-emerald-300 group-hover:bg-emerald-100/80"
        : "border-slate-200 bg-slate-50 text-slate-700 group-hover:border-slate-300 group-hover:bg-slate-100"

  return (
    <div className="group flex flex-col items-center gap-2">
      <div
        className={`flex size-16 items-center justify-center rounded-2xl border shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md ${toneClass}`}
      >
        {icon}
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        <div className="mt-1 flex justify-center">{badge}</div>
      </div>
    </div>
  )
}

function FlowArrow({ encrypted }: { encrypted?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-2">
      <div className="relative flex items-center text-slate-400">
        <div className="hidden h-px w-8 bg-gradient-to-r from-slate-200 to-slate-400 sm:block" />
        <ArrowRight className="size-6 shrink-0" strokeWidth={2} />
        {encrypted ? (
          <span className="absolute -top-6 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 shadow-sm">
            <Lock className="size-3" />
            .dat
          </span>
        ) : null}
      </div>
    </div>
  )
}

const STEPS = [
  {
    step: 1,
    title: "Nội bộ → Internet",
    subtitle: "Khởi tạo dữ liệu",
    description:
      "Xuất file từ phần mềm QL Đào tạo và nhập vào Cổng Internet. Quá trình này giúp khởi tạo Đợt đăng ký, Lớp học phần và Danh sách học viên trên môi trường mạng ngoài.",
    badges: (
      <>
        <EnvBadge variant="internal">Nội bộ</EnvBadge>
        <ArrowRight className="size-3.5 text-slate-400" />
        <EnvBadge variant="internet">Internet</EnvBadge>
      </>
    ),
    diagram: (
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <FlowNode
          icon={<Server className="size-7" />}
          label="QL Đào tạo"
          badge={<EnvBadge variant="internal">Nội bộ</EnvBadge>}
          tone="blue"
        />
        <FlowArrow />
        <FlowNode
          icon={<Cloud className="size-7" />}
          label="Cổng đăng ký"
          badge={<EnvBadge variant="internet">Internet</EnvBadge>}
          tone="green"
        />
      </div>
    ),
  },
  {
    step: 2,
    title: "Học viên đăng ký",
    subtitle: "Trên Internet",
    description:
      "Học viên truy cập vào Cổng đăng ký học trên Internet để tiến hành chọn môn và đăng ký lớp.",
    badges: <EnvBadge variant="internet">Internet</EnvBadge>,
    diagram: (
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <FlowNode
          icon={<Users className="size-7" />}
          label="Học viên"
          badge={<EnvBadge variant="internet">Người dùng</EnvBadge>}
          tone="green"
        />
        <FlowArrow />
        <FlowNode
          icon={
            <span className="relative">
              <Laptop className="size-7" />
              <Globe className="absolute -right-1.5 -top-1.5 size-3.5 text-emerald-600" />
            </span>
          }
          label="Cổng đăng ký"
          badge={<EnvBadge variant="internet">Internet</EnvBadge>}
          tone="green"
        />
      </div>
    ),
  },
  {
    step: 3,
    title: "Internet → Nội bộ",
    subtitle: "Đồng bộ kết quả",
    description:
      "Xuất kết quả đăng ký từ Cổng Internet dưới định dạng file nén, mã hóa bảo mật (.dat). Sau đó nhập ngược file này vào phần mềm QL Đào tạo nội bộ để chốt dữ liệu.",
    badges: (
      <>
        <EnvBadge variant="internet">Internet</EnvBadge>
        <ArrowRight className="size-3.5 text-slate-400" />
        <EnvBadge variant="internal">Nội bộ</EnvBadge>
      </>
    ),
    diagram: (
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <FlowNode
          icon={<Cloud className="size-7" />}
          label="Cổng đăng ký"
          badge={<EnvBadge variant="internet">Internet</EnvBadge>}
          tone="green"
        />
        <FlowArrow encrypted />
        <FlowNode
          icon={<Server className="size-7" />}
          label="QL Đào tạo"
          badge={<EnvBadge variant="internal">Nội bộ</EnvBadge>}
          tone="blue"
        />
      </div>
    ),
  },
] as const

export default function SyncProcessModal({ open, onClose }: SyncProcessModalProps) {
  return (
    <Modal
      title={
        <div className="pr-8">
          <div className="text-xl font-semibold text-slate-900">
            Quy trình đồng bộ dữ liệu hệ thống
          </div>
          <p className="mt-1 text-sm font-normal text-slate-500">
            Luồng trao đổi giữa phần mềm nội bộ và cổng đăng ký học internet
          </p>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      centered
      destroyOnClose
      className="sync-process-modal"
      styles={{
        content: { maxWidth: 1280, margin: "0 auto" },
        body: { paddingTop: 12, maxHeight: "82vh", overflowY: "auto" },
      }}
    >
      <section className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Sơ đồ luồng 3 bước
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <EnvBadge variant="internal">Nội bộ</EnvBadge>
            <EnvBadge variant="internet">Internet</EnvBadge>
          </div>
        </div>

        <div className="hidden grid-cols-3 gap-4 lg:grid">
          {STEPS.map((item) => (
            <div
              key={item.step}
              className="group rounded-xl border border-slate-100 bg-white/80 p-4 transition-all duration-200 hover:border-slate-200 hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                  {item.step}
                </span>
                <span className="text-sm font-medium text-slate-600">{item.subtitle}</span>
              </div>
              {item.diagram}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 lg:hidden">
          {STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                  {item.step}
                </span>
                <span className="text-sm font-medium text-slate-700">{item.title}</span>
              </div>
              {item.diagram}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Chi tiết từng bước
        </h3>
        <ol className="relative space-y-4 border-l-2 border-slate-200 sm:ml-3">
          {STEPS.map((item) => (
            <li key={item.step} className="relative pl-8 sm:pl-10">
              <span className="absolute -left-[13px] top-5 flex size-6 items-center justify-center rounded-full border-2 border-white bg-slate-800 text-[11px] font-bold text-white shadow-sm">
                {item.step}
              </span>
              <article className="group rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-semibold text-slate-900">{item.title}</h4>
                  <span className="text-sm text-slate-500">· {item.subtitle}</span>
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-1.5">{item.badges}</div>
                <p className="mb-0 text-[15px] leading-relaxed text-slate-600">{item.description}</p>
                <div className="mt-5 rounded-xl bg-slate-50/80 p-4 transition-colors duration-200 group-hover:bg-slate-50">
                  {item.diagram}
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </Modal>
  )
}
