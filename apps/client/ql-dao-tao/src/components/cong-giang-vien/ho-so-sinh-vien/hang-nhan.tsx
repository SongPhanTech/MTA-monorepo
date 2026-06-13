interface HangNhanProps {
  label: string
  value: string
}

const HangNhan = ({ label, value }: HangNhanProps) => (
  <div className="flex gap-2 py-1.5 text-sm">
    <span className="w-[130px] shrink-0 text-gray-500">{label}</span>
    <span className="min-w-0 flex-1 font-medium text-gray-800">{value || "—"}</span>
  </div>
)

export default HangNhan
