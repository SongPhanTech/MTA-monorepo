interface HangNhanProps {
  label: string
  value: string
}

const HangNhan = ({ label, value }: HangNhanProps) => (
  <div className="py-2">
    <p className="m-0 text-xs text-gray-500">{label}</p>
    <p className="m-0 mt-1 text-sm font-medium leading-snug text-gray-800">{value || "—"}</p>
  </div>
)

export default HangNhan
