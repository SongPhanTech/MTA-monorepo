import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import type { DM_DonVi, TrainingObjectType } from '@workspace/db'
import {
    useCountTrainingField,
    useFindManyDM_DonVi,
    useFindManyTrainingField,
    useFindManyTrainingObjectType,
    useUpdateTrainingField,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function TrainingFieldPage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        trainingObjectTypes: undefined,
        name: '',
        code: '',
        organization: undefined,
        publishDate: undefined,
    })

    const where = useMemo(
        () => ({
            ...(filters.code && filters.code !== ''
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.trainingObjectTypes
                ? {
                      trainingObjectTypes: {
                          some: {
                              trainingObjectTypeId: {
                                  in: filters.trainingObjectTypes,
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.organization
                ? {
                      organizationId: {
                          in: filters.organization,
                      },
                  }
                : {}),
            ...(filters.publishDate?.length === 2
                ? {
                      publishDate: {
                          gte: dayjs(filters.publishDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.publishDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
        }),
        [
            filters.code,
            filters.name,
            filters.trainingObjectTypes,
            filters.organization,
            filters.publishDate,
        ]
    )
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
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen } = useDisclosure<string>({
        tag: 'PutTrainingFieldModal',
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

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })
    const treeData = buildOrgTree(manageOrgData)

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={8}>
                                    {/* <Form.Item name="name">
										<Input
											id="search"
											onChange={(e) =>
												handleFilterChange("searchText", e.target.value)
											}
											placeholder="Tìm kiếm"
											style={{
												maxWidth: 300,
												marginRight: 8,
												height: 32,
											}}
											prefix={
												<Search
													size={16}
													style={{
														color: "rgba(0, 0, 0, 0.25)",
													}}
												/>
											}
											allowClear
										/>
									</Form.Item> */}
                                </Col>

                                {/* <Col span={8}>
                                    <Form.Item
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
                                                marginRight: 8,
                                            }}
                                            onChange={(val) =>
                                                handleFilterChange('trainingObjectTypes', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col> */}
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
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
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
                                fixed: 'left',
                                width: 150,
                                type: 'input',
                            },
                            {
                                title: 'Tên ngành',
                                dataIndex: 'name',
                                width: 200,
                                fixed: 'left',
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Đối tượng đào tạo',
                                dataIndex: 'trainingObjectTypes',
                                align: 'center',
                                width: 175,
                                type: 'select',
                                options: trainingObjectTypeData.map((i) => {
                                    return {
                                        value: i.id,
                                        label: i.name,
                                    }
                                }),
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
                                title: 'Đơn vị quản lý',
                                dataIndex: 'organization',
                                align: 'center',
                                width: 150,
                                type: 'tree_select',
                                options: treeData,
                                render: (organization: DM_DonVi) =>
                                    organization?.sTen ? organization?.sTen : '',
                            },
                            {
                                title: 'Ngày ban hành',
                                align: 'center',
                                width: 150,
                                dataIndex: 'publishDate',
                                type: 'date',
                                render: (__, { publishDate }) =>
                                    publishDate ? dayjs(publishDate).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Mô tả',
                                width: 150,
                                align: 'center',
                                dataIndex: 'description',
                                render: (value: string) => {
                                    return (
                                        <Tooltip title={value}>
                                            <div className="line-clamp-2">{value}</div>
                                        </Tooltip>
                                    )
                                },
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
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingFieldPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
