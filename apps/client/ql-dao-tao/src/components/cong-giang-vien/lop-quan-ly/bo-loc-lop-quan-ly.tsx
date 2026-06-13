import type { BoLocLopQuanLy } from "@components/cong-giang-vien/lop-quan-ly/types"
import { useFixedClassTypeOptions } from "@hooks/fixedClassType"
import { useFindManySchoolYear } from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import { Button, Input, Select } from "antd"
import { Search } from "lucide-react"
import { useMemo } from "react"

interface BoLocLopQuanLyProps {
  boLoc: BoLocLopQuanLy
  onChange: (capNhat: Partial<BoLocLopQuanLy>) => void
  onDoiLoaiLop: (loaiLop: BoLocLopQuanLy["loaiLop"]) => void
  onTimKiem: () => void
}

const BoLocLopQuanLyBar = ({ boLoc, onChange, onDoiLoaiLop, onTimKiem }: BoLocLopQuanLyProps) => {
  const { id: semesterId, onSelect } = useSemesterStore()
  const { options: loaiLopOptions } = useFixedClassTypeOptions()

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

      <Input
        allowClear
        placeholder="Nhập mã lớp hoặc tên lớp"
        value={boLoc.tuKhoa}
        onChange={(e) => onChange({ tuKhoa: e.target.value })}
        onPressEnter={onTimKiem}
        className="h-10 min-w-[220px] flex-1 text-sm"
      />

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Loại lớp:</span>
        <Select
          value={boLoc.loaiLop}
          onChange={onDoiLoaiLop}
          className="min-w-[160px]"
          options={[
            { value: "tat_ca", label: "Tất cả" },
            ...loaiLopOptions.map((item) => ({ value: item.value, label: item.label })),
          ]}
        />
      </div>

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

export default BoLocLopQuanLyBar
