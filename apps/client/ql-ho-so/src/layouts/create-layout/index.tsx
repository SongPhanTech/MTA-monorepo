import HoSoShell from "@layouts/ho-so-shell"
import type { ReactNode } from "react"

const CreateLayout = ({
  children,
  className,
  breadcrumbList,
  unLayout = true,
}: {
  children: ReactNode
  className?: string
  breadcrumbList?: { title: string; href?: string }[]
  unLayout?: boolean
}) => {
  return (
    <HoSoShell
      className={className}
      breadcrumbList={breadcrumbList}
      unLayout={unLayout}
      showBreadcrumb
    >
      {children}
    </HoSoShell>
  )
}

export default CreateLayout
