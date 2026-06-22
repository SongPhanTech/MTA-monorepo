import { Pagination, Select } from "antd"

interface PhanTrangLopQuanLyProps {
  trang: number
  soTrang: number
  tongSo: number
  onDoiTrang: (trang: number) => void
  onDoiSoTrang: (soTrang: number) => void
}

const PhanTrangLopQuanLy = ({
  trang,
  soTrang,
  tongSo,
  onDoiTrang,
  onDoiSoTrang,
}: PhanTrangLopQuanLyProps) => {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white px-1 pt-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Select
          value={soTrang}
          onChange={(value) => {
            onDoiSoTrang(value)
            onDoiTrang(1)
          }}
          className="w-16"
          options={[
            { value: 10, label: "10" },
            { value: 20, label: "20" },
            { value: 50, label: "50" },
          ]}
        />
        <span>dòng / trang. Tổng số: {tongSo} lớp</span>
      </div>

      <Pagination
        current={trang}
        pageSize={soTrang}
        total={tongSo}
        onChange={onDoiTrang}
        showSizeChanger={false}
        className="[&_.ant-pagination-item-active]:!border-cgv-green-dark [&_.ant-pagination-item-active_a]:!text-cgv-green-dark"
      />
    </div>
  )
}

export default PhanTrangLopQuanLy
