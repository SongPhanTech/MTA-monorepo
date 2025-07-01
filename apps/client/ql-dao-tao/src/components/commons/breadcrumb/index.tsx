interface BreadcrumbProps {
    list:
        | {
              title: string
              href?: string | null
          }[]
        | []
}

export const Breadcrumb = ({ list }: BreadcrumbProps) => {
    return <div>index</div>
}
