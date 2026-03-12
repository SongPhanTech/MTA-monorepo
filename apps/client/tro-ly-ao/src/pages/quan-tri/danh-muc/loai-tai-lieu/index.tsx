import { EditOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountDocumentClassification,
    useDeleteDocumentClassification,
    useFindManyDocumentClassification,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { TRO_LY_AO_PERMISSION } from '@workspace/router'
import { Button, Input, message } from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

function Page() {
    const { can } = useAbility()
    const [filters, setFilters] = useState<{
        search: string
    }>({
        search: '',
    })
    const [tableParams, setTableParams] = useState({
        pagination: { current: 1, pageSize: 10, total: 10 },
    })

    const { onOpen: openPutClassification } = useDisclosure<string>({
        tag: 'PutDocumentClassification',
    })

    const { data: totalCountClassification = 0 } = useCountDocumentClassification()

    const { data: classifications = [] } = useFindManyDocumentClassification({
        where: {
            name: {
                contains: filters.search,
                mode: 'insensitive',
            },
        },
        skip: (tableParams.pagination.current - 1) * tableParams.pagination.pageSize,
        take: tableParams.pagination.pageSize,
        orderBy: {
            createdAt: 'desc',
        },
    })

    useEffect(() => {
        setTableParams((prev) => ({
            ...prev,
            pagination: {
                ...prev.pagination,
                total: totalCountClassification,
            },
        }))
    }, [totalCountClassification])

    const { mutateAsync: deleteClassification } = useDeleteDocumentClassification()
    const handleDeleteClassification = async (id: string) => {
        if (!id) return

        try {
            await deleteClassification({ where: { id } })
            message.success('Xoá loại tài liệu thành công')
        } catch (_error) {
            message.error('Xoá loại tài liệu thất bại')
        }
    }

    return (
        <div className="h-full">
            <div className="flex gap-4 h-full overflow-hidden">
                <div className="flex-1 overflow-auto pr-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <span className="text-xl font-semibold text-gray-700">
                                Quản lý loại tài liệu
                            </span>
                        </div>
                        {can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DANH_MUC_LOAI_TAI_LIEU, 'THEM') && (
                            <Button onClick={() => openPutClassification()} type="primary">
                                Thêm mới
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <Input
                            placeholder="Tìm kiếm theo tên loại tài liệu..."
                            allowClear
                            value={filters.search}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    search: e.target.value,
                                }))
                            }
                            onPressEnter={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    search: e.currentTarget.value,
                                }))
                            }
                            style={{ width: 400 }}
                        />
                    </div>
                    <Table
                        rowKey="id"
                        columns={[
                            {
                                title: 'STT',
                                dataIndex: 'index',
                                width: 60,
                                align: 'center',
                                render: (_, __, index) =>
                                    (tableParams.pagination.current - 1) *
                                        tableParams.pagination.pageSize +
                                    index +
                                    1,
                            },
                            {
                                title: 'Tên loại tài liệu',
                                dataIndex: 'name',
                                width: 450,
                                render: (value) => (
                                    <span className="font-medium text-gray-900">{value}</span>
                                ),
                            },
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                            },
                            {
                                title: 'Thao tác',
                                key: 'action',
                                align: 'center',
                                width: 100,
                                fixed: 'right',
                                render: (_, record) => (
                                    <div className="flex items-center justify-center gap-2">
                                        {can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DANH_MUC_LOAI_TAI_LIEU, 'SUA') && (
                                            <EditOutlined
                                                onClick={() => openPutClassification(record.id)}
                                                className="text-blue-700 cursor-pointer text-lg"
                                            />
                                        )}
                                        {can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DANH_MUC_LOAI_TAI_LIEU, 'XOA') && (
                                            <DeleteIcon
                                                popConfirm={{
                                                    title: 'Xác nhận xoá loại tài liệu?',
                                                    description: 'Hành động này sẽ không thể hoàn tác.',
                                                    onConfirm: () =>
                                                        handleDeleteClassification(record.id),
                                                }}
                                            />
                                        )}
                                    </div>
                                ),
                            },
                        ]}
                        data={classifications || []}
                        pagination={{
                            ...tableParams.pagination,
                            total: totalCountClassification,
                        }}
                        onChange={(pagination) =>
                            setTableParams({
                                pagination: {
                                    current: pagination.current ?? 1,
                                    pageSize: pagination.pageSize ?? 10,
                                    total: pagination.total ?? 0,
                                },
                            })
                        }
                    />
                </div>
            </div>
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout breadcrumbList={[{ title: 'Quản trị' }, { title: 'Loại tài liệu' }]}>
            {page}
        </DefaultLayout>
    )
}

export default Page
