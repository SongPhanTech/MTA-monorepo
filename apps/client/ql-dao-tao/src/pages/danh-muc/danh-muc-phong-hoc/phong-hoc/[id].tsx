import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutRoomModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { Prisma } from '@workspace/db'
import {
    useCountRoom,
    useFindManyRoom,
    useFindUniqueBuilding,
    useUpdateRoom,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, message, Row, Tag } from 'antd'
import _ from 'lodash'
import { Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText: string | undefined
}

export default function BuildingPage() {
    const router = useRouter()
    const buildingId = router.query.id as string
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })

    const roomWhere: Prisma.RoomWhereInput = useMemo(
        () => ({
            AND: [
                {
                    buildingId,
                },
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
        }),
        [filters, buildingId]
    )

    const { data = [], refetch } = useFindManyRoom({
        where: roomWhere,
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: building } = useFindUniqueBuilding(
        {
            where: {
                id: buildingId,
            },
            include: {
                trainingLocation: true,
            },
        },
        {
            enabled: !!buildingId,
        }
    )

    const { data: count } = useCountRoom({
        where: roomWhere,
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { onOpen: openPutRoom } = useDisclosure<{
        buildingId: string
        buildingCode: string
        id?: string
    }>({
        tag: PutRoomModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        openPutRoom({
            buildingCode: building?.code ?? '',
            buildingId: buildingId,
        })
    }
    const { mutateAsync: update } = useUpdateRoom()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await update({
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
                    <span className="text-lg font-semibold">
                        Danh sách phòng{' '}
                        {building ? `: ${building.trainingLocation?.name} - ${building.name}` : ''}
                    </span>
                    <Table
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                render: (_, __, index) => {
                                    return (currentPage - 1) * numberOfPages + index + 1
                                },
                            },
                            {
                                title: 'Mã phòng',
                                dataIndex: 'code',
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Tên phòng',
                                dataIndex: 'name',
                                align: 'left',
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
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={openPutRoom.bind(null, {
                                                        buildingId,
                                                        buildingCode: building?.code ?? '',
                                                        id,
                                                    })}
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

BuildingPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
