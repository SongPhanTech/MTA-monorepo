import { useFindManyTrainingCourse, useFindUniqueSemester } from "@workspace/db/hooks"
import type { SelectProps } from "antd"
import { useEffect } from "react"
import { Select } from "../commons/select"
import { useSemesterStore } from "../select-semester"
import { useTrainingObjectTypeStore } from "../select-training-object-type"
import { selectTrainingCourse, useTrainingCourseStore } from "./hook"

export const SelectTrainingCourse = (props: SelectProps) => {
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: semesterId } = useSemesterStore()

  const { data: khoaDaoTao = [] } = useFindManyTrainingCourse(
    {
      orderBy: { semesterStart: { startDate: "desc" } },
      where: {
        deletedAt: null,
        active: true,
        trainingObjectTypeId,
      },
      include: {
        semesterStart: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            schoolYear: true,
          },
        },
      },
    },
    { enabled: !!trainingObjectTypeId }
  )

  const { data: semester } = useFindUniqueSemester(
    {
      where: { id: semesterId },
      include: {
        schoolYear: true,
      },
    },
    { enabled: !!semesterId }
  )

  return (
    <Select
      placeholder="Chọn khoá đào tạo"
      className="w-80"
      options={khoaDaoTao.map((e) => {
        let semesterIdx = null
        if (semester?.semesterType) {
          const idx =
            (semester.schoolYear.startDate.getFullYear() -
              e.semesterStart.schoolYear.startDate.getFullYear()) *
              2 +
            (semester.semesterType === "FIRST" || semester.semesterType === "FIRST_SUPPLEMENTARY"
              ? 1
              : 2)

          semesterIdx = idx > 0 && idx <= 12 ? idx : null
        }

        return {
          label: `${e.name} ${semesterIdx ? `(HK${semesterIdx})` : ""}`,
          value: e.id,
        }
      })}
      allowClear={true}
      {...props}
    />
  )
}

export const SelectTrainingCourseStore = (props: SelectProps) => {
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: semesterId } = useSemesterStore()

  const { data: khoaDaoTao = [] } = useFindManyTrainingCourse(
    {
      orderBy: { semesterStart: { startDate: "desc" } },
      where: {
        deletedAt: null,
        active: true,
        trainingObjectTypeId,
      },
      include: {
        semesterStart: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            schoolYear: true,
          },
        },
      },
    },
    {
      enabled: !!trainingObjectTypeId,
    }
  )

  const { data: semester } = useFindUniqueSemester(
    {
      where: { id: semesterId },
      include: {
        schoolYear: true,
      },
    },
    {
      enabled: !!semesterId,
    }
  )

  const { id, onSelect } = useTrainingCourseStore()

  useEffect(() => {
    if (!id || khoaDaoTao.length === 0) return
    if (!khoaDaoTao.some((e) => e.id === id)) {
      selectTrainingCourse()
    }
  }, [id, khoaDaoTao])

  return (
    <Select
      placeholder="Chọn khoá đào tạo"
      options={khoaDaoTao.map((e) => {
        let semesterIdx = null
        if (semester?.semesterType) {
          const idx =
            (semester.schoolYear.startDate.getFullYear() -
              e.semesterStart.schoolYear.startDate.getFullYear()) *
              2 +
            (semester.semesterType === "FIRST" || semester.semesterType === "FIRST_SUPPLEMENTARY"
              ? 1
              : 2)

          semesterIdx = idx > 0 && idx <= 12 ? idx : null
        }

        return {
          label: `${e.name} ${semesterIdx ? `(HK${semesterIdx})` : ""}`,
          value: e.id,
        }
      })}
      allowClear={true}
      style={{ width: 200 }}
      {...props}
      value={id}
      onChange={onSelect}
    />
  )
}
