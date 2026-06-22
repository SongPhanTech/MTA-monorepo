import type React from "react"

interface HangThongTinProps {
  label: string
  value: React.ReactNode
  labelWith?: number
}

const InputRow = ({ label, value, labelWith = 130 }: HangThongTinProps) => {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="shrink-0 whitespace-nowrap text-gray-500" style={{ minWidth: labelWith }}>
        {label}:
      </span>
      <span className="flex-1 font-medium text-gray-800">{value || "_"}</span>
    </div>
  )
}

export default InputRow
