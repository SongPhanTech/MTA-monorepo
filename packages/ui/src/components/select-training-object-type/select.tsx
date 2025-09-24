import { useFindManyTrainingObjectType } from '@workspace/db/hooks'
import { Select, type SelectProps } from 'antd'
import { useEffect } from 'react'
import { useTrainingObjectTypeStore } from './hook'

type AntdSelectProps = SelectProps

const SelectTrainingObjectType = (props: AntdSelectProps) => {
    const { data: doiTuongDaoTao = [] } = useFindManyTrainingObjectType({
        orderBy: {
            name: 'asc',
        },
    })
    const { id, onSelect } = useTrainingObjectTypeStore()

    useEffect(() => {
        if (!id && doiTuongDaoTao.length > 0 && doiTuongDaoTao?.[0]?.id) {
            onSelect(doiTuongDaoTao?.[0]?.id)
        }
    }, [id, doiTuongDaoTao, onSelect])

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
                style={{ width: 200 }}
                {...props}
            />
        </div>
    )
}

export { SelectTrainingObjectType }
