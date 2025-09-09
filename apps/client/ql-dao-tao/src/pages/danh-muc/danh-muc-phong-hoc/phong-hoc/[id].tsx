import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountRoom,
    useFindManyRoom,
    useFindUniqueBuilding,
    useUpdateRoom,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import _ from 'lodash'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function BuildingPage() {
    const router = useRouter()
    const buildingId = router.query.id as string
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })

    const { data = [], refetch } = useFindManyRoom({
        where: {
            buildingId,
            name: {
                contains: filters.name,
                mode: 'insensitive',
            },
            code: {
                contains: filters.code,
                mode: 'insensitive',
            },
            ...(filters.active?.length === 1
                ? {
                      subjectVersion: {
                          some: { active: filters.active[0] },
                      },
                  }
                : {}),
        },
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
        where: {
            buildingId,
            name: {
                contains: filters.name,
                mode: 'insensitive',
            },
            code: {
                contains: filters.code,
                mode: 'insensitive',
            },
            ...(filters.active?.length === 1
                ? {
                      subjectVersion: {
                          some: { active: filters.active[0] },
                      },
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

    const { onOpen: openPutRoom } = useDisclosure<{
        buildingId: string
        buildingCode: string
        id?: string
    }>({
        tag: 'PutRoomModal',
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
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
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
                    <Row gutter={[16, 16]} align="top" justify="end">
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
                                type: 'input',
                            },
                            {
                                title: 'Tên phòng',
                                dataIndex: 'name',
                                align: 'left',
                                type: 'input',
                            },
                            {
                                title: 'Số chỗ ngồi',
                                dataIndex: 'capacity',
                                align: 'center',
                                type: 'order',
                            },
                            {
                                title: 'Số chỗ ngồi thi',
                                dataIndex: 'examCapacity',
                                align: 'center',
                                type: 'order',
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
                                dataIndex: 'active',
                                type: 'select',
                                options: [
                                    {
                                        value: true,
                                        label: 'Đang hoạt động',
                                    },
                                    {
                                        value: false,
                                        label: 'Không hoạt động',
                                    },
                                ],
                                render: (__, record) => {
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

BuildingPage.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Danh mục' },
                {
                    title: 'Danh mục phòng học',
                    href: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_PHONG_HOC,
                },
                { title: 'Danh sách phòng học' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
