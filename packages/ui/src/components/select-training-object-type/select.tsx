import { type SelectProps, Tooltip } from 'antd'
import { Select } from '../commons'
import { useFindManyTrainingObjectTypePermission, useTrainingObjectTypeStore } from './hook'

type SelectTrainingObjectTypeProps = SelectProps & {
    subsystem?: string
}

const SelectTrainingObjectType = ({ subsystem, ...props }: SelectTrainingObjectTypeProps) => {
    const { id, onSelect } = useTrainingObjectTypeStore()

    const { data: doiTuongDaoTao = [] } = useFindManyTrainingObjectTypePermission(undefined, {
        subsystem,
    })

    // useEffect(() => {
    //     if (!id && doiTuongDaoTao.length > 0 && doiTuongDaoTao?.[0]?.id) {
    //         onSelect(doiTuongDaoTao?.[0]?.id)
    //     }
    // }, [id, doiTuongDaoTao, onSelect])

    return (
        <div className="flex items-center gap-2 font-bold">
            <Tooltip title="Đối tượng đào tạo">
                <p>Đối tượng đào tạo</p>
            </Tooltip>
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
