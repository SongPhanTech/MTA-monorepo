import type { BoLocLopTroGiang } from "@components/cong-giang-vien/lop-tro-giang/types"
import { useFindManySchoolYear } from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import { Button, Input, Select } from "antd"
import { Search } from "lucide-react"
import { useMemo } from "react"

interface BoLocLopTroGiangProps {
  boLoc: BoLocLopTroGiang
  onChange: (capNhat: Partial<BoLocLopTroGiang>) => void
  onDoiTrangThai: (trangThai: BoLocLopTroGiang["trangThai"]) => void
  onTimKiem: () => void
}

const TRANG_THAI_OPTIONS = [
  { value: "tat_ca", label: "Tất cả" },
  { value: "dang_dien_ra", label: "Đang diễn ra" },
  { value: "sap_bat_dau", label: "Sắp bắt đầu" },
  { value: "chua_bat_dau", label: "Chưa bắt đầu" },
]

const BoLocLopTroGiangBar = ({
  boLoc,
  onChange,
  onDoiTrangThai,
  onTimKiem,
}: BoLocLopTroGiangProps) => {
  const { id: semesterId, onSelect } = useSemesterStore()

  const { data: schoolYears = [], isLoading } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
    include: { semesters: { orderBy: { createdAt: "desc" } } },
  })

  const selectedYearId = useMemo(
    () => schoolYears.find((year) => year.semesters.some((s) => s.id === semesterId))?.id,
    [schoolYears, semesterId]
  )

  const semestersOfYear = useMemo(
    () => schoolYears.find((year) => year.id === selectedYearId)?.semesters ?? [],
    [schoolYears, selectedYearId]
  )

  const handleChangeYear = (yearId: string) => {
    const year = schoolYears.find((item) => item.id === yearId)
    const firstSemester = year?.semesters?.[0]
    if (firstSemester) onSelect(firstSemester.id)
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Năm học:</span>
        <Select
          loading={isLoading}
          placeholder="Chọn năm học"
          className="min-w-[140px]"
          value={selectedYearId}
          onChange={handleChangeYear}
          options={schoolYears.map((year) => ({ value: year.id, label: year.name }))}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Học kỳ:</span>
        <Select
          placeholder="Chọn học kỳ"
          className="min-w-[140px]"
          value={semesterId}
          onChange={(value) => onSelect(value)}
          options={semestersOfYear.map((semester) => ({
            value: semester.id,
            label: semester.name,
          }))}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Trạng thái:</span>
        <Select
          value={boLoc.trangThai}
          onChange={onDoiTrangThai}
          className="min-w-[160px]"
          options={TRANG_THAI_OPTIONS}
        />
      </div>

      <Input
        allowClear
        placeholder="Tìm kiếm mã học phần, tên học phần, giảng viên phụ trách..."
        value={boLoc.tuKhoa}
        onChange={(e) => onChange({ tuKhoa: e.target.value })}
        onPressEnter={onTimKiem}
        className="h-10 min-w-[260px] flex-1 text-sm"
      />

      <Button
        type="primary"
        icon={<Search size={16} />}
        onClick={onTimKiem}
        className="ml-auto flex h-10 items-center gap-2 bg-cgv-green-dark hover:!bg-cgv-green-dark/90"
      >
        Tìm kiếm
      </Button>
    </div>
  )
}

export default BoLocLopTroGiangBar
