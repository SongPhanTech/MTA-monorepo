import { CaretRightOutlined } from '@ant-design/icons'
import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import ViewIcon from '@components/icons/view'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { Room } from '@workspace/db'
import {
    useCountTrainingLocation,
    useFindManyDM_Tinh_New,
    useFindManyTrainingLocation,
    useUpdateBuilding,
    useUpdateTrainingLocation,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { Button, Col, Collapse, Empty, Flex, message, Row, Tag, Tooltip } from 'antd'
import _ from 'lodash'
import { Building2Icon } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function TrainingLocationPage() {
    const { can, canSome } = useAbility()
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        floor: undefined,
        roomNumber: undefined,
    })

    const { data: dM_Tinh_New } = useFindManyDM_Tinh_New({
        include: {
            trainingLocation: {
                include: {
                    buildings: {
                        include: {
                            rooms: true,
                        },
                    },
                },
            },
        },
    })
    const { data = [], refetch } = useFindManyTrainingLocation({
        where: {
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
        where: {
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
        tag: 'PutTrainingLocationModal',
    })

    const { onOpen: openPutBuilding } = useDisclosure<{
        trainingLocationId: string
        id?: string
    }>({
        tag: 'PutBuildingModal',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateTrainingLocation } = useUpdateTrainingLocation()
    const { mutateAsync: updateBuilding } = useUpdateBuilding()
    const provincesWithLocations = useMemo(() => {
        return (
            dM_Tinh_New?.filter(
                (tinh) => tinh.trainingLocation && tinh.trainingLocation.length > 0
            ) || []
        )
    }, [dM_Tinh_New])
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateTrainingLocation({
                where: { id },
                data: { deletedAt: new Date(), code: id, name: id },
            })
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

    async function handleDeleteBuilding(id: string) {
        try {
            showSpinner()
            await updateBuilding({
                where: { id },
                data: { deletedAt: new Date(), code: id },
            })
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

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }
    const collapseStyle: React.CSSProperties = {
        background: 'transparent',
    }

    const panelStyle: React.CSSProperties = {
        marginBottom: 12,
        border: '2px solid #e0e0e0',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        flex: 'unset !important',
    }

    return (
        <div>
            <style>
                {`
                .ant-collapse-header-text {
                    flex: unset !important;
                }
                .ant-collapse-header {
                    padding-bottom: 0px !important;
                }
                    .ant-collapse-content-box {
                    padding-bottom: 0px !important;
                }
                `}
            </style>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={6}>
                            <Flex justify="end">
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC,
                                    'THEM'
                                ) && (
                                    <Button onClick={handleModal} type="primary">
                                        Thêm mới
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24} className="mt-4">
                    <Collapse
                        accordion
                        bordered={false}
                        style={collapseStyle}
                        expandIcon={({ isActive }) => (
                            <CaretRightOutlined rotate={isActive ? 90 : 0} />
                        )}
                    >
                        {provincesWithLocations.length > 0 ? (
                            provincesWithLocations?.map((tinh) => (
                                <Collapse.Panel
                                    header={
                                        <strong style={{ fontSize: '16px' }}>
                                            {`${tinh.sTen} (${tinh.trainingLocation.length} địa điểm)`}
                                        </strong>
                                    }
                                    key={tinh.Id}
                                    style={panelStyle}
                                >
                                    <TableCollapse
                                        rowKey="id"
                                        headerTitleKey={({ code, name, buildings }) =>
                                            `${[code, name].filter(Boolean).join(' - ')} (${buildings.length})`
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
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC,
                                                    'THEM'
                                                ) && (
                                                    <Tooltip title="Thêm tòa nhà">
                                                        <Building2Icon
                                                            className="text-yellow-700 cursor-pointer"
                                                            size={16}
                                                            onClick={openPutBuilding.bind(null, {
                                                                trainingLocationId: record.id,
                                                            })}
                                                        />
                                                    </Tooltip>
                                                )}
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC,
                                                    'SUA'
                                                ) && (
                                                    <EditIcon
                                                        onClick={onOpen.bind(null, record.id)}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                )}
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC,
                                                    'XOA'
                                                ) && (
                                                    <DeleteIcon
                                                        popConfirm={{
                                                            onConfirm: (e) => {
                                                                handleDelete(record.id)
                                                                e?.stopPropagation()
                                                            },
                                                            onCancel: (e) => {
                                                                e?.stopPropagation()
                                                            },
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                )}
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
                                                type: 'input',
                                            },
                                            {
                                                title: 'Tên toà nhà',
                                                dataIndex: 'name',
                                                align: 'center',
                                                type: 'input',
                                            },
                                            {
                                                title: 'Số tầng',
                                                dataIndex: 'floor',
                                                align: 'center',
                                                type: 'order',
                                            },
                                            {
                                                title: 'Số phòng',
                                                align: 'center',
                                                dataIndex: '',
                                                type: 'order',
                                                render: (__, record: { rooms?: Room[] }) => {
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
                                                hidden: !canSome(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC,
                                                    'THEM'
                                                ),
                                                render: (_, { id, trainingLocationId, rooms }) => {
                                                    if (id && trainingLocationId) {
                                                        return (
                                                            <Row className="justify-center gap-2">
                                                                {can(
                                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC,
                                                                    'SUA'
                                                                ) && (
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
                                                                )}
                                                                {can(
                                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC,
                                                                    'XEM'
                                                                ) && (
                                                                    <ViewIcon
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            if (id) {
                                                                                router.push(
                                                                                    `${ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_PHONG_HOC_PHONG_HOC_ID.replace('[id]', id)}`
                                                                                )
                                                                            }
                                                                        }}
                                                                        className="text-sm text-blue-700 cursor-pointer"
                                                                    />
                                                                )}
                                                                {can(
                                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC,
                                                                    'XOA'
                                                                ) &&
                                                                    !rooms.length && (
                                                                        <DeleteIcon
                                                                            popConfirm={{
                                                                                onConfirm: (e) => {
                                                                                    handleDeleteBuilding(
                                                                                        id
                                                                                    )
                                                                                    e?.stopPropagation()
                                                                                },
                                                                                onCancel: (e) => {
                                                                                    e?.stopPropagation()
                                                                                },
                                                                            }}
                                                                            onClick={(e) =>
                                                                                e.stopPropagation()
                                                                            }
                                                                        />
                                                                    )}
                                                            </Row>
                                                        )
                                                    }
                                                    return ''
                                                },
                                            },
                                        ]}
                                        data={tinh.trainingLocation}
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
                                </Collapse.Panel>
                            ))
                        ) : (
                            <Empty />
                        )}
                    </Collapse>
                </Col>
            </Row>
        </div>
    )
}

TrainingLocationPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
