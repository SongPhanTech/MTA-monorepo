import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutDiplomaType } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useDiplomaVerificationStatusOptions } from '@hooks/diplomaVerificationStatus'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountDiplomaVerificationApplication,
    useFindManyDiplomaVerificationApplication,
    useUpdateDiplomaType,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import { BookPlus } from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function QLDONDANGKY() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const {
        diplomaVerificationStatusOptions,
        getDiplomaVerificationStatusLabel,
        getDiplomaVerificationStatusColor,
    } = useDiplomaVerificationStatusOptions()
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        idCardNumber: undefined,
        dateOfBirth: undefined,
        phone: undefined,
        email: undefined,
        diplomaVerificationStatus: undefined,
    })

    const where = useMemo(
        () => ({
            ...(filters.name && filters.name !== ''
                ? {
                      fullname: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.idCardNumber && filters.idCardNumber !== ''
                ? {
                      idCardNumber: {
                          contains: filters.idCardNumber,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.phone && filters.phone !== ''
                ? {
                      phoneNumber: {
                          contains: filters.phone,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.email && filters.email !== ''
                ? {
                      email: {
                          contains: filters.email,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.dateOfBirth?.length === 2
                ? {
                      dateOfBirth: {
                          gte: dayjs(filters.dateOfBirth?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.dateOfBirth?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.diplomaVerificationStatus
                ? Array.isArray(filters.diplomaVerificationStatus)
                    ? {
                          status: {
                              in: filters.diplomaVerificationStatus,
                          },
                      }
                    : {
                          status: {
                              equals: filters.diplomaVerificationStatus,
                          },
                      }
                : {}),
        }),
        [
            filters.name,
            filters.idCardNumber,
            filters.phone,
            filters.email,
            filters.dateOfBirth,
            filters.diplomaVerificationStatus,
        ]
    )

    const { data = [], refetch } = useFindManyDiplomaVerificationApplication({
        where,
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountDiplomaVerificationApplication({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen: onOpenPutDiplomaType } = useDisclosure<string>({
        tag: PutDiplomaType.name,
    })

    const handleModal = () => {
        onOpenPutDiplomaType()
    }

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateDiplomaType } = useUpdateDiplomaType()
    async function handleDeleteDiplomaType(id: string) {
        try {
            showSpinner()
            await updateDiplomaType({
                where: { id },
                data: { deletedAt: new Date() },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24}>
                            <Flex justify="end" gap={4}>
                                <Button onClick={handleModal} type="primary">
                                    <BookPlus />
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        filters={filters}
                        setFilters={setFilters}
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
                                title: 'Họ và tên',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
                                render: (_, record) => record?.fullname,
                            },
                            {
                                title: 'Căn cước công dân',
                                dataIndex: 'idCardNumber',
                                width: 170,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Ngày sinh',
                                dataIndex: 'dateOfBirth',
                                width: 150,
                                align: 'center',
                                type: 'date',
                                render: (value) => dayjs(value).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Số điện thoại',
                                dataIndex: 'phone',
                                width: 150,
                                align: 'center',
                                type: 'input',
                                render: (_, record) => record?.phoneNumber,
                            },
                            {
                                title: 'Email',
                                dataIndex: 'email',
                                width: 200,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Lý do nộp đơn',
                                dataIndex: 'reason',
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'diplomaVerificationStatus',
                                align: 'center',
                                fixed: 'right',
                                width: 150,
                                type: 'select',
                                options: diplomaVerificationStatusOptions,
                                render: (__, record) => {
                                    return (
                                        <Tag
                                            color={getDiplomaVerificationStatusColor(
                                                record?.status
                                            )}
                                        >
                                            {getDiplomaVerificationStatusLabel(record?.status)}
                                        </Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenPutDiplomaType(record?.id)
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleDeleteDiplomaType(record?.id)
                                                            e?.stopPropagation()
                                                        },
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={data}
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

QLDONDANGKY.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
