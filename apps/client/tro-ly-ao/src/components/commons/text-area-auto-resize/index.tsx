import { useCallback, useEffect, useRef } from "react"

interface AutoResizeTextAreaProps {
  value: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder: string
  disabled?: boolean
  readOnly?: boolean
  onKeyDown?: (e: React.KeyboardEvent) => void
  className?: string
  minHeight?: number
  maxHeight?: number
  onHeightChange?: (height: number) => void
}

const AutoResizeTextArea = ({
  value,
  onChange,
  placeholder,
  disabled,
  readOnly,
  onKeyDown,
  className = "",
  minHeight = 120,
  maxHeight = 400,
  onHeightChange,
}: AutoResizeTextAreaProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const textArea = textAreaRef.current
    if (textArea) {
      const scrollableParent = textArea.closest(".overflow-y-auto")
      const savedScrollTop = scrollableParent?.scrollTop || 0

      textArea.style.height = "auto"
      const scrollHeight = textArea.scrollHeight
      const newHeight = Math.max(minHeight, Math.min(maxHeight, scrollHeight + 2))
      textArea.style.height = `${newHeight}px`

      if (scrollHeight > maxHeight) {
        textArea.style.overflowY = "auto"
      } else {
        textArea.style.overflowY = "hidden"
      }

      if (scrollableParent) {
        scrollableParent.scrollTop = savedScrollTop
      }

      onHeightChange?.(newHeight)
    }
  }, [minHeight, maxHeight, onHeightChange])

  useEffect(() => {
    adjustHeight()
  }, [adjustHeight])

  useEffect(() => {
    const timer = setTimeout(adjustHeight, 10)
    return () => clearTimeout(timer)
  }, [value, adjustHeight])

  return (
    <textarea
      ref={textAreaRef}
      value={value}
      onChange={(e) => {
        onChange?.(e)
        adjustHeight()
      }}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className={`
                w-full px-3 py-3 text-base border-0 rounded-none
                focus:outline-none resize-none
                disabled:text-gray-500
                bg-transparent
                ${readOnly ? "bg-transparent" : "bg-transparent"}
                ${className}
            `}
      style={{
        minHeight: `${minHeight}px`,
        lineHeight: "1.6",
        overflowY: "hidden",
      }}
    />
  )
}

export default AutoResizeTextArea
