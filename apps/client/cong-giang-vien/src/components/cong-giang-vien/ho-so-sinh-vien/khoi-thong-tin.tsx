import type { ReactNode } from "react"

interface KhoiThongTinProps {
  tieuDe: string
  children: ReactNode
}

const KhoiThongTin = ({ tieuDe, children }: KhoiThongTinProps) => (
  <div className="h-full rounded-lg border border-gray-100 bg-white">
    <div className="border-b border-gray-100 px-4 py-3">
      <h3 className="m-0 text-sm font-semibold text-cgv-green-dark">{tieuDe}</h3>
    </div>
    <div className="px-4 py-1">{children}</div>
  </div>
)

export default KhoiThongTin
