import type { BoLocSinhVienLopQuanLy } from "@components/cong-giang-vien/lop-quan-ly/types"
import { FIXED_CLASS_STUDENT_STATUS } from "@constants/constants"
import { useFindManyDM_GioiTinh } from "@workspace/db/hooks"
import { Button, Input, Select } from "antd"
import { Search } from "lucide-react"

interface BoLocSinhVienProps {
  boLoc: BoLocSinhVienLopQuanLy
  onChange: (capNhat: Partial<BoLocSinhVienLopQuanLy>) => void
  onDoiBoLocNgay: (capNhat: Partial<BoLocSinhVienLopQuanLy>) => void
  onTimKiem: () => void
}

const BoLocSinhVien = ({ boLoc, onChange, onDoiBoLocNgay, onTimKiem }: BoLocSinhVienProps) => {
  const { data: gioiTinhData = [] } = useFindManyDM_GioiTinh({
    orderBy: { iSTT: "asc" },
  })

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3">
      <Input
        allowClear
        placeholder="Nhập MSSV hoặc họ tên sinh viên"
        prefix={<Search size={16} className="text-gray-400" />}
        value={boLoc.tuKhoa}
        onChange={(e) => onChange({ tuKhoa: e.target.value })}
        onPressEnter={onTimKiem}
        className="h-10 min-w-[240px] flex-1 text-sm"
      />

      <Button
        type="primary"
        icon={<Search size={16} />}
        onClick={onTimKiem}
        className="flex h-10 items-center gap-2 bg-cgv-green-dark hover:!bg-cgv-green-dark/90"
      >
        Tìm kiếm
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Trạng thái:</span>
        <Select
          value={boLoc.trangThai}
          onChange={(value) => onDoiBoLocNgay({ trangThai: value })}
          className="min-w-[140px]"
          options={[
            { value: "tat_ca", label: "Tất cả" },
            ...Object.entries(FIXED_CLASS_STUDENT_STATUS).map(([value, item]) => ({
              value,
              label: item.label,
            })),
          ]}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Giới tính:</span>
        <Select
          value={boLoc.gioiTinhId}
          onChange={(value) => onDoiBoLocNgay({ gioiTinhId: value })}
          className="min-w-[120px]"
          options={[
            { value: "tat_ca", label: "Tất cả" },
            ...gioiTinhData.map((item) => ({ value: item.Id, label: item.sTen ?? item.sMa })),
          ]}
        />
      </div>
    </div>
  )
}

export default BoLocSinhVien
