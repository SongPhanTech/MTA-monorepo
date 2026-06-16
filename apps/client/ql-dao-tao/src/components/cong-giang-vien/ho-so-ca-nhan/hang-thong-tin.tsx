import type React from "react"

export const GIA_TRI_TRONG = "_"

interface HangThongTinProps {
  label: string
  value: React.ReactNode
  labelWith?: number
}

const isEmptyValue = (value: React.ReactNode) =>
  value == null || value === false || (typeof value === "string" && value.trim() === "")

const hienThiGiaTri = (value: React.ReactNode) =>
  isEmptyValue(value) ? GIA_TRI_TRONG : value

const InputRow = ({ label, value, labelWith = 130 }: HangThongTinProps) => {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="shrink-0 whitespace-nowrap text-gray-500" style={{ minWidth: labelWith }}>
        {label}:
      </span>
      <span className="flex-1 font-medium text-gray-800">{hienThiGiaTri(value)}</span>
    </div>
  )
}

export default InputRow
