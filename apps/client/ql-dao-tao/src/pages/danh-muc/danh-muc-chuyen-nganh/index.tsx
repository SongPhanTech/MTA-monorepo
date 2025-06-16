import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutTrainingMajorModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { Prisma, TrainingObjectType } from '@workspace/db'
import {
    useCountTrainingField,
    useFindManyTrainingField,
    useFindManyTrainingObjectType,
    useUpdateTrainingMajor,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Flex,
    Form,
    Input,
    Row,
    Tag,
    Typography,
    message,
} from 'antd'
import _ from 'lodash'
import { Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
interface FilterProps {
    searchText: string | undefined
    trainingObjectTypeId: string | undefined
}

interface DataType {
    key: React.Key
    majorName: string
    department?: string
    majorCode?: string
    abbreviation?: string
    specializationName?: string
    englishName?: string
    description?: string
    creditsMajor?: string
    creditsRequired?: string
    creditsElective?: string
    status?: string
    children?: DataType[]
}

export default function TrainingMajorPage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectTypeId: undefined,
    })
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])

    const trainingMajorWhere: Prisma.TrainingMajorWhereInput = useMemo(
        () => ({
            AND: [
                {
                    OR: [
                        {
                            name: {
                                contains: filters.searchText,
                                mode: 'insensitive',
                            },
                        },
                        {
                            code: {
                                contains: filters.searchText,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
            ],
            ...(filters.trainingObjectTypeId
                ? {
                    trainingObjectTypes: {
                        some: {
                            trainingObjectTypeId:
                                filters.trainingObjectTypeId,
                        },
                    },
                }
                : {}),
        }),
        [filters]
    )

    const { data = [], refetch } = useFindManyTrainingField({
        where: { trainingMajors: { some: trainingMajorWhere } },
        include: {
            _count: true,
            trainingMajors: {
                where: trainingMajorWhere,
                include: {
                    organization: true,
                    trainingObjectTypes: {
                        include: {
                            trainingObjectType: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingField({
        where: { trainingMajors: { some: trainingMajorWhere } },
    })

    const dataRaw = useMemo(
        () =>
            data.length
                ? data.map(({ trainingMajors, ...trainingField }) => ({
                    ...trainingField,
                    children: trainingMajors,
                }))
                : [],
        [data]
    )

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutTrainingMajorModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateTrainingMajor } = useUpdateTrainingMajor()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateTrainingMajor({
                where: { id },
                data: { deletedAt: new Date() },
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

    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()

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
                                            handleFilterChange(
                                                'searchText',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Tìm kiếm"
                                        style={{
                                            width: 300,
                                            marginRight: 8,
                                            height: 32,
                                        }}
                                        prefix={
                                            <Search
                                                size={15}
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
                                    name="trainingObjectTypeId"
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
                                            handleFilterChange(
                                                'trainingObjectTypeId',
                                                val
                                            )
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
                    <TableCollapse
                        rowKey="id"
                        headerTitleKey={({ code, name, children }) =>
                            `${code} - ${name} (${children.length})`
                        }
                        defaultExpandAll
                        currentPage={currentPage}
                        columns={[
                            {
                                title: 'Mã chuyên ngành',
                                dataIndex: 'code',
                                align: 'center',
                            },
                            {
                                title: 'Tên chuyên ngành',
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
                                title: 'ĐTĐT',
                                dataIndex: 'trainingObjectTypes',
                                align: 'left',
                                width: 100,
                                render: (value) =>
                                    value?.length > 0
                                        ? value.map(
                                            (
                                                i: TrainingObjectType & {
                                                    trainingObjectType: TrainingObjectType
                                                }
                                            ) => {
                                                return (
                                                    <div key={i?.id}>
                                                        -{' '}
                                                        {
                                                            i
                                                                ?.trainingObjectType
                                                                ?.name
                                                        }
                                                    </div>
                                                )
                                            }
                                        )
                                        : '',
                            },
                            {
                                title: 'Khoa phụ trách',
                                dataIndex: 'organization',
                                align: 'center',
                                width: 150,
                                render: (value) => value?.name,
                            },

                            {
                                title: 'Mô tả',
                                width: 150,
                                align: 'center',
                                dataIndex: 'description',
                            },
                            {
                                title: 'Số TC chuyên ngành',
                                width: 150,
                                align: 'center',
                                dataIndex: 'numberCreditsMajor',
                            },
                            {
                                title: 'Số TC bắt buộc',
                                width: 150,
                                align: 'center',
                                dataIndex: 'numberCreditsRequired',
                            },
                            {
                                title: 'Số TC lựa chọn',
                                width: 150,
                                align: 'center',
                                dataIndex: 'numberCreditsElective',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 130,
                                fixed: 'right',
                                render: (value, record) => {
                                    return !record?.active ? (
                                        <Tag color="error">Không hoạt động</Tag>
                                    ) : (
                                        <Tag color="success">
                                            Đang hoạt động
                                        </Tag>
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
                                                    onClick={onOpen.bind(
                                                        null,
                                                        id
                                                    )}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDelete(id),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={dataRaw}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingMajorPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
