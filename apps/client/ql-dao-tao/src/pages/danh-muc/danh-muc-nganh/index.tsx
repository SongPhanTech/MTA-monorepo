import Select from '@components/commons/select'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutTrainingFieldModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { emptyObjectIf } from '@workspace/constant'
import type { DM_DonVi, Prisma, TrainingObjectType } from '@workspace/db'
import {
    useCountTrainingField,
    useFindManyTrainingField,
    useFindManyTrainingObjectType,
    useUpdateTrainingField,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText: string | undefined
    trainingObjectTypeId: string | undefined
}

export default function TrainingFieldPage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectTypeId: undefined,
    })

    const where: Prisma.TrainingFieldWhereInput = {
        OR: [
            { name: { contains: filters.searchText, mode: 'insensitive' } },
            { code: { contains: filters.searchText, mode: 'insensitive' } },
        ],
        ...emptyObjectIf(
            {
                trainingObjectTypes: {
                    some: {
                        trainingObjectTypeId: filters.trainingObjectTypeId,
                    },
                },
            },
            !!filters.trainingObjectTypeId
        ),
    }

    const { data = [], refetch } = useFindManyTrainingField({
        where,
        include: {
            organization: true,
            trainingObjectTypes: {
                include: {
                    trainingObjectType: true,
                },
            },
        },
        orderBy: {
            name: 'asc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingField({
        where,
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<string>({
        tag: PutTrainingFieldModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateTrainingField } = useUpdateTrainingField()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateTrainingField({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error) {
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

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Form.Item name="searchText">
                                    <Input
                                        id="search"
                                        onChange={(e) =>
                                            handleFilterChange('searchText', e.target.value)
                                        }
                                        placeholder="Tìm kiếm"
                                        style={{
                                            width: 300,
                                            marginRight: 8,
                                            height: 32,
                                        }}
                                        prefix={
                                            <Search
                                                size={16}
                                                style={{
                                                    color: 'rgba(0, 0, 0, 0.25)',
                                                }}
                                            />
                                        }
                                        allowClear
                                    />
                                </Form.Item>
                                <Form.Item
                                    className="mb-0"
                                    name="trainingObjectId"
                                    labelCol={{ span: 24 }}
                                    wrapperCol={{ span: 24 }}
                                    labelAlign="left"
                                >
                                    <Select
                                        placeholder="Chọn đối tượng đào tạo"
                                        options={trainingObjectTypeData.map(
                                            (i: TrainingObjectType) => ({
                                                value: i.id,
                                                label: i.name,
                                            })
                                        )}
                                        style={{
                                            width: 300,
                                            marginRight: 8,
                                        }}
                                        onChange={(val) =>
                                            handleFilterChange('trainingObjectTypeId', val)
                                        }
                                        allowClear
                                    />
                                </Form.Item>
                            </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end">
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
                        id="training-category"
                        data={data}
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
                                title: 'Mã ngành',
                                dataIndex: 'code',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Tên ngành',
                                dataIndex: 'name',
                                width: 200,
                                align: 'left',
                            },
                            {
                                title: 'Tên tiếng anh',
                                align: 'left',
                                dataIndex: 'englishName',
                                width: 150,
                            },
                            {
                                title: 'Đối tượng đào tạo',
                                dataIndex: 'trainingObjectTypes',
                                align: 'center',
                                width: 150,
                                render: (trainingObjectTypes) =>
                                    trainingObjectTypes
                                        .map(
                                            ({
                                                trainingObjectType,
                                            }: {
                                                trainingObjectType: TrainingObjectType
                                            }) => trainingObjectType.name
                                        )
                                        .join(', '),
                            },
                            {
                                title: 'Khoa phụ trách',
                                dataIndex: 'organization',
                                align: 'center',
                                width: 150,
                                render: (organization: DM_DonVi) =>
                                    organization?.sTen ? organization?.sTen : '',
                            },

                            {
                                title: 'Mô tả',
                                width: 150,
                                align: 'center',
                                dataIndex: 'description',
                            },
                            {
                                title: 'Ngày ban hành',
                                align: 'center',
                                width: 150,
                                render: ({ publishDate }) =>
                                    publishDate ? dayjs(publishDate).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 130,
                                render: (value, record) => {
                                    return !record?.active ? (
                                        <Tag color="error">Không hoạt động</Tag>
                                    ) : (
                                        <Tag color="success">Đang hoạt động</Tag>
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
                                                {/* <Tooltip
                                                    title="Xem chi tiết"
                                                    placement="leftTop"
                                                >
                                                    <EyeOutlined
                                                        onClick={onOpen.bind(
                                                            null,
                                                            id
                                                        )}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                </Tooltip> */}
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
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingFieldPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
