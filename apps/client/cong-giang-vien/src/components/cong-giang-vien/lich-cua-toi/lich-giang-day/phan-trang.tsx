import { Pagination } from "antd"

interface PhanTrangLichGiangDayProps {
  trang: number
  soTrang: number
  tongSo: number
  batDau: number
  ketThuc: number
  donVi?: "lịch" | "ngày"
  onDoiTrang: (trang: number) => void
}

const PhanTrangLichGiangDay = ({
  trang,
  soTrang,
  tongSo,
  batDau,
  ketThuc,
  donVi = "lịch",
  onDoiTrang,
}: PhanTrangLichGiangDayProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
      <span className="text-sm text-gray-600">
        {tongSo === 0
          ? `Hiển thị 0 / 0 ${donVi}`
          : `Hiển thị ${batDau} - ${ketThuc} / ${tongSo} ${donVi}`}
      </span>

      <Pagination
        current={trang}
        pageSize={soTrang}
        total={tongSo}
        onChange={onDoiTrang}
        showSizeChanger={false}
        showLessItems
        className="[&_.ant-pagination-item-active]:!border-cgv-green-dark [&_.ant-pagination-item-active_a]:!text-cgv-green-dark"
      />
    </div>
  )
}

export default PhanTrangLichGiangDay
