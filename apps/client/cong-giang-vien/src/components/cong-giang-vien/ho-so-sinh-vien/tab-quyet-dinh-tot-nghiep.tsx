import TheDanhSachQuyetDinhTotNghiep from "@components/cong-giang-vien/ho-so-sinh-vien/the-danh-sach-quyet-dinh-tot-nghiep"
import type { QuyetDinhTotNghiepSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { FileText, Info } from "lucide-react"

interface TabQuyetDinhTotNghiepProps {
  danhSach: QuyetDinhTotNghiepSinhVien[]
}

const TabQuyetDinhTotNghiep = ({ danhSach }: TabQuyetDinhTotNghiepProps) => (
  <div className="flex flex-col gap-3 p-4">
    <div>
      <div className="flex items-center gap-2">
        <FileText size={16} className="text-cgv-green-dark/70" />
        <h2 className="m-0 text-sm font-bold uppercase tracking-wide text-cgv-green-dark">
          Quyết định tốt nghiệp
        </h2>
      </div>
      <p className="m-0 mt-1 text-xs text-gray-500">
        Danh sách quyết định công nhận tốt nghiệp và xếp loại của sinh viên.
      </p>
    </div>

    <TheDanhSachQuyetDinhTotNghiep danhSach={danhSach} />
  </div>
)

export default TabQuyetDinhTotNghiep
