import DefaultLayout from "@layouts/default-layout"
import { ROUTER_PATH } from "@workspace/router"
import { Button } from "antd"
import { ArrowLeft, Home, ShieldOff } from "lucide-react"
import { useRouter } from "next/router"

export default function ForbiddenPage() {
  const router = useRouter()
  const from = typeof router.query.from === "string" ? router.query.from : undefined

  return (
    <div className="forbidden-page flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-10">
      <div className="forbidden-card relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#028850]/15 bg-white px-8 py-12 text-center shadow-[0_12px_40px_-16px_rgba(2,136,80,0.28)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[#028850]/10 blur-2xl forbidden-blob"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-12 h-48 w-48 rounded-full bg-[#028850]/[0.08] blur-2xl forbidden-blob-delay"
        />

        <div className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border border-[#028850]/25 forbidden-ring"
          />
          <span
            aria-hidden
            className="absolute inset-3 rounded-full border border-dashed border-[#028850]/30 forbidden-ring-reverse"
          />
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#028850] to-[#046b3f] text-white shadow-lg shadow-[#028850]/30">
            <ShieldOff size={28} strokeWidth={2.1} />
          </div>
        </div>

        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#028850]/8 px-3 py-1 text-xs font-medium tracking-wide text-[#028850]">
            Không có quyền truy cập
          </div>
          <h1 className="text-[4.5rem] font-black leading-none tracking-tight text-[#004725]">
            403
          </h1>
          <p className="mx-auto max-w-md text-base text-slate-600">
            Tài khoản của bạn chưa được cấp quyền xem chức năng này. Vui lòng liên hệ quản trị viên
            hệ thống nếu bạn cần truy cập.
          </p>
          {from ? (
            <p className="truncate text-xs text-slate-400" title={from}>
              Đường dẫn: {from}
            </p>
          ) : null}
        </div>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="default"
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Quay lại
          </Button>
          <Button
            type="primary"
            size="large"
            className="!bg-[#028850] hover:!bg-[#046b3f]"
            icon={<Home size={16} />}
            onClick={() => void router.push(ROUTER_PATH.CONG_HOC_VIEN.HOME)}
          >
            Về trang chủ
          </Button>
        </div>
      </div>

      <style jsx>{`
        .forbidden-blob {
          animation: forbidden-float 8s ease-in-out infinite;
        }
        .forbidden-blob-delay {
          animation: forbidden-float 10s ease-in-out infinite reverse;
        }
        .forbidden-ring {
          animation: forbidden-spin 18s linear infinite;
        }
        .forbidden-ring-reverse {
          animation: forbidden-spin 14s linear infinite reverse;
        }
        @keyframes forbidden-float {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(12px, -10px);
          }
        }
        @keyframes forbidden-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

ForbiddenPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout unLayout>{page}</DefaultLayout>
}
