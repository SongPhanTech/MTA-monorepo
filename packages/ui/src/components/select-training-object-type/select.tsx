import { useFindManyTrainingObjectType } from '@workspace/db/hooks'
import { Select, type SelectProps } from 'antd'
import { useTrainingObjectTypeStore } from './hook'

type AntdSelectProps = SelectProps

const SelectTrainingObjectType = (props: AntdSelectProps) => {
    const { data: doiTuongDaoTao = [] } = useFindManyTrainingObjectType({
        orderBy: {
            name: 'asc',
        },
    })
    const { id, onSelect } = useTrainingObjectTypeStore()
    return (
        <div className="flex items-center space-x-2">
            <p>Đối tượng đào tạo</p>
            <Select
                placeholder="Chọn đối tượng đào tạo"
                options={doiTuongDaoTao.map((e) => ({
                    label: e.name,
                    value: e.id,
                }))}
                value={id}
                onChange={onSelect}
                allowClear={false}
                className="w-60"
                {...props}
            />
        </div>
    )
}

export { SelectTrainingObjectType }
