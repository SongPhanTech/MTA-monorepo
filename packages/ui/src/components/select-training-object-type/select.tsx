import { useFindManyTrainingObjectType } from '@workspace/db/hooks'
import { Select, type SelectProps, Tooltip } from 'antd'
import { useTrainingObjectTypeStore } from './hook'
import {
    useGetDMVaiTros,
    useGetUserPermissionsAccessLevelAppCodeUserId,
} from '@workspace/libs/api/system'
import { useMemo } from 'react'
import type { GetDMVaiTroDTO } from '@workspace/libs/api/schemas'
import { getRuntimeEnv, isDevEnvironment } from '../../../../libs/src/utils'

type AntdSelectProps = SelectProps

const SelectTrainingObjectType = (props: AntdSelectProps) => {
    const { id, onSelect } = useTrainingObjectTypeStore()

    const { data: role } = useGetDMVaiTros()

    const { data: permission } = useGetUserPermissionsAccessLevelAppCodeUserId(
        getRuntimeEnv('NEXT_PUBLIC_APP_CODE'),
        window?.contextData?.userId ?? ''
    )

    const roles = useMemo(() => {
        if (role?.status !== 200) return []
        return role?.data as unknown as GetDMVaiTroDTO[]
    }, [role])

    const permissions = useMemo(() => {
        if (permission?.status !== 200) return []
        return permission?.data?.Roles || []
    }, [permission])

    const { data: doiTuongDaoTao = [] } = useFindManyTrainingObjectType({
        where: {
            active: true,
            ...(isDevEnvironment()
                ? {}
                : {
                      vaiTro: { array_contains: roles.map((item) => item.sRoleId).filter(Boolean) },
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
