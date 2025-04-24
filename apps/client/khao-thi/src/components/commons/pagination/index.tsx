import React from 'react'
import { Pagination as PaginationAntd, type PaginationProps } from 'antd'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
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
