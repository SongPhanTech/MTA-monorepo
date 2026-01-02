import { Select, type SelectProps, Tooltip } from 'antd'
import { useFindManyTrainingObjectTypePermission, useTrainingObjectTypeStore } from './hook'

type AntdSelectProps = SelectProps

const SelectTrainingObjectType = (props: AntdSelectProps) => {
    const { id, onSelect } = useTrainingObjectTypeStore()

    const { data: doiTuongDaoTao = [] } = useFindManyTrainingObjectTypePermission()

    // useEffect(() => {
    //     if (!id && doiTuongDaoTao.length > 0 && doiTuongDaoTao?.[0]?.id) {
    //         onSelect(doiTuongDaoTao?.[0]?.id)
    //     }
    // }, [id, doiTuongDaoTao, onSelect])

    return (
        <div className="flex items-center gap-2 font-bold">
            <Tooltip title="Đối tượng đào tạo">
                <p>ĐTĐT</p>
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
