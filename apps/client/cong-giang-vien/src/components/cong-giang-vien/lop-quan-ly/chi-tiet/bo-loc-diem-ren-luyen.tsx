import Select from "@components/commons/select"
import { useFindManySchoolYear } from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import { useEffect, useMemo, useState } from "react"

interface BoLocDiemRenLuyenProps {
  schoolYearId: string
  semesterId?: string
  onApDung: (params: { schoolYearId: string; semesterId?: string }) => void
}

const BoLocDiemRenLuyen = ({ schoolYearId, semesterId, onApDung }: BoLocDiemRenLuyenProps) => {
  const { onSelect } = useSemesterStore()
  const [schoolYearNhap, setSchoolYearNhap] = useState(schoolYearId)
  const [semesterNhap, setSemesterNhap] = useState<string | undefined>(semesterId)

  useEffect(() => {
    setSchoolYearNhap(schoolYearId)
  }, [schoolYearId])

  useEffect(() => {
    setSemesterNhap(semesterId)
  }, [semesterId])

  const { data: schoolYears = [], isLoading } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
    include: { semesters: { orderBy: { createdAt: "desc" } } },
  })

  const semestersOfYear = useMemo(
    () => schoolYears.find((year) => year.id === schoolYearNhap)?.semesters ?? [],
    [schoolYears, schoolYearNhap]
  )

  const handleChangeYear = (yearId: string) => {
    setSchoolYearNhap(yearId)
    setSemesterNhap(undefined)
    onApDung({ schoolYearId: yearId })
  }

  const handleChangeSemester = (id?: string) => {
    setSemesterNhap(id)
    if (id) {
      onSelect(id)
      onApDung({ schoolYearId: schoolYearNhap, semesterId: id })
      return
    }
    onApDung({ schoolYearId: schoolYearNhap })
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Năm học:</span>
        <Select
          loading={isLoading}
          placeholder="Chọn năm học"
          className="min-w-[140px]"
          value={schoolYearNhap || undefined}
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
          onChange={handleChangeSemester}
          options={semestersOfYear.map((semester) => ({
            value: semester.id,
            label: semester.name,
          }))}
        />
      </div>
    </div>
  )
}

export default BoLocDiemRenLuyen
