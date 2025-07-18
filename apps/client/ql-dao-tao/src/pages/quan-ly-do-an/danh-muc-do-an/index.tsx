import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutTrainingBlock } from '@components/modal'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountThesisProject,
    useFindManyThesisProject,
    useUpdateTrainingBlock,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import { BookPlus } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function ThesisProject() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: undefined,
        name: undefined,
        active: undefined,
    })

    const { data: thesisProjectData } = useFindManyThesisProject({
        where: {
            ...(filters.code ? { code: { contains: filters.code, mode: 'insensitive' } } : {}),
            ...(filters.name ? { name: { contains: filters.name, mode: 'insensitive' } } : {}),
            ...(filters.active?.length === 1 ? { active: filters.active[0] } : {}),
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountThesisProject({
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
        }
        hideSpinner()
    }

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
                                title: 'Tên đồ án',
                                dataIndex: 'title',
                                width: 150,
                                type: 'input',
                            },
                            {
                                title: 'Tên đồ án(Tiếng Anh)',
                                dataIndex: 'titleEn',
                                width: 150,
                            },
                            {
                                title: 'Tóm tắt đồ án',
                                dataIndex: 'summary',
                                width: 150,
                            },
                            {
                                title: 'Phạm vi thực hiện',
                                dataIndex: 'scope',
                                width: 150,
                            },
                            {
                                title: 'Phương pháp thực hiện',
                                dataIndex: 'methodology',
                                width: 150,
                            },
                            {
                                title: 'Kết quả mong đợi',
                                dataIndex: 'expectedResults',
                                width: 150,
                            },
                            {
                                title: 'Yêu cầu với học viên',
                                dataIndex: 'requirements',
                                width: 150,
                            },
                            {
                                title: 'Công nghệ sử dụng',
                                dataIndex: 'technologies',
                                width: 150,
                            },
                            {
                                title: 'Số lượng học viên',
                                dataIndex: 'currentStudents',
                                width: 150,
                            },
                            {
                                title: 'Số lượng học viên tối đa',
                                dataIndex: 'maxStudents',
                                width: 150,
                            },
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
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                        }}
                        data={thesisProjectData}
                    />
                </Col>
            </Row>
        </div>
    )
}

ThesisProject.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
