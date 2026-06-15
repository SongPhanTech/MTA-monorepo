import { useFindManySchoolYear } from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import { Button, DatePicker, Select } from "antd"
import type { Dayjs } from "dayjs"
import { useMemo } from "react"

interface OptionItem {
  value: string
  label: string
}

interface BoLocDiemDanhProps {
  monHocId?: string
  lopId?: string
  ngay: Dayjs
  monHocOptions: OptionItem[]
  lopOptions: OptionItem[]
  dangTaiLop?: boolean
  onDoiMonHoc: (value?: string) => void
  onDoiLop: (value?: string) => void
  onDoiNgay: (value: Dayjs) => void
  onLayDanhSach: () => void
}

const BoLocDiemDanh = ({
  monHocId,
  lopId,
  ngay,
  monHocOptions,
  lopOptions,
  dangTaiLop,
  onDoiMonHoc,
  onDoiLop,
  onDoiNgay,
  onLayDanhSach,
}: BoLocDiemDanhProps) => {
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
    <div className="flex shrink-0 flex-wrap items-end gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-gray-600">Năm học</span>
        <Select
          loading={isLoading}
          placeholder="Chọn năm học"
          className="min-w-[140px]"
          value={selectedYearId}
          onChange={handleChangeYear}
          options={schoolYears.map((year) => ({ value: year.id, label: year.name }))}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-gray-600">Học kỳ</span>
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

      <div className="flex flex-col gap-1">
        <span className="text-sm text-gray-600">Môn học</span>
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          loading={dangTaiLop}
          placeholder="Chọn môn học"
          className="min-w-[200px]"
          value={monHocId}
          onChange={onDoiMonHoc}
          options={monHocOptions}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-gray-600">Lớp</span>
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Chọn lớp"
          className="min-w-[160px]"
          value={lopId}
          onChange={onDoiLop}
          options={lopOptions}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-gray-600">Ngày</span>
        <DatePicker
          allowClear={false}
          format="DD/MM/YYYY"
          value={ngay}
          onChange={(value) => value && onDoiNgay(value)}
          className="min-w-[150px]"
        />
      </div>

      <Button
        type="primary"
        onClick={onLayDanhSach}
        className="flex h-8 items-center bg-cgv-green-dark hover:!bg-cgv-green-dark/90"
      >
        Lấy danh sách
      </Button>
    </div>
  )
}

export default BoLocDiemDanh
