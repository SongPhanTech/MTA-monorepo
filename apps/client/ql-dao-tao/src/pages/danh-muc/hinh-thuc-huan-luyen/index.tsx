import Table from '@components/commons/table'
import { PutTrainingFormModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { TrainingCourse } from '@workspace/db'
import {
    useCountTrainingForm,
    useFindManyTrainingForm,
    useUpdateFixedClass,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, message, Row } from 'antd'
import _ from 'lodash'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export default function FixedClassPage({ trainingCourse }: { trainingCourse?: TrainingCourse }) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [_searchText, _setSearchText] = useState<string>('')
    const [filters, setFilters] = useState({
        searchText: '',
        trainingCourseId: trainingCourse ? trainingCourse.id : undefined,
        trainingObjectTypeId: undefined,
        curriculumVersionId: undefined,
    })

    const router = useRouter()
    const { data = [], refetch } = useFindManyTrainingForm({
        where: {
            OR: [
                { name: { contains: filters.searchText, mode: 'insensitive' } },
                { code: { contains: filters.searchText, mode: 'insensitive' } },
            ],
        },
        orderBy: {
            name: 'asc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingForm({
        where: {
            OR: [
                { name: { contains: filters.searchText, mode: 'insensitive' } },
                { code: { contains: filters.searchText, mode: 'insensitive' } },
            ],
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<string>({
        tag: PutTrainingFormModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }

    const { mutateAsync: updateFixedClass } = useUpdateFixedClass()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateFixedClass({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={6}>
                            <Form.Item label="" name="search">
                                <Input
                                    id="search"
                                    onChange={(e) =>
                                        handleFilterChange('searchText', e.target.value)
                                    }
                                    placeholder="Tìm kiếm"
                                    allowClear
                                />
                            </Form.Item>
                        </Col>

                        <Col span={4}>
                            <Flex justify="end" gap={4}>
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="fixed-class"
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
                                title: 'Mã TGĐT',
                                align: 'center',
                                width: 150,
                                fixed: 'left',
                                dataIndex: 'code',
                            },
                            {
                                title: 'Tên thời gian đào tạo',
                                align: 'center',
                                width: 200,
                                fixed: 'left',
                                dataIndex: 'name',
                            },
                        ]}
                        data={data}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

FixedClassPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
