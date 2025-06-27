import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutBuildingModal } from '@components/modal'
import PutTrainingLocationModal from '@components/modal/put-khu-vuc'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { Prisma } from '@workspace/db'
import {
    useCountTrainingLocation,
    useFindManyTrainingLocation,
    useUpdateBuilding,
    useUpdateTrainingLocation,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, Form, Input, message, Row, Tag, Tooltip } from 'antd'
import _ from 'lodash'
import { Building2Icon, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText: string | undefined
}

export default function TrainingLocationPage() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })

    const trainingLocationWhere: Prisma.TrainingLocationWhereInput = useMemo(
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
                        {
                            buildings: {
                                some: {
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
                            },
                        },
                    ],
                },
            ],
        }),
        [filters]
    )

    const { data = [], refetch } = useFindManyTrainingLocation({
        where: trainingLocationWhere,
        include: {
            _count: true,
            buildings: {
                include: {
                    rooms: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingLocation({
        where: trainingLocationWhere,
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<string>({
        tag: PutTrainingLocationModal.name,
    })

    const { onOpen: openPutBuilding } = useDisclosure<{
        trainingLocationId: string
        id?: string
    }>({
        tag: PutBuildingModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateTrainingLocation } = useUpdateTrainingLocation()
    const { mutateAsync: updateBuilding } = useUpdateBuilding()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateTrainingLocation({
                where: { id },
                data: { deletedAt: new Date(), code: id, name: id },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    async function handleDeleteBuilding(id: string) {
        try {
            showSpinner()
            await updateBuilding({
                where: { id },
                data: { deletedAt: new Date(), code: id },
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
                                                size={15}
                                                style={{
                                                    color: 'rgba(0, 0, 0, 0.25)',
                                                }}
                                            />
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
                        headerTitleKey={({ code, name, buildings }) =>
                            `${code} - ${name} (${buildings.length})`
                        }
                        childrenFieldName="buildings"
                        onRowClick={(record) => {
                            if (record.id) {
                                router.push(
                                    `${ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_PHONG_HOC_PHONG_HOC_ID.replace('[id]', record.id)}`
                                )
                            }
                        }}
                        headerRight={(record) => (
                            <Row className="justify-center gap-2 mr-2">
                                <Tooltip title="Thêm tòa nhà">
                                    <Building2Icon
                                        className="text-yellow-700 cursor-pointer"
                                        size={16}
                                        onClick={openPutBuilding.bind(null, {
                                            trainingLocationId: record.id,
                                        })}
                                    />
                                </Tooltip>
                                <EditIcon
                                    onClick={onOpen.bind(null, record.id)}
                                    className="text-sm text-blue-700 cursor-pointer"
                                />
                                <DeleteIcon
                                    popConfirm={{
                                        onConfirm: () => handleDelete(record.id),
                                    }}
                                />
                            </Row>
                        )}
                        defaultExpandAll
                        currentPage={currentPage}
                        columns={[
                            {
                                title: 'Mã toà nhà',
                                dataIndex: 'code',
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Tên toà nhà',
                                dataIndex: 'name',
                                align: 'center',
                            },
                            {
                                title: 'Số tầng',
                                dataIndex: 'floor',
                                align: 'center',
                            },
                            {
                                title: 'Số phòng',
                                align: 'center',
                                render: (value, record) => {
                                    return record?.rooms?.length ?? 0
                                },
                            },
                            {
                                title: 'Mô tả',
                                align: 'center',
                                dataIndex: 'description',
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
                                        <Tag color="success">Đang hoạt động</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id, trainingLocationId }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openPutBuilding({
                                                            trainingLocationId,
                                                            id,
                                                        })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () => handleDeleteBuilding(id),
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
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
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingLocationPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
