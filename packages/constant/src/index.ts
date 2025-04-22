import { $Enums } from '@workspace/db'
export const CONFIG_KEY = {
    USER_SESSION_TIMEOUT: 'USER_SESSION_TIMEOUT',
}

export const PERMISSION_TYPE = [
    {
        value: $Enums.PermissionType.READ,
        label: 'Xem',
    },
    {
        value: $Enums.PermissionType.CREATE,
        label: 'Thêm',
    },
    {
        value: $Enums.PermissionType.UPDATE,
        label: 'Sửa',
    },
    {
        value: $Enums.PermissionType.DELETE,
        label: 'Xóa',
    },
    {
        value: $Enums.PermissionType.DETAIL,
        label: 'Xem chi tiết',
    },
    {
        value: $Enums.PermissionType.APPROVE,
        label: 'Phê duyệt',
    },
]
export * from './libs'
