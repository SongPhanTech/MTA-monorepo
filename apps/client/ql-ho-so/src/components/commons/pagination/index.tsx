import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { Pagination as PaginationAntd, type PaginationProps } from "antd"

const Pagination = ({ ...rest }: PaginationProps) => (
  <PaginationAntd
    {...rest}
    defaultCurrent={DEFAULT_PAGINATE_SIZE}
    showSizeChanger={{
      labelRender: ({ value }) => `${value} / trang`,
      optionRender: (oriOption) => `${oriOption.value} / trang`,
    }}
  />
)
export default Pagination
