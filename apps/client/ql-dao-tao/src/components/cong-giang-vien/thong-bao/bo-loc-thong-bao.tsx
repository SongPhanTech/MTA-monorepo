import type { BoLocThongBao } from "@components/cong-giang-vien/thong-bao/types"
import {
  TUY_CHON_LOAI_THONG_BAO,
  TUY_CHON_MUC_CANH_BAO,
} from "@components/cong-giang-vien/thong-bao/types"
import { Button, Input, Select } from "antd"
import { MailCheck, Search } from "lucide-react"

interface BoLocThongBaoProps {
  boLoc: BoLocThongBao
  onChange: (capNhat: Partial<BoLocThongBao>) => void
  onDanhDauTatCaDaDoc: () => void
}

const BoLocThongBao = ({ boLoc, onChange, onDanhDauTatCaDaDoc }: BoLocThongBaoProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        allowClear
        placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
        prefix={<Search size={16} className="text-gray-400" />}
        value={boLoc.tuKhoa}
        onChange={(e) => onChange({ tuKhoa: e.target.value })}
        className="h-10 min-w-[280px] flex-1 text-sm"
      />

      <Select
        value={boLoc.loai}
        onChange={(value) => onChange({ loai: value })}
        className="h-10 w-52"
        options={[
          { value: "tat_ca", label: "Tất cả loại" },
          ...TUY_CHON_LOAI_THONG_BAO.map((item) => ({
            value: item.value,
            label: item.label,
          })),
        ]}
      />

      <Select
        value={boLoc.mucCanhBao}
        onChange={(value) => onChange({ mucCanhBao: value })}
        className="h-10 w-44"
        options={TUY_CHON_MUC_CANH_BAO}
      />

      <Button
        type="primary"
        className="ml-auto flex h-10 items-center gap-2 bg-cgv-green-dark hover:!bg-cgv-green-dark/90"
        icon={<MailCheck size={16} />}
        onClick={onDanhDauTatCaDaDoc}
      >
        Đánh dấu tất cả đã đọc
      </Button>
    </div>
  )
}

export default BoLocThongBao
