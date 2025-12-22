import { useFindManyTrainingCourse, useFindUniqueSemester } from '@workspace/db/hooks'
import { Select, type SelectProps } from 'antd'
import { useSemesterStore } from '../select-semester'
import { useTrainingObjectTypeStore } from '../select-training-object-type'
import { useTrainingCourseStore } from './hook'

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
            placeholder="Chọn khoá đào tạo"
            options={khoaDaoTao.map((e) => {
                let semesterIdx = null
                if (semester?.semesterType) {
                    const idx =
                        (semester.schoolYear.startDate.getFullYear() -
                            e.semesterStart.schoolYear.startDate.getFullYear()) *
                            2 +
                        (semester.semesterType === 'FIRST' ||
                        semester.semesterType === 'FIRST_SUPPLEMENTARY'
                            ? 1
                            : 2)

                    semesterIdx = idx > 0 && idx <= 12 ? idx : null
                }

                return {
                    label: (
                        <span>
                            {e.name}
                            {semesterIdx ? (
                                <span className="text-gray-600 italic"> (HK{semesterIdx})</span>
                            ) : (
                                ''
                            )}
                        </span>
                    ),
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

export { SelectTrainingCourse }
