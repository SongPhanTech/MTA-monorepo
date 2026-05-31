import DefaultLayout from "@layouts/default-layout"
import { Typography } from "antd"
import type { ReactElement, ReactNode } from "react"

const { Title, Text } = Typography

type PlaceholderPageProps = {
  title: string
  description?: string
}

export function createPlaceholderPage({ title, description }: PlaceholderPageProps) {
  function Page() {
    return (
      <div>
        <Title level={4}>{title}</Title>
        {description ? <Text type="secondary">{description}</Text> : null}
      </div>
    )
  }

  Page.getLayout = function getLayout(page: ReactNode) {
    return <DefaultLayout>{page}</DefaultLayout>
  }

  return Page
}

export type PlaceholderPage = ReturnType<typeof createPlaceholderPage> & {
  getLayout: (page: ReactElement) => ReactElement
}
