import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutPaymentRecordDetail } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useCouncilRoleOptions } from '@hooks/councilRole'
import { usePaymentStatusOptions } from '@hooks/paymentStatus'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountPaymentRecord,
    useDeletePaymentRecord,
    useFindManyPaymentRecord,
} from '@workspace/db/hooks'
import { Col, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PaymentRecordPage() {
    const { getPaymentStatusColor, getPaymentStatusLabel, paymentStatusOptions } =
        usePaymentStatusOptions()
    const { getCouncilRoleLabel, councilRoleOptions } = useCouncilRoleOptions()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [filters, setFilters] = useState<FilterProps>({
        name: undefined,
        transactionCode: undefined,
        paymentStatus: undefined,
        paymentDate: undefined,
        role: undefined,
    })

    const where = useMemo(
        () => ({
            ...(filters.transactionCode
                ? {
                      transactionCode: {
                          contains: filters.transactionCode,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.name
                ? { expert: { name: { contains: filters.name, mode: 'insensitive' as const } } }
                : {}),
            ...(filters.paymentStatus
                ? Array.isArray(filters.paymentStatus)
                    ? { status: { in: filters.paymentStatus } }
                    : { status: { equals: filters.paymentStatus } }
                : {}),
            ...(filters.role
                ? Array.isArray(filters.role)
                    ? { councilMember: { role: { in: filters.role } } }
                    : { councilMember: { role: { equals: filters.role } } }
                : {}),
            ...(filters.paymentDate?.length === 2
                ? {
                      paymentDate: {
                          gte: dayjs(filters.paymentDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.paymentDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
        }),
        [
            filters.name,
            filters.transactionCode,
            filters.paymentStatus,
            filters.paymentDate,
            filters.role,
        ]
    )

    const { data: paymentRecordData } = useFindManyPaymentRecord({
        where,
        include: {
            expert: true,
            councilMember: {
                include: {
                    council: {
                        include: {
                            thesis: true,
                        },
                    },
                },
            },
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountPaymentRecord({ where })

    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen: openPaymentRecord } = useDisclosure<{ paymentRecordId: string }>({
        tag: PutPaymentRecordDetail.name,
    })

    const { mutateAsync: deletePaymentRecord } = useDeletePaymentRecord()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await deletePaymentRecord({
                where: {
                    id,
                },
            })
            message.success('Xóa thành công')
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="payment-record"
                        filters={filters}
                        setFilters={setFilters}
                        data={paymentRecordData}
                        rowSelection={{
                            selectedRowKeys,
                            onChange: setSelectedRowKeys,
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên chuyên gia',
                                dataIndex: 'name',
                                width: 150,
                                type: 'input',
                                align: 'center',
                                render: (_, record) => record.expert.name,
                            },
                            {
                                title: 'Vai trò',
                                dataIndex: 'role',
                                align: 'center',
                                width: 150,
                                type: 'select',
                                options: councilRoleOptions,
                                render: (_, record) => (
                                    <div>{getCouncilRoleLabel(record.councilMember.role)}</div>
                                ),
                            },
                            {
                                title: 'Đề tài',
                                dataIndex: 'thesis',
                                width: 150,
                                align: 'center',
                                type: 'input',
                                render: (_, record) => record.councilMember.council.thesis[0].title,
                            },
                            {
                                title: 'Mã giao dịch',
                                dataIndex: 'transactionCode',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Số tiền thanh toán',
                                dataIndex: 'amount',
                                width: 150,
                                align: 'center',
                                render: (record) => record?.toString(),
                            },
                            {
                                title: 'Thời gian thanh toán',
                                dataIndex: 'paymentDate',
                                align: 'center',
                                width: 160,
                                type: 'date',
                                render: (_, record) =>
                                    record?.paymentDate
                                        ? dayjs(record?.paymentDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'paymentStatus',
                                width: 150,
                                align: 'center',
                                type: 'select',
                                options: paymentStatusOptions,
                                render: (_, record) => {
                                    const label = getPaymentStatusLabel(record?.status)
                                    const color = getPaymentStatusColor(record?.status)
                                    return <Tag color={color}>{label}</Tag>
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={() => {
                                                        openPaymentRecord({
                                                            paymentRecordId: id,
                                                        })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () => handleDelete(id),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
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
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

PaymentRecordPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
