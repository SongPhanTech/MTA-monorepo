import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutTrainingMajorModal } from '@components/modal'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import type { TrainingObjectType } from '@workspace/db'
import {
    useCountTrainingField,
    useFindManyDM_DonVi,
    useFindManyTrainingField,
    useFindManyTrainingObjectType,
    useUpdateTrainingMajor,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row, Tag, Tooltip } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

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
        trainingObjectTypes: undefined,
        code: '',
        name: '',
        numberCreditsMajor: undefined,
        numberCreditsRequired: undefined,
        numberCreditsElective: undefined,
        organization: undefined,
    })

    const { data = [], refetch } = useFindManyTrainingField({
        where: {
            trainingMajors: {
                some: {
                    OR: [
                        {
                            name: {
                                contains: filters.name,
                                mode: 'insensitive',
                            },
                        },
                        {
                            code: {
                                contains: filters.code,
                                mode: 'insensitive',
                            },
                        },
                    ],
                    ...emptyObjectIf(
                        {
                            trainingObjectTypeId: {
                                in: filters.trainingObjectTypes,
                            },
                        },
                        !!filters.trainingObjectTypes
                    ),
                    ...emptyObjectIf(
                        {
                            organizationId: {
                                in: filters.organization,
                            },
                        },
                        !!filters.organization
                    ),
                },
            },
        },
        include: {
            _count: true,
            trainingMajors: {
                where: {
                    OR: [
                        {
                            name: {
                                contains: filters.name,
                                mode: 'insensitive',
                            },
                        },
                        {
                            code: {
                                contains: filters.code,
                                mode: 'insensitive',
                            },
                        },
                    ],
                    ...emptyObjectIf(
                        {
                            trainingObjectTypes: {
                                some: {
                                    trainingObjectTypeId: {
                                        in: filters.trainingObjectTypes,
                                    },
                                },
                            },
                        },
                        !!filters.trainingObjectTypes
                    ),
                    ...emptyObjectIf(
                        {
                            organizationId: {
                                in: filters.organization,
                            },
                        },
                        !!filters.organization
                    ),
                },
                include: {
                    organization: true,
                    trainingObjectTypes: {
                        include: {
                            trainingObjectType: true,
                        },
                    },
                },
                orderBy: [
                    ...emptyObjectIf(
                        [
                            {
                                numberCreditsMajor: filters.numberCreditsMajor,
                            },
                        ],
                        !!filters.numberCreditsMajor
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                numberCreditsRequired: filters.numberCreditsRequired,
                            },
                        ],
                        !!filters.numberCreditsRequired
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                numberCreditsElective: filters.numberCreditsElective,
                            },
                        ],
                        !!filters.numberCreditsElective
                    ),
                    {
                        name: 'asc',
                    },
                ],
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
            trainingMajors: {
                some: {
                    OR: [
                        {
                            name: {
                                contains: filters.name,
                                mode: 'insensitive',
                            },
                        },
                        {
                            code: {
                                contains: filters.code,
                                mode: 'insensitive',
                            },
                        },
                    ],
                    ...emptyObjectIf(
                        {
                            trainingObjectTypeId: {
                                in: filters.trainingObjectTypes,
                            },
                        },
                        !!filters.trainingObjectTypes
                    ),

                    ...emptyObjectIf(
                        {
                            organizationId: {
                                in: filters.organization,
                            },
                        },
                        !!filters.organization
                    ),
                },
            },
        },
    })

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })
    const treeData = buildOrgTree(manageOrgData)

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<string>({
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

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            {/* <Flex>
                                <Col span={8}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange('searchText', e.target.value)
                                            }
                                            placeholder="Tìm kiếm"
                                            style={{
                                                maxWidth: 300,
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
                                </Col>
                                <Col span={8}>
                                    <Form.Item
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
                                                marginRight: 8,
                                            }}
                                            onChange={(val) =>
                                                handleFilterChange('trainingObjectTypeId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex> */}
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
                        headerTitleKey={({ code, name, trainingMajors }) =>
                            `${[code, name].filter(Boolean).join(' - ')} (${trainingMajors.length})`
                        }
                        defaultExpandAll
                        currentPage={currentPage}
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'Mã chuyên ngành',
                                dataIndex: 'code',
                                align: 'center',
                                width: 200,
                                fixed: 'left',
                                type: 'input',
                            },
                            {
                                title: 'Tên chuyên ngành',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
                            },
                            // {
                            //     title: 'Tên tiếng anh',
                            //     dataIndex: 'englishName',
                            //     align: 'center',
                            //     width: 150,
                            // },
                            {
                                title: 'ĐTĐT',
                                dataIndex: 'trainingObjectTypes',
                                align: 'center',
                                width: 150,
                                type: 'select',
                                options: trainingObjectTypeData.map((i: TrainingObjectType) => ({
                                    value: i.id,
                                    label: i.name,
                                })),
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
                                                          - {i?.trainingObjectType?.name}
                                                      </div>
                                                  )
                                              }
                                          )
                                        : '',
                            },
                            {
                                title: 'Đơn vị quản lý',
                                dataIndex: 'organization',
                                align: 'center',
                                width: 150,
                                render: (value) => value?.sTen,
                                type: 'tree_select',
                                options: treeData,
                            },

                            {
                                title: 'Số TC chuyên ngành',
                                width: 200,
                                align: 'center',
                                dataIndex: 'numberCreditsMajor',
                                type: 'order',
                                distinctFilters: ['numberCreditsRequired', 'numberCreditsElective'],
                            },
                            {
                                title: 'Số TC bắt buộc',
                                width: 150,
                                align: 'center',
                                dataIndex: 'numberCreditsRequired',
                                type: 'order',
                                distinctFilters: ['numberCreditsMajor', 'numberCreditsElective'],
                            },
                            {
                                title: 'Số TC lựa chọn',
                                width: 150,
                                align: 'center',
                                dataIndex: 'numberCreditsElective',
                                type: 'order',
                                distinctFilters: ['numberCreditsMajor', 'numberCreditsRequired'],
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
                        childrenFieldName="trainingMajors"
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

TrainingMajorPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
