import React from 'react'
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons'
import './index.css'

type SortingProps = {
    field: string
    urlQuery: any
    onSortChange: (params: any) => void
}

function Sorting(props: SortingProps) {
    return (
        <div className="sort-group">
            <CaretUpOutlined
                className={`sort-up ${props.field === props.urlQuery.orderBy && 'DESC' === props.urlQuery.order ? 'active' : ''}`}
                onClick={() =>
                    props.onSortChange({ orderBy: props.field, order: 'DESC' })
                }
            />
            <CaretDownOutlined
                className={`sort-down ${props.field === props.urlQuery.orderBy && 'ASC' === props.urlQuery.order ? 'active' : ''}`}
                onClick={() =>
                    props.onSortChange({ orderBy: props.field, order: 'ASC' })
                }
            />
        </div>
    )
}

export default Sorting
