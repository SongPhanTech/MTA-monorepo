import { Button } from "antd"
import { Save } from "lucide-react"

interface NutLuuDiemDanhProps {
  dangLuu?: boolean
  onLuu: () => void
}

const NutLuuDiemDanh = ({ dangLuu, onLuu }: NutLuuDiemDanhProps) => (
  <Button
    type="primary"
    loading={dangLuu}
    icon={<Save size={16} />}
    onClick={onLuu}
    className="flex h-11 w-full items-center justify-center gap-2 bg-cgv-green-dark hover:!bg-cgv-green-dark/90"
  >
    Lưu điểm danh
  </Button>
)

export default NutLuuDiemDanh
