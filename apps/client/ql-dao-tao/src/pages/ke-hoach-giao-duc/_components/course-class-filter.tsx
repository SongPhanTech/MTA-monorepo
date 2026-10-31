import { $Enums } from "@workspace/db/client"
import { useFindManyFixedClass, useFindUniqueTrainingCourse } from "@workspace/db/hooks"
import {
  Select,
  SelectTrainingCourseStore,
  useFixedClassStore,
  useTrainingCourseStore,
  useTrainingMajorStore,
  useTrainingObjectTypeStore,
} from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"
import { Flex } from "antd"
import { Info } from "lucide-react"

export function FixedClassSelect({
  className,
  getPopupContainer,
}: {
  className?: string
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement
}) {
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: trainingMajorId } = useTrainingMajorStore()
  const { id: fixedClassId, onSelect: onSelectFixedClass } = useFixedClassStore()
  const { id: trainingCourseId } = useTrainingCourseStore()

  const { data: fixedClassData = [] } = useFindManyFixedClass({
    orderBy: { name: "asc" },
    where: {
      deletedAt: null,
      active: true,
      trainingCourse: {
        trainingObjectTypeId,
        id: trainingCourseId,
      },
      curriculumVersion: {
        curriculum: {
          trainingMajorId,
        },
      },
    },
  })

  return (
    <Select
      placeholder="Chọn lớp quản lý"
      options={fixedClassData.map((i) => ({
        value: i.id,
        label: [i.code, i.name].filter(Boolean).join(" - "),
      }))}
      value={fixedClassId}
      onChange={onSelectFixedClass}
      className={className}
      popupMatchSelectWidth={false}
      getPopupContainer={getPopupContainer}
      allowClear
    />
  )
}

export default function CourseClassFilter({
  className,
  type,
  showFixedClass = true,
}: {
  className?: string
  type?: $Enums.SubjectClassType
  showFixedClass?: boolean
}) {
  const { id: trainingCourseId } = useTrainingCourseStore()

  const { data: trainingCourse } = useFindUniqueTrainingCourse(
    {
      where: { id: trainingCourseId },
      select: { name: true, isRetakeExam: true },
    },
    { enabled: type === $Enums.SubjectClassType.REEXAM && !!trainingCourseId }
  )
  const reExamNotAllowed =
    type === $Enums.SubjectClassType.REEXAM && !!trainingCourse && !trainingCourse.isRetakeExam

  return (
    <Flex gap={8} align="center" className={cn("flex-nowrap shrink-0", className)}>
      <SelectTrainingCourseStore className="w-[200px] xl:w-[240px]" style={{}} />
      {showFixedClass && <FixedClassSelect className="w-[200px] xl:w-[240px]" />}
      {reExamNotAllowed && (
        <Flex
          gap={8}
          align="center"
          className="h-8 rounded-md border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-800"
        >
          <Info size={14} className="shrink-0 text-amber-600" />
          <span className="whitespace-nowrap">{trainingCourse.name} không được thi lại</span>
        </Flex>
      )}
    </Flex>
  )
}
