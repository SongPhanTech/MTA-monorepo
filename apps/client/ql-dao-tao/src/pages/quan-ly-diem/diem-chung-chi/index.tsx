import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { FilterProps } from '@constants/type'
import { useArchivedCertificateStatusOptions } from '@hooks/paymentStatus'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { formatDate } from '@lib/utils'
import {
    useCountArchivedCertificate,
    useFindManyArchivedCertificate,
    useUpdateArchivedCertificate,
} from '@workspace/db/hooks'
import { useCertificateScore } from '@workspace/libs/api/training'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { Button, Col, Flex, message, Modal, Row, Tag } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function ArchivedCertificate() {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [open, setOpen] = useState(false)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        count: undefined,
    })

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const {
        archivedCertificateStatusOptions,
        getArchivedCertificateStatusStatusLabel,
        getArchivedCertificateStatusColor,
    } = useArchivedCertificateStatusOptions()

    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen, onClose } = useDisclosure<string>({
        tag: 'PutCertificateArchivedModal',
    })

    const handleModal = () => {
        onOpen()
    }

    const { mutateAsync: updateArchivedCertificate } = useUpdateArchivedCertificate()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateArchivedCertificate({
                where: {
                    id,
                },
                data: {
                    status: 'CANCEL',
                },
            })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const where = useMemo(() => {
        return {
            ...(filters.name && filters.name !== ''
                ? {
                      certificate: {
                          name: {
                              contains: filters.name,
                              mode: 'insensitive' as const,
                          },
                      },
                  }
                : {}),
        }
    }, [filters])

    const { data: dataTable = [], refetch } = useFindManyArchivedCertificate({
        where,
        include: {
            studentSubjectScore: true,
            certificate: true,
            _count: true,
            student: {
                include: {
                    userProfile: true,
                },
            },
        },
        orderBy: [
            {
                createdAt: 'desc',
            },
        ],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { data: count } = useCountArchivedCertificate({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const rowSelection = {
        selectedRowKeys,
        getCheckboxProps: (record: any) => ({
            disabled: record.status !== 'PENDING', // disable theo điều kiện
        }),
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys)
        },
    }

    const handleOpenAprove = () => {
        Modal.confirm({
            title: 'Xác nhận',
            content: 'Bạn có chắc chắn muốn phê duyệt những giải thường được chọn không?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                handleAprove('APPROVED')
            },
        })
    }
    const handleOpenReject = () => {
        Modal.confirm({
            title: 'Xác nhận',
            content: 'Bạn có chắc chắn muốn từ chối những giải thường được chọn không?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                handleAprove('REJECTED')
            },
        })
    }
    const { mutateAsync: updateCertificateScore } = useCertificateScore()
    const handleAprove = async (status: string) => {
        try {
            if (selectedRowKeys?.length > 0) {
                // let listSqlTransaction: any = []
                // listSqlTransaction = [
                //     ...listSqlTransaction,
                //     selectedRowKeys.map((item: any) => {
                //         return {
                //             model: 'ArchivedCertificate',
                //             operation: 'update',
                //             data: {
                //                 where: {
                //                     id: item,
                //                 },
                //                 data: {
                //                     status,
                //                 },
                //             },
                //         }
                //     }),
                // ]
                // const res = await sqlTransaction(listSqlTransaction)
                const res= await updateCertificateScore({
                    data:{archivedCertificateIds:selectedRowKeys as string[]}
                })
                if (res?.status === 200) {
                    message.success('Phê duyệt thành công')
                    refetch()
                    setSelectedRowKeys([])
                    return
                }
            }
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }

    return (
        <Row gutter={[16, 0]}>
            <Col span={24}>
                <Row gutter={[16, 16]} align="top" justify="space-between">
                    <Col span={24} className="mt-3">
                        <Flex justify="end">
                            {can(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
                                'THEM'
                            ) && (
                                // <Popover
                                //         content={
                                //             <Flex vertical align="flex-start" gap={4}>
                                //                 <Button onClick={handleModal} type="primary" className="mr-3">
                                //                     Từ chối
                                //                 </Button>
                                //                   <Button onClick={handleModal} type="primary">
                                //                     Chấp thuận
                                //                 </Button>
                                //             </Flex>
                                //         }
                                //         trigger="click"
                                //         open={open}
                                //         onOpenChange={handleOpenChange}
                                //         placement="bottomLeft"
                                //         arrow={false}
                                //     >
                                //         <Button disabled={!selectedRowKeys.length}>
                                //             Phê duyệt
                                //         </Button>
                                //     </Popover>
                                <>
                                    <Button
                                        onClick={handleOpenReject}
                                        disabled={!selectedRowKeys.length}
                                        type="default"
                                    >
                                        Từ chối
                                    </Button>
                                    <Button
                                        className="ml-3"
                                        onClick={handleOpenAprove}
                                        disabled={!selectedRowKeys.length}
                                        type="primary"
                                    >
                                        Phê duyệt
                                    </Button>
                                </>
                            )}
                            {can(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
                                'THEM'
                            ) && (
                                <Button onClick={handleModal} type="primary" className="ml-3">
                                    Thêm mới
                                </Button>
                            )}
                        </Flex>
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <Table
                    rowKey="id"
                    id="training-category"
                    filters={filters}
                    setFilters={(value) => {
                        setFilters(value)
                        setCurrentPage(1)
                    }}
                    rowSelection={rowSelection}
                    columns={[
                        {
                            title: 'STT',
                            width: 50,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) =>
                                index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                            title: 'Tên chứng chỉ',
                            dataIndex: 'name',
                            align: 'center',
                            type: 'input',
                            render: (__, record) => {
                                return record?.certificate?.name || ''
                            },
                        },
                        {
                            title: 'Học viên',
                            dataIndex: 'studentName',
                            align: 'center',
                            render: (__, record) => {
                                return (
                                    `${record?.student?.userProfile?.lastName} ${record?.student?.userProfile?.firstName}` ||
                                    ''
                                )
                            },
                        },
                        {
                            title: 'Điểm CC',
                            dataIndex: 'name',
                            align: 'center',
                            type: 'input',
                            width: 100,
                            render: (__, record) => {
                                return record?.score || ''
                            },
                        },
                        {
                            title: 'Điểm quy đổi',
                            dataIndex: 'name',
                            align: 'center',
                            type: 'input',
                            width: 140,
                            render: (__, record) => {
                                return record?.finalScore || ''
                            },
                        },
                        {
                            title: 'Ngày cấp',
                            dataIndex: 'name',
                            align: 'center',
                            width: 150,
                            render: (__, record) => {
                                return record?.issuedDate ? formatDate(record?.issuedDate) : ''
                            },
                        },
                        {
                            title: 'Ngày hết hạn',
                            dataIndex: 'name',
                            align: 'center',
                            width: 150,
                            render: (__, record) => {
                                return record?.expiredDate ? formatDate(record?.expiredDate) : ''
                            },
                        },
                        {
                            title: 'Trạng thái',
                            dataIndex: 'paymentStatus',
                            width: 150,
                            align: 'center',
                            type: 'select',
                            options: archivedCertificateStatusOptions,
                            render: (_, record) => {
                                const label = getArchivedCertificateStatusStatusLabel(
                                    record?.status
                                )
                                const color = getArchivedCertificateStatusColor(record?.status)
                                return <Tag color={color}>{label}</Tag>
                            },
                        },
                        {
                            title: 'Thao tác',
                            width: 150,
                            align: 'center',
                            fixed: 'right',
                            hidden: !canSome(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
                                'SUA',
                                'XOA'
                            ),
                            render: (_, { id, _count, status }) => {
                                return (
                                    <Row className="justify-center gap-2">
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
                                            'SUA'
                                        ) &&
                                            status === 'PENDING' && (
                                                <EditIcon
                                                    onClick={onOpen.bind(null, id)}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                            )}
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
                                            'XOA'
                                        ) &&
                                            status === 'PENDING' && (
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () => handleDelete(id),
                                                    }}
                                                />
                                            )}
                                    </Row>
                                )
                            },
                        },
                    ]}
                    data={dataTable}
                    pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: count,

                        onChange: (page, pageSize) => {
                            if (numberOfPages === pageSize) {
                                setCurrentPage(page)
                            } else {
                                setCurrentPage(1)
                                setNumberOfPages(pageSize)
                            }
                        },
                        showTotal: (total, range) =>
                            `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                    }}
                />
            </Col>
        </Row>
    )
}

ArchivedCertificate.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
