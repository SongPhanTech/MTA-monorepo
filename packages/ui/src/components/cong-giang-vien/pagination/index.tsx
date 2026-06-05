import { Pagination, Select } from "antd"

type TFooterPagination = {
  total: number
  current: number
  pageSize: number
  onChange: (page: number, pageSize: number) => void
  className?: string
  label?: string
  title?: string
  pageSizeOptions?: number[]
  showSizeSelector?: boolean
}

export const FooterPagination = ({
  total,
  current,
  pageSize,
  onChange,
  className = "",
  label = "Tổng",
  title = "",
  pageSizeOptions = [10, 20, 50, 100],
  showSizeSelector = true,
}: TFooterPagination) => {
  return (
    <div className={`flex justify-between items-center ${className}`}>
      <div className="flex items-center gap-2 text-sm">
        {showSizeSelector && (
          <>
            <span className="text-sm">Hiển thị</span>
            <Select
              size="small"
              style={{ width: 50 }}
              value={pageSize}
              onChange={(value) => onChange(1, value)}
              options={pageSizeOptions.map((v) => ({ label: v, value: v }))}
            />
            <span className="text-sm">{title} / trang</span>
          </>
        )}
      </div>

      <Pagination
        align="center"
        current={current}
        pageSize={pageSize}
        total={total}
        showSizeChanger={false}
        onChange={onChange}
      />

      <div className="text-sm">
        {label} <span className="font-semibold">{total}</span> {title}
      </div>
    </div>
  )
}
