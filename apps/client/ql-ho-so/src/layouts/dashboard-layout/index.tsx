import HoSoShell from "@layouts/ho-so-shell"
import type { ReactNode } from "react"

const DashboardLayout = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <HoSoShell unLayout className={className}>
      {children}
    </HoSoShell>
  )
}

export default DashboardLayout
