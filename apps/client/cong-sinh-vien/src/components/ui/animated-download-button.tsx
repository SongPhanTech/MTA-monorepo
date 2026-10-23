import { Check, Download, Loader2 } from "lucide-react"
import { useState, type MouseEvent, type ReactNode } from "react"

type Phase = "idle" | "falling" | "downloading" | "done" | "failed"

type Props = {
  label?: string
  disabled?: boolean
  className?: string
  /** Chạy tải; gọi onProgress(0–100). Trả true nếu thành công. */
  onDownload: (onProgress: (percent: number) => void) => Promise<boolean>
}

const DONE_HOLD_MS = 1200
const FALL_MS = 420

const FALL_KEYFRAMES = `
@keyframes portal-dl-fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  45% { transform: translateY(12px) rotate(-10deg); opacity: 0.35; }
  100% { transform: translateY(0) rotate(0deg); opacity: 1; }
}
.portal-dl-icon-fall {
  animation: portal-dl-fall 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
}
`

/**
 * Micro-interaction: click → icon rơi → Downloading % → Downloaded ✓
 */
export function AnimatedDownloadButton({
  label = "Download",
  disabled,
  className = "",
  onDownload,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [percent, setPercent] = useState(0)

  async function handleClick(e: MouseEvent) {
    e.stopPropagation()
    if (disabled || phase === "falling" || phase === "downloading" || phase === "done") return

    setPhase("falling")
    setPercent(0)

    window.setTimeout(async () => {
      setPhase("downloading")
      setPercent(0)
      try {
        const ok = await onDownload((p) => setPercent(Math.max(0, Math.min(100, Math.round(p)))))
        if (ok) {
          setPercent(100)
          setPhase("done")
          window.setTimeout(() => {
            setPhase("idle")
            setPercent(0)
          }, DONE_HOLD_MS)
        } else {
          setPhase("failed")
        }
      } catch {
        setPhase("failed")
      }
    }, FALL_MS)
  }

  const showProgress = phase === "downloading"
  const displayPercent = Math.round(percent)

  const labelNode: ReactNode = (() => {
    switch (phase) {
      case "falling":
        return <span className="opacity-70">{label}</span>
      case "downloading":
        return <span className="tabular-nums">Downloading {displayPercent}%</span>
      case "done":
        return <span>Downloaded</span>
      case "failed":
        return <span>Thử lại</span>
      default:
        return <span>{label}</span>
    }
  })()

  const iconNode =
    phase === "done" ? (
      <Check className="size-4" strokeWidth={2.5} />
    ) : phase === "downloading" ? (
      <Loader2 className="size-4 animate-spin" />
    ) : (
      <Download className={`size-4 ${phase === "falling" ? "portal-dl-icon-fall" : ""}`} />
    )

  const toneClass =
    phase === "done"
      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
      : phase === "failed"
        ? "border-red-400 bg-red-50 text-red-600"
        : showProgress
          ? "border-sky-500 text-sky-900"
          : "border-transparent bg-[#1677ff] text-white hover:bg-[#4096ff]"

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FALL_KEYFRAMES }} />
      <button
        type="button"
        disabled={disabled || phase === "falling" || phase === "done"}
        onClick={handleClick}
        className={`relative inline-flex h-8 items-center justify-center gap-2 overflow-hidden rounded-md border px-4 text-sm font-medium shadow-sm transition-all duration-300 ease-out ${
          showProgress ? "min-w-[11.5rem]" : phase === "done" ? "min-w-[8.5rem]" : "min-w-0"
        } ${toneClass} ${className}`}
      >
        {showProgress ? (
          <span
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-200/90 to-sky-100/50 transition-[width] duration-200 ease-out"
            style={{ width: `${displayPercent}%` }}
            aria-hidden
          />
        ) : null}
        <span className="relative z-[1] inline-flex items-center gap-2">
          {iconNode}
          {labelNode}
        </span>
      </button>
    </>
  )
}
