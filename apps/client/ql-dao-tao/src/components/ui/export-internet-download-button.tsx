import { Check, Download, Loader2 } from "lucide-react"
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react"
import { downloadExportedFile } from "@/stores/export-training-store"

export type ExportInternetPhase =
  | "idle"
  | "falling"
  | "preparing"
  | "downloading"
  | "done"
  | "failed"

type Props = {
  label?: string
  compact?: boolean
  disabled?: boolean
  className?: string
  style?: CSSProperties
  prepareProgress?: number
  externalStatus?: "IDLE" | "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED"
  downloadUrl?: string
  fileName?: string
  onStartExport: () => void | Promise<void>
  isOtherJobRunning?: boolean
  onOtherJobRunning?: () => void
}

const DONE_HOLD_MS = 1200
const FALL_MS = 420

const FALL_KEYFRAMES = `
@keyframes export-dl-fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  45% { transform: translateY(12px) rotate(-10deg); opacity: 0.35; }
  100% { transform: translateY(0) rotate(0deg); opacity: 1; }
}
.export-dl-icon-fall {
  animation: export-dl-fall 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
}
`

/**
 * Micro-interaction: click → icon rơi → Downloading % → progress → Downloaded ✓
 */
export function ExportInternetDownloadButton({
  label = "Xuất ra internet",
  compact = false,
  disabled,
  className = "",
  style,
  prepareProgress = 0,
  externalStatus = "IDLE",
  downloadUrl,
  fileName,
  onStartExport,
  isOtherJobRunning,
  onOtherJobRunning,
}: Props) {
  const [phase, setPhase] = useState<ExportInternetPhase>("idle")
  const [percent, setPercent] = useState(0)
  const downloadStarted = useRef(false)
  const ownedByThis = useRef(false)

  useEffect(() => {
    if (!ownedByThis.current) return

    if (externalStatus === "PENDING" || externalStatus === "PROCESSING") {
      setPhase("preparing")
      setPercent(Math.max(0, Math.min(99, prepareProgress)))
      downloadStarted.current = false
      return
    }

    if (externalStatus === "FAILED") {
      setPhase("failed")
      setPercent(0)
      ownedByThis.current = false
      return
    }

    if (externalStatus === "SUCCESS" && downloadUrl && !downloadStarted.current) {
      downloadStarted.current = true
      void runFileDownload(downloadUrl, fileName)
    }
  }, [externalStatus, prepareProgress, downloadUrl, fileName])

  async function runFileDownload(url: string, name?: string) {
    setPhase("downloading")
    setPercent(0)
    const ok = await downloadExportedFile(url, name, {
      onProgress: (p) => setPercent(p),
    })
    if (ok) {
      setPercent(100)
      setPhase("done")
      ownedByThis.current = false
      window.setTimeout(() => {
        setPhase("idle")
        setPercent(0)
        downloadStarted.current = false
      }, DONE_HOLD_MS)
    } else {
      setPhase("failed")
      ownedByThis.current = false
      downloadStarted.current = false
    }
  }

  async function handleClick(e: MouseEvent) {
    e.stopPropagation()
    if (disabled) return
    if (phase === "falling" || phase === "preparing" || phase === "downloading" || phase === "done") {
      return
    }

    if (externalStatus === "SUCCESS" && downloadUrl) {
      ownedByThis.current = true
      downloadStarted.current = true // tránh useEffect auto-download trùng
      setPhase("falling")
      window.setTimeout(() => {
        void runFileDownload(downloadUrl, fileName)
      }, FALL_MS)
      return
    }

    if (isOtherJobRunning) {
      onOtherJobRunning?.()
      return
    }

    ownedByThis.current = true
    downloadStarted.current = false
    setPhase("falling")
    setPercent(0)

    window.setTimeout(() => {
      setPhase("preparing")
      void onStartExport()
    }, FALL_MS)
  }

  const showProgress = phase === "preparing" || phase === "downloading"
  const displayPercent = Math.round(percent)

  const labelNode: ReactNode = (() => {
    switch (phase) {
      case "falling":
        return compact ? null : <span className="opacity-70">{label}</span>
      case "preparing":
      case "downloading":
        return <span className="tabular-nums">Downloading {displayPercent}%</span>
      case "done":
        return <span>Downloaded</span>
      case "failed":
        return compact ? null : <span>Thử lại</span>
      default:
        return compact ? null : <span>{label}</span>
    }
  })()

  const iconNode = (() => {
    if (phase === "done") {
      return <Check className={compact ? "size-3.5" : "size-4"} strokeWidth={2.5} />
    }
    if (phase === "preparing" || phase === "downloading") {
      return <Loader2 className={`${compact ? "size-3.5" : "size-4"} animate-spin`} />
    }
    return (
      <Download
        className={`${compact ? "size-3.5" : "size-4"} ${phase === "falling" ? "export-dl-icon-fall" : ""}`}
      />
    )
  })()

  const toneClass =
    phase === "done"
      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
      : phase === "failed"
        ? "border-red-300 bg-red-50 text-red-600"
        : showProgress
          ? "border-sky-400 text-sky-800"
          : compact
            ? "border-transparent bg-transparent text-slate-600 hover:text-sky-600"
            : "border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:text-sky-700"

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FALL_KEYFRAMES }} />
      <button
        type="button"
        disabled={disabled || phase === "falling" || phase === "done" || (compact && showProgress)}
        onClick={handleClick}
        className={
          compact
            ? `relative inline-flex min-w-[1.75rem] items-center justify-center gap-0.5 overflow-hidden rounded border px-1.5 py-0.5 text-xs font-medium transition-all duration-300 ${toneClass} ${className}`
            : `relative inline-flex h-8 items-center justify-center gap-2 overflow-hidden rounded-md border px-3 text-sm font-medium shadow-sm transition-all duration-300 ease-out ${
                showProgress ? "min-w-[11.5rem]" : phase === "done" ? "min-w-[8.5rem]" : "min-w-0"
              } ${toneClass} ${className}`
        }
        style={style}
        title={
          showProgress
            ? `Downloading ${displayPercent}%`
            : phase === "done"
              ? "Downloaded"
              : compact
                ? "Xuất dữ liệu đợt này ra internet"
                : label
        }
      >
        {showProgress ? (
          <span
            className={`absolute inset-y-0 left-0 transition-[width] duration-200 ease-out ${
              compact ? "bg-sky-200/50" : "bg-gradient-to-r from-sky-200/80 to-sky-100/40"
            }`}
            style={{ width: `${displayPercent}%` }}
            aria-hidden
          />
        ) : null}
        <span className="relative z-[1] inline-flex items-center gap-2">
          {iconNode}
          {compact ? (
            showProgress || phase === "done" ? (
              <span className="tabular-nums text-[10px] leading-none">
                {phase === "done" ? "✓" : `${displayPercent}%`}
              </span>
            ) : null
          ) : (
            labelNode
          )}
        </span>
      </button>
    </>
  )
}
