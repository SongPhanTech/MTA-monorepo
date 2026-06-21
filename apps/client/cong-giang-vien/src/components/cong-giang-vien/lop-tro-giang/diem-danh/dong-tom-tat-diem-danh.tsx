import type { TongKetDiemDanh } from "@components/cong-giang-vien/lop-tro-giang/diem-danh/types"

interface DongTomTatDiemDanhProps {
  tongKet: TongKetDiemDanh
}

const DongTomTatDiemDanh = ({ tongKet }: DongTomTatDiemDanhProps) => (
  <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-1 text-sm">
    <span className="text-gray-700">
      Tổng sinh viên: <span className="font-semibold text-gray-900">{tongKet.tongSinhVien}</span>
    </span>
    <span className="text-gray-700">
      Có mặt:{" "}
      <span className="font-semibold text-green-600">
        {tongKet.coMat} ({tongKet.tyLeChuyenCan}%)
      </span>
    </span>
    <span className="text-gray-700">
      Vắng có phép: <span className="font-semibold text-amber-600">{tongKet.vangCoPhep}</span>
    </span>
    <span className="text-gray-700">
      Vắng không phép: <span className="font-semibold text-red-500">{tongKet.vangKhongPhep}</span>
    </span>
  </div>
)

export default DongTomTatDiemDanh
