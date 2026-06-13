import { useFindManySchoolYear } from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import { Button, Select } from "antd"
import { Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

interface BoLocDiemRenLuyenProps {
  semesterId: string
  onApDung: (semesterId: string) => void
}

const BoLocDiemRenLuyen = ({ semesterId, onApDung }: BoLocDiemRenLuyenProps) => {
  const { onSelect } = useSemesterStore()
  const [semesterNhap, setSemesterNhap] = useState(semesterId)

  useEffect(() => {
    setSemesterNhap(semesterId)
  }, [semesterId])

  const { data: schoolYears = [], isLoading } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
    include: { semesters: { orderBy: { createdAt: "desc" } } },
  })

  const selectedYearId = useMemo(
    () => schoolYears.find((year) => year.semesters.some((s) => s.id === semesterNhap))?.id,
    [schoolYears, semesterNhap]
  )

  const semestersOfYear = useMemo(
    () => schoolYears.find((year) => year.id === selectedYearId)?.semesters ?? [],
    [schoolYears, selectedYearId]
  )

  const handleChangeYear = (yearId: string) => {
    const year = schoolYears.find((item) => item.id === yearId)
    const firstSemester = year?.semesters?.[0]
    if (firstSemester) setSemesterNhap(firstSemester.id)
  }

  const handleTimKiem = () => {
    onSelect(semesterNhap)
    onApDung(semesterNhap)
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3">
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
          value={semesterNhap}
          onChange={setSemesterNhap}
          options={semestersOfYear.map((semester) => ({
            value: semester.id,
            label: semester.name,
          }))}
        />
      </div>

      <Button
        type="primary"
        icon={<Search size={16} />}
        onClick={handleTimKiem}
        className="ml-auto flex h-10 items-center gap-2 bg-cgv-green-dark hover:!bg-cgv-green-dark/90"
      >
        Tìm kiếm
      </Button>
    </div>
  )
}

export default BoLocDiemRenLuyen
