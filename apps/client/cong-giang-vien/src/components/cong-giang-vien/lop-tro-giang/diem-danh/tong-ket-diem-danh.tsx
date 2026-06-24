import type { TongKetDiemDanh } from "@components/cong-giang-vien/lop-tro-giang/diem-danh/types"

interface TongKetDiemDanhCardProps {
  tongKet: TongKetDiemDanh
}

const Hang = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-center justify-between py-1.5 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-800">{value}</span>
  </div>
)

const TongKetDiemDanhCard = ({ tongKet }: TongKetDiemDanhCardProps) => (
  <div className="rounded-lg border border-gray-100 bg-white p-4">
    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cgv-green-dark">
      Tổng kết
    </p>

    <Hang label="Tổng sinh viên:" value={tongKet.tongSinhVien} />
    <Hang label="Có mặt:" value={tongKet.coMat} />
    <Hang label="Vắng có phép:" value={tongKet.vangCoPhep} />
    <Hang label="Vắng không phép:" value={tongKet.vangKhongPhep} />

    <div className="mt-2 flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-sm">
      <span className="text-gray-600">Tỷ lệ chuyên cần:</span>
      <span className="font-semibold text-green-600">{tongKet.tyLeChuyenCan}%</span>
    </div>
    <div className="mt-2 flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm">
      <span className="text-gray-600">Tỷ lệ vắng:</span>
      <span className="font-semibold text-red-500">{tongKet.tyLeVang}%</span>
    </div>
  </div>
)

export default TongKetDiemDanhCard
