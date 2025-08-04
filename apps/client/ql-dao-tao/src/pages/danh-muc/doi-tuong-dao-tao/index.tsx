import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutTrainingObjectTypeModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE, TRAINING_OBJECT_TYPE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import type { TrainingObjectTypes } from '@workspace/db'
import {
    useCountTrainingObjectType,
    useFindManyDM_DonVi,
    useFindManyTrainingObjectType,
    useUpdateTrainingObjectType,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export default function TrainingObjectTypePage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        type: undefined,
        baseScore: undefined,
    })

    const { data = [], refetch } = useFindManyTrainingObjectType({
        where: {
            ...(filters.name
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.type
                ? {
                      type: {
                          equals: filters.type,
                      },
                  }
                : {}),
            ...(filters.type
                ? {
                      type: {
                          equals: filters.type,
                      },
                  }
                : {}),
        },
        orderBy: {
            name: 'asc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingObjectType({
        where: {
            ...(filters.name
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.type
                ? {
                      type: {
                          equals: filters.type,
                      },
                  }
                : {}),
            ...(filters.type
                ? {
                      type: {
                          equals: filters.type,
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
    const { onOpen } = useDisclosure<string>({
        tag: PutTrainingObjectTypeModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateTrainingObjectType } = useUpdateTrainingObjectType()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateTrainingObjectType({
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

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })
    const treeData = buildOrgTree(manageOrgData)

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
                        setFilters={setFilters}
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
                                title: 'Tên đối tượng đào tạo',
                                dataIndex: 'name',
                                fixed: 'left',
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Loại',
                                dataIndex: 'type',
                                align: 'center',
                                width: 200,
                                type: 'select',
                                options: Object.keys(TRAINING_OBJECT_TYPE).map((key) => {
                                    return {
                                        label: TRAINING_OBJECT_TYPE[
                                            key as keyof typeof TRAINING_OBJECT_TYPE
                                        ],
                                        value: key,
                                    }
                                }),
                                render: (__, record: { type?: TrainingObjectTypes }) => {
                                    return record?.type
                                        ? TRAINING_OBJECT_TYPE[
                                              record?.type as keyof typeof TRAINING_OBJECT_TYPE
                                          ]
                                        : ''
                                },
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 200,
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
                            onChange: (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingObjectTypePage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
