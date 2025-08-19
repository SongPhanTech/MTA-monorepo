import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useCouncilRoleOptions } from '@hooks/councilRole'
import { usePaymentStatusOptions } from '@hooks/paymentStatus'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountPaymentRecord,
    useFindManyPaymentRecord,
    useUpdateExpertProfile,
} from '@workspace/db/hooks'
import { Col, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import type React from 'react'
import { useState } from 'react'

export default function PaymentRecordPage() {
    const { getPaymentStatusColor, getPaymentStatusLabel } = usePaymentStatusOptions()
    const { getCouncilRoleLabel } = useCouncilRoleOptions()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({})

    // const where = useMemo(
    //     () => ({
    //         ...(filters.code
    //             ? { code: { contains: filters.code, mode: 'insensitive' as const } }
    //             : {}),
    //         ...(filters.name
    //             ? { name: { contains: filters.name, mode: 'insensitive' as const } }
    //             : {}),
    //         ...(filters.academicRank
    //             ? { academicRank: { contains: filters.academicRank, mode: 'insensitive' as const } }
    //             : {}),
    //         ...(filters.academicDegree
    //             ? {
    //                   academicDegree: {
    //                       contains: filters.academicDegree,
    //                       mode: 'insensitive' as const,
    //                   },
    //               }
    //             : {}),
    //         ...(filters.specialization
    //             ? {
    //                   specialization: {
    //                       contains: filters.specialization,
    //                       mode: 'insensitive' as const,
    //                   },
    //               }
    //             : {}),
    //         ...(filters.workplace
    //             ? { workplace: { contains: filters.workplace, mode: 'insensitive' as const } }
    //             : {}),
    //         ...(filters.phone
    //             ? { phone: { contains: filters.phone, mode: 'insensitive' as const } }
    //             : {}),
    //         ...(filters.email
    //             ? { email: { contains: filters.email, mode: 'insensitive' as const } }
    //             : {}),
    //     }),
    //     [
    //         filters.code,
    //         filters.name,
    //         filters.academicRank,
    //         filters.academicDegree,
    //         filters.specialization,
    //         filters.workplace,
    //         filters.phone,
    //         filters.email,
    //     ]
    // )

    const { data: paymentRecordData } = useFindManyPaymentRecord({
        include: {
            expert: true,
            councilMember: true,
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountPaymentRecord({})

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateExpertProfile } = useUpdateExpertProfile()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateExpertProfile({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
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
                                dataIndex: ['expert', 'name'],
                                width: 150,
                                type: 'input',
                                align: 'center',
                            },
                            {
                                title: 'Vai trò',
                                align: 'center',
                                width: 150,
                                render: (record) => (
                                    <div>{getCouncilRoleLabel(record.councilMember.role)}</div>
                                ),
                            },
                            {
                                title: 'Mã giao dịch',
                                dataIndex: 'transactionCode',
                                width: 150,
                                align: 'center',
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
                                render: (_, record) =>
                                    record?.paymentDate
                                        ? dayjs(record?.paymentDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'status',
                                width: 150,
                                align: 'center',
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
