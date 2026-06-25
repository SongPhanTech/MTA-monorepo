interface HangNhanNgangProps {
  label: string
  value: string
}

const HangNhanNgang = ({ label, value }: HangNhanNgangProps) => {
  if (!value || value === "—") return null

  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-50 py-1.5 last:border-b-0">
      <span className="shrink-0 text-xs text-gray-500">{label}</span>
      <span className="min-w-0 text-right text-xs font-medium leading-snug text-gray-800">
        {value}
      </span>
    </div>
  )
}

export default HangNhanNgang
