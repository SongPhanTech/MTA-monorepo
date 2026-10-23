import { Cloud, FileArchive, Check } from "lucide-react"
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react"

type Phase = "idle" | "selected" | "lifting" | "swallowing" | "progress" | "complete" | "failed"

export type CloudUploadPanelHandle = {
  startUpload: () => Promise<boolean>
  getFile: () => File | null
  reset: () => void
  /** Gán file từ bên ngoài (sau khi chọn qua input ẩn) */
  setExternalFile: (file: File) => void
}

type Props = {
  accept?: string
  disabled?: boolean
  hint?: ReactNode
  onFileSelected?: (file: File) => void | Promise<void>
  onUpload: (file: File, onProgress: (p: number) => void) => Promise<boolean>
  onComplete?: (file: File) => void
  validateFile?: (file: File) => string | null
  showUploadButton?: boolean
  /** Ẩn vùng chọn file (đã chọn sẵn từ ngoài) */
  hidePicker?: boolean
}

const COMPLETE_HOLD_MS = 1000
const LIFT_MS = 480
const SWALLOW_MS = 620

const STYLES = `
@keyframes cloud-file-lift {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-72px) scale(0.92); opacity: 1; }
}
@keyframes cloud-file-swallow {
  0% { transform: translateY(-72px) scale(0.92); opacity: 1; }
  70% { transform: translateY(-118px) scale(0.35); opacity: 0.85; }
  100% { transform: translateY(-132px) scale(0.12); opacity: 0; }
}
@keyframes cloud-wing-left {
  0% { transform: rotate(0deg) translateX(0); }
  100% { transform: rotate(-18deg) translateX(-6px); }
}
@keyframes cloud-wing-right {
  0% { transform: rotate(0deg) translateX(0); }
  100% { transform: rotate(18deg) translateX(6px); }
}
.cloud-lift { animation: cloud-file-lift 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.cloud-swallow { animation: cloud-file-swallow 0.62s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.cloud-open-l { animation: cloud-wing-left 0.45s ease-out forwards; transform-origin: 70% 60%; }
.cloud-open-r { animation: cloud-wing-right 0.45s ease-out forwards; transform-origin: 30% 60%; }
`

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

function wait(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms))
}

export const CloudUploadPanel = forwardRef<CloudUploadPanelHandle, Props>(function CloudUploadPanel(
  {
    accept = ".dat,.sync,application/x-mta-dat,application/octet-stream",
    disabled,
    hint,
    onFileSelected,
    onUpload,
    onComplete,
    validateFile,
    showUploadButton = true,
    hidePicker = false,
  },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<File | null>(null)
  const [phase, setPhase] = useState<Phase>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [percent, setPercent] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runUploadSequence(): Promise<boolean> {
    const current = fileRef.current
    if (!current || disabled) return false
    if (phase === "lifting" || phase === "swallowing" || phase === "progress" || phase === "complete") {
      return false
    }

    setError(null)
    setPhase("lifting")
    setPercent(0)
    await wait(LIFT_MS)
    setPhase("swallowing")
    await wait(SWALLOW_MS)
    setPhase("progress")

    try {
      const ok = await onUpload(current, (p) =>
        setPercent(Math.max(0, Math.min(100, Math.round(p))))
      )
      if (ok) {
        setPercent(100)
        setPhase("complete")
        await wait(COMPLETE_HOLD_MS)
        onComplete?.(current)
        fileRef.current = null
        setFile(null)
        setPercent(0)
        setPhase("idle")
        return true
      }
      setPhase("failed")
      return false
    } catch {
      setPhase("failed")
      return false
    }
  }

  useImperativeHandle(ref, () => ({
    startUpload: () => runUploadSequence(),
    getFile: () => fileRef.current,
    reset: () => {
      fileRef.current = null
      setFile(null)
      setPercent(0)
      setPhase("idle")
      setError(null)
    },
    setExternalFile: (f: File) => {
      fileRef.current = f
      setFile(f)
      setPercent(0)
      setPhase("selected")
      setError(null)
    },
  }))

  async function pickFile(f: File | undefined) {
    if (!f || disabled) return
    const err = validateFile?.(f) ?? null
    if (err) {
      setError(err)
      fileRef.current = null
      setFile(null)
      setPhase("idle")
      return
    }
    setError(null)
    fileRef.current = f
    setFile(f)
    setPercent(0)
    setPhase("selected")
    await onFileSelected?.(f)
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    void pickFile(e.target.files?.[0])
    e.target.value = ""
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    void pickFile(e.dataTransfer.files?.[0])
  }

  function clearFile() {
    if (phase === "lifting" || phase === "swallowing" || phase === "progress" || phase === "complete") {
      return
    }
    fileRef.current = null
    setFile(null)
    setPhase("idle")
    setPercent(0)
    setError(null)
  }

  const cloudOpen = phase === "swallowing" || phase === "progress" || phase === "complete"
  const busy =
    phase === "lifting" || phase === "swallowing" || phase === "progress" || phase === "complete"

  return (
    <div className="w-full">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      {!hidePicker ? (
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled || busy}
          onChange={onInputChange}
        />
      ) : null}

      <div
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed px-4 pb-5 pt-6 transition-colors ${
          dragOver
            ? "border-sky-400 bg-sky-50"
            : phase === "complete"
              ? "border-emerald-300 bg-emerald-50/60"
              : phase === "failed"
                ? "border-red-300 bg-red-50/50"
                : "border-slate-200 bg-gradient-to-b from-slate-50 to-white"
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy && !hidePicker) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={hidePicker ? undefined : onDrop}
      >
        <div className="relative mx-auto mb-2 flex h-24 w-40 items-end justify-center">
          <div className="absolute bottom-2 left-1/2 z-0 h-3 w-16 -translate-x-1/2 rounded-full bg-sky-200/50 blur-[2px]" />
          <div className="relative z-[1] flex items-end text-sky-500">
            <Cloud
              className={`-mr-3 size-16 text-sky-400/90 ${cloudOpen ? "cloud-open-l" : ""}`}
              strokeWidth={1.5}
              fill="currentColor"
              fillOpacity={0.15}
            />
            <Cloud
              className={`size-20 text-sky-500 ${cloudOpen ? "cloud-open-r" : ""}`}
              strokeWidth={1.5}
              fill="currentColor"
              fillOpacity={0.22}
            />
            <Cloud
              className={`-ml-3 size-16 text-sky-400/90 ${cloudOpen ? "cloud-open-r" : ""}`}
              strokeWidth={1.5}
              fill="currentColor"
              fillOpacity={0.15}
            />
          </div>
          {phase === "complete" ? (
            <div className="absolute inset-0 z-[2] flex items-center justify-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                <Check className="size-5" strokeWidth={2.5} />
              </span>
            </div>
          ) : null}
        </div>

        {file && phase !== "complete" ? (
          <div
            className={`relative z-[2] mx-auto mb-4 flex w-full max-w-xs items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm ${
              phase === "lifting" ? "cloud-lift" : phase === "swallowing" ? "cloud-swallow" : ""
            }`}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <FileArchive className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-800">{file.name}</div>
              <div className="text-xs text-slate-500">{formatSize(file.size)}</div>
            </div>
            {!busy && phase !== "failed" && !hidePicker ? (
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-red-500"
                onClick={clearFile}
              >
                Xóa
              </button>
            ) : null}
          </div>
        ) : null}

        {!file && phase === "idle" && !hidePicker ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="mx-auto mb-3 block w-full max-w-sm rounded-xl px-3 py-2 text-center text-sm text-slate-600 transition hover:bg-white/80 disabled:opacity-50"
          >
            <div className="font-medium text-slate-800">Kéo thả hoặc bấm để chọn file</div>
            <div className="mt-1 text-xs text-slate-500">{hint ?? "Gói .dat từ Portal"}</div>
          </button>
        ) : null}

        {(phase === "progress" || phase === "complete") && (
          <div className="mx-auto mb-3 w-full max-w-xs">
            <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
              <span>{phase === "complete" ? "UPLOAD COMPLETE" : "Uploading"}</span>
              <span className="tabular-nums">{percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-[width] duration-200 ${
                  phase === "complete" ? "bg-emerald-500" : "bg-sky-500"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            {phase === "complete" ? (
              <div className="mt-2 text-center text-sm font-semibold text-emerald-700">
                UPLOAD COMPLETE ✓
              </div>
            ) : null}
          </div>
        )}

        {phase === "failed" ? (
          <div className="mb-3 text-center text-sm text-red-600">Không nhập được dữ liệu</div>
        ) : null}
        {error ? <div className="mb-3 text-center text-sm text-red-600">{error}</div> : null}

        {showUploadButton && (phase === "selected" || phase === "failed") && file ? (
          <div className="flex justify-center gap-2">
            {!hidePicker ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-slate-300"
              >
                Đổi file
              </button>
            ) : null}
            <button
              type="button"
              disabled={disabled}
              onClick={() => void runUploadSequence()}
              className="rounded-md bg-[#1677ff] px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-[#4096ff]"
            >
              {phase === "failed" ? "Thử lại" : "Nhập dữ liệu"}
            </button>
          </div>
        ) : null}

        {busy && phase !== "complete" ? (
          <div className="text-center text-xs text-slate-500">Đang nhập dữ liệu</div>
        ) : null}
      </div>
    </div>
  )
})
