import { useFindManySchoolYear } from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import { Select } from "antd"
import { useMemo } from "react"

// Bộ lọc Năm học + Học kỳ ở đầu trang, đồng bộ với store học kỳ dùng chung.
const BoLocThoiGian = () => {
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
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1">
        <span className="text-xs text-gray-500">Năm học:</span>
        <Select
          variant="borderless"
          size="small"
          loading={isLoading}
          placeholder="Chọn năm học"
          className="min-w-[120px]"
          value={selectedYearId}
          onChange={handleChangeYear}
          options={schoolYears.map((year) => ({ value: year.id, label: year.name }))}
        />
      </div>

      <div className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1">
        <span className="text-xs text-gray-500">Học kỳ:</span>
        <Select
          variant="borderless"
          size="small"
          placeholder="Chọn học kỳ"
          className="min-w-[120px]"
          value={semesterId}
          onChange={(value) => onSelect(value)}
          options={semestersOfYear.map((semester) => ({
            value: semester.id,
            label: semester.name,
          }))}
        />
      </div>
    </div>
  )
}

export default BoLocThoiGian
