import { useFindManyTrainingCourse, useFindUniqueSemester } from '@workspace/db/hooks'
import { Select, type SelectProps } from 'antd'
import { useTrainingCourseStore } from './hook'
import { useTrainingObjectTypeStore } from '../select-training-object-type'
import { useSemesterStore } from '../select-semester'

type AntdSelectProps = SelectProps

const SelectTrainingCourse = (props: AntdSelectProps) => {
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { id: semesterId } = useSemesterStore()

    const { data: khoaDaoTao = [] } = useFindManyTrainingCourse(
        {
            orderBy: {
                createdAt: 'desc',
            },
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

    return (
        <Select
            placeholder="Chọn khóa đào tạo"
            options={khoaDaoTao.map((e) => {
                const semesterIdx = semester?.semesterType
                    ? (semester.schoolYear.startDate.getFullYear() -
                          e.semesterStart.schoolYear.startDate.getFullYear()) *
                          2 +
                      (semester.semesterType === 'FIRST' ||
                      semester.semesterType === 'FIRST_SUPPLEMENTARY'
                          ? 1
                          : 2)
                    : null

                return {
                    label: (
                        <span>
                            {e.name}
                            {semesterIdx && (
                                <span className="text-gray-600 italic"> (HK{semesterIdx})</span>
                            )}
                        </span>
                    ),
                    value: e.id,
                }
            })}
            allowClear={false}
            style={{ width: 200 }}
            {...props}
            value={id}
            onChange={onSelect}
        />
    )
}

export { SelectTrainingCourse }
