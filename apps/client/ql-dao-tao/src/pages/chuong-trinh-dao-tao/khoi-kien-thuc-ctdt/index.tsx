import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { Prisma } from '@workspace/db'
import {
    useCountTrainingBlock,
    useFindManyTrainingBlock,
    useUpdateTrainingBlock,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import _ from 'lodash'
import { BookPlus } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type TrainingBlockType = Prisma.TrainingBlockGetPayload<{
    include: {
        curriculumVersions: {
            include: {
                subjects: {
                    include: {
                        subject: {
                            select: {
                                credit: true
                                period: true
                            }
                        }
                    }
                }
            }
        }
    }
}>

export default function TrainingBlock() {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: undefined,
        name: undefined,
        active: undefined,
    })

    const { data: trainingBlockData, refetch } = useFindManyTrainingBlock({
        where: {
            ...(filters.code ? { code: { contains: filters.code, mode: 'insensitive' } } : {}),
            ...(filters.name ? { name: { contains: filters.name, mode: 'insensitive' } } : {}),
            ...(filters.active?.length === 1 ? { active: filters.active[0] } : {}),
        },
        include: {
            curriculumVersions: {
                include: {
                    curriculumVersion: true,
                    subjects: {
                        include: {
                            subject: {
                                select: {
                                    credit: true,
                                    period: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            priority: 'asc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    console.log(trainingBlockData)

    const { data: count, refetch: refetchCount } = useCountTrainingBlock({
        where: {
            ...(filters.code ? { code: { contains: filters.code, mode: 'insensitive' } } : {}),
            ...(filters.name ? { name: { contains: filters.name, mode: 'insensitive' } } : {}),
            ...(filters.active?.length === 1
                ? {
                      ...(filters.active.length === 1 ? { active: filters.active[0] } : {}),
                  }
                : {}),
            deletedAt: null,
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<string>({
        tag: 'PutTrainingBlock',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateTrainingBlock } = useUpdateTrainingBlock()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateTrainingBlock({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa thành công')
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

    const calculateTotal = (record: TrainingBlockType, field: 'credit' | 'period') => {
        const curriculumVersion = record.curriculumVersions?.[0]

        if (!curriculumVersion?.subjects) {
            return 0
        }

        return curriculumVersion.subjects.reduce((sum, tbs) => {
            const value = field === 'credit' ? tbs.subject?.credit || 0 : tbs.subject?.period || 0
            return sum + value
        }, 0)
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={6}>
                            <Flex justify="end">
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
                                    'THEM'
                                ) && (
                                    <Button onClick={handleModal} type="primary">
                                        <BookPlus />
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
                        id="training-block"
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        scroll={{ y: '75vh' }}
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
                                title: 'Mã khối kiến thức',
                                dataIndex: 'code',
                                align: 'center',
                                width: 250,
                                type: 'input',
                            },
                            {
                                title: 'Tên khối kiến thức',
                                dataIndex: 'name',
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Tổng số tín chỉ',
                                width: 150,
                                align: 'center',
                                render: (_, record) => {
                                    return calculateTotal(record as TrainingBlockType, 'credit')
                                },
                            },
                            {
                                title: 'Tổng số tiết',
                                width: 150,
                                align: 'center',
                                render: (_, record) => {
                                    return calculateTotal(record as TrainingBlockType, 'period')
                                },
                            },
                            // {
                            //     title: 'Tổng tín chỉ',
                            //     dataIndex: '',
                            //     width: 150,
                            // },
                            // {
                            //     title: 'Tổng tín chỉ bắt buộc',
                            //     dataIndex: 'totalRequiredCredits',
                            //     width: 150,
                            // },
                            // {
                            //     title: 'Số tín chỉ chuyên ngành',
                            //     dataIndex: 'specializedCredits',
                            //     width: 150,
                            // },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'active',
                                align: 'center',
                                width: 140,
                                options: [
                                    { label: 'Đang đào tạo', value: true },
                                    { label: 'Ngừng đào tạo', value: false },
                                ],
                                type: 'select',
                                fixed: 'right',
                                render: (record) => {
                                    return !record ? (
                                        <Tag color="error">Ngừng đào tạo</Tag>
                                    ) : (
                                        <Tag color="success">Đang đào tạo</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
                                                    'SUA'
                                                ) && (
                                                    <EditIcon
                                                        onClick={onOpen.bind(null, id)}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                )}
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
                                                    'XOA'
                                                ) && (
                                                    <DeleteIcon
                                                        popConfirm={{
                                                            onConfirm: () => handleDelete(id),
                                                        }}
                                                    />
                                                )}
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
                        data={trainingBlockData}
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingBlock.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
