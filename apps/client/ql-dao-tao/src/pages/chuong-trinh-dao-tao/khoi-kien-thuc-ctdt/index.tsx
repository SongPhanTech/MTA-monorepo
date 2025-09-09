import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutTrainingBlock } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountTrainingBlock,
    useFindManyTrainingBlock,
    useUpdateTrainingBlock,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import _ from 'lodash'
import { BookPlus } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function TrainingBlock() {
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
                },
            },
        },
        orderBy: {
            priority: 'asc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
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
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<string>({
        tag: PutTrainingBlock.name,
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
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    // const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    // const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
    //     orderBy: { name: 'asc' },
    // })
    // const { data: curriculumData = [] } = useFindManyCurriculum({
    //     orderBy: { name: 'asc' },
    // })

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={6}>
                            <Flex justify="end">
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
                        id="training-block"
                        filters={filters}
                        setFilters={setFilters}
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
                                width: 150,
                                type: 'input',
                            },
                            {
                                title: 'Tên khối kiến thức',
                                dataIndex: 'name',
                                width: 150,
                                type: 'input',
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
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={onOpen.bind(null, id)}
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
