import {
    NestedCollapsibleTable,
    type NestedColumn,
} from '@components/commons/nested-collapsible-table'
// import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { Prisma } from '@workspace/db/client'
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

interface TreeNode {
    id: string
    code: string
    name: string
    active: boolean
    description: string | null
    priority: number
    parentId: string | null
    children?: TreeNode[]
    createdAt?: string
    updatedAt?: string
}
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
        // take: numberOfPages,
        // skip: (currentPage - 1) * numberOfPages,
    })

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
    const treeColumns: NestedColumn<TrainingBlockType>[] = [
        {
            title: 'Mã khối kiến thức',
            dataIndex: 'code',
            width: 150,
            align: 'center',
        },
        {
            title: 'Tên khối kiến thức',
            dataIndex: 'name',
            align: 'center',
        },
        {
            title: 'Tổng số tín chỉ',
            align: 'center',
            render: (_: any, record: TrainingBlockType) => calculateTotal(record, 'credit') || 0,
        },
        {
            title: 'Tổng số tiết',
            align: 'center',
            render: (_: any, record: TrainingBlockType) => calculateTotal(record, 'period') || 0,
        },
        {
            title: 'Trạng thái',
            align: 'center',
            width: 150,

            dataIndex: 'active',
            render: (_: any, record: TrainingBlockType) => {
                return !record?.active ? (
                    <Tag color="error">Ngừng đào tạo</Tag>
                ) : (
                    <Tag color="success">Đang đào tạo</Tag>
                )
            },
        },
        {
            title: 'Thao tác',
            width: 150,
            align: 'center',
            className: 'no-row-click',
            hidden: !canSome(
                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
                'SUA',
                'XOA'
            ),
            render: (_: any, record: TrainingBlockType) => {
                if (record?.id) {
                    return (
                        <Row className="justify-center gap-2">
                            {can(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
                                'SUA'
                            ) && (
                                <EditIcon
                                    onClick={onOpen.bind(null, record?.id)}
                                    className="text-sm text-blue-700 cursor-pointer"
                                />
                            )}
                            {can(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
                                'XOA'
                            ) && (
                                <DeleteIcon
                                    popConfirm={{
                                        onConfirm: () => handleDelete(record?.id),
                                    }}
                                />
                            )}
                        </Row>
                    )
                }
                return ''
            },
        },
    ]
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

                <Col span={24} className="mt-2">
                    <NestedCollapsibleTable
                        filters={filters}
                        data={trainingBlockData || []}
                        columns={treeColumns}
                        mode="tree"
                        childrenKey="children"
                        defaultExpandAllRows={true}
                        rowKey="id"
                        buildFromParentId={true}
                        parentIdKey="parentId"
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingBlock.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
