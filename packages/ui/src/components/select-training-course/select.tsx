import { useFindManyTrainingCourse } from '@workspace/db/hooks'
import { Select, type SelectProps } from 'antd'
import { useTrainingCourseStore } from './hook'
import { useTrainingObjectTypeStore } from '../select-training-object-type'

type AntdSelectProps = SelectProps

const SelectTrainingCourse = (props: AntdSelectProps) => {
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
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
        },
        {
            enabled: !!trainingObjectTypeId,
        }
    )
    const { id, onSelect } = useTrainingCourseStore()

    return (
        <Select
            placeholder="Chọn khóa đào tạo"
            options={khoaDaoTao.map((e) => ({
                label: e.name,
                value: e.id,
            }))}
            allowClear={false}
            style={{ width: 200 }}
            {...props}
            value={id}
            onChange={onSelect}
        />
    )
}

export { SelectTrainingCourse }
