import { Pagination, Select } from "antd"

interface PhanTrangThongBaoProps {
  trang: number
  soTrang: number
  tongSo: number
  onDoiTrang: (trang: number) => void
  onDoiSoTrang: (soTrang: number) => void
}

const PhanTrangThongBao = ({
  trang,
  soTrang,
  tongSo,
  onDoiTrang,
  onDoiSoTrang,
}: PhanTrangThongBaoProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Hiển thị</span>
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
        <span>thông báo / trang</span>
      </div>

      <Pagination
        current={trang}
        pageSize={soTrang}
        total={tongSo}
        onChange={onDoiTrang}
        showSizeChanger={false}
        className="[&_.ant-pagination-item-active]:!border-cgv-green-dark [&_.ant-pagination-item-active_a]:!text-cgv-green-dark"
      />

      <span className="text-sm text-gray-600">Tổng {tongSo} thông báo</span>
    </div>
  )
}

export default PhanTrangThongBao
