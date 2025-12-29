import { useFindManyTrainingObjectType } from '@workspace/db/hooks'
import { useGetUserPermissionsAccessLevelAppCodeUserId } from '@workspace/libs/api/system'
import { Select, type SelectProps, Tooltip } from 'antd'
import { useMemo } from 'react'
import { getRuntimeEnv, isDevEnvironment } from '../../../../libs/src/utils'
import { useTrainingObjectTypeStore } from './hook'

type AntdSelectProps = SelectProps

const SelectTrainingObjectType = (props: AntdSelectProps) => {
    const { id, onSelect } = useTrainingObjectTypeStore()

    const { data: permission } = useGetUserPermissionsAccessLevelAppCodeUserId(
        getRuntimeEnv('NEXT_PUBLIC_APP_CODE'),
        window?.contextData?.userId ?? ''
    )

    const permissions = useMemo(() => {
        if (permission?.status !== 200) return []
        return (permission?.data as any)?.Roles || []
    }, [permission])
    console.log('permissions', permissions, permission)

    const { data: doiTuongDaoTao = [] } = useFindManyTrainingObjectType({
        where: {
            active: true,
            ...(isDevEnvironment()
                ? {}
                : {
                      vaiTro: {
                          hasSome: permissions.map((item: any) => item.sRoleId).filter(Boolean),
                      },
                  }),
        },
        orderBy: { name: 'asc' },
    })

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
