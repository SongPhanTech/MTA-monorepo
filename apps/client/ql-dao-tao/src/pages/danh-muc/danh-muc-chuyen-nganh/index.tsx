import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import type { Prisma, TrainingObjectType } from '@workspace/db/client'
import {
    useCountTrainingField,
    useFindManyDM_DonVi,
    useFindManyTrainingField,
    useUpdateTrainingMajor,
} from '@workspace/db/hooks'
import { whereOrganization } from '@workspace/libs/constants'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { useFindManyTrainingObjectTypePermission } from '@workspace/ui'
import { Button, Col, Flex, Form, Input, message, Row, Tag, Tooltip } from 'antd'
import _ from 'lodash'
import { Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function TrainingMajorPage() {
    const { can, canSome } = useAbility()
    const [expandAll, setExpandAll] = useState(false)
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
        active: undefined,
    })

    const isFiltering = useMemo(() => {
        return Object.values(filters).some((value) => !!value)
    }, [filters])

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectTypePermission()

    const where: Prisma.TrainingFieldWhereInput = useMemo(() => {
        const filter: Prisma.TrainingFieldWhereInput = isFiltering
            ? {
                  ...(filters.searchText
                      ? {
                            OR: [
                                {
                                    code: {
                                        contains: filters.searchText,
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    name: {
                                        contains: filters.searchText,
                                        mode: 'insensitive',
                                    },
                                },
                            ],
                        }
                      : {}),

                  trainingMajors: {
                      some: {
                          ...(filters.name
                              ? {
                                    name: {
                                        contains: filters.name,
                                        mode: 'insensitive',
                                    },
                                }
                              : {}),
                          ...(filters.active
                              ? {
                                    active: {
                                        equals: filters.active[0],
                                    },
                                }
                              : {}),
                          ...(filters.code
                              ? {
                                    code: {
                                        contains: filters.code,
                                        mode: 'insensitive',
                                    },
                                }
                              : {}),

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
                              !!filters.trainingObjectTypes?.length
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
              }
            : {}

        filter.trainingObjectTypes = {
            some: {
                trainingObjectTypeId: {
                    in: filters.trainingObjectTypes?.length
                        ? filters.trainingObjectTypes
                        : trainingObjectTypeData.map((item) => item.id),
                },
            },
        }

        return filter
    }, [filters, isFiltering, trainingObjectTypeData])

    const { data = [], refetch } = useFindManyTrainingField({
        where,
        include: {
            _count: true,
            trainingMajors: {
                where: {
                    ...(filters.name
                        ? {
                              name: {
                                  contains: filters.name,
                                  mode: 'insensitive',
                              },
                          }
                        : {}),
                    ...(filters.code
                        ? {
                              code: {
                                  contains: filters.code,
                                  mode: 'insensitive',
                              },
                          }
                        : {}),
                    ...(filters.active
                        ? {
                              active: {
                                  equals: filters.active[0],
                              },
                          }
                        : {}),

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
                        !!filters.trainingObjectTypes?.length
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
                    secondOrganization: true,
                    thirdOrganization: true,
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
        where: { ...where, deletedAt: null },
    })

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({
        where: whereOrganization,
        orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
    })
    const treeData = buildOrgTree(manageOrgData)

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<string>({
        tag: 'PutTrainingMajorModal',
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

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={8}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    searchText: e.target.value,
                                                })
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
                            </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end" className="gap-2">
                                <Button onClick={() => setExpandAll(!expandAll)}>
                                    {expandAll ? 'Thu gọn' : 'Mở rộng'}
                                </Button>
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CHUYEN_NGANH,
                                    'SUA'
                                ) && (
                                    <Button onClick={handleModal} type="primary">
                                        Thêm mới
                                    </Button>
                                )}
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
                        defaultExpandAll={expandAll}
                        currentPage={currentPage}
                        filters={filters}
                        setFilters={(value) => {
                            console.log(value)
                            if (value.active?.length === 0 || value.active?.length === 2) {
                                value.active = undefined
                            }
                            setFilters(value)
                            setCurrentPage(1)
                        }}
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
                                title: 'Đơn vị quản lý 2',
                                dataIndex: 'secondOrganization',
                                align: 'center',
                                width: 150,
                                render: (value) => value?.sTen,
                                type: 'tree_select',
                                options: treeData,
                            },
                            {
                                title: 'Đơn vị quản lý 3',
                                dataIndex: 'thirdOrganization',
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
                                type: 'select',
                                dataIndex: 'active',
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
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CHUYEN_NGANH,
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CHUYEN_NGANH,
                                                    'SUA'
                                                ) && (
                                                    <EditIcon
                                                        onClick={onOpen.bind(null, id)}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                )}
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CHUYEN_NGANH,
                                                    'XOA'
                                                ) && (
                                                    <DeleteIcon
                                                        popConfirm={{
                                                            onConfirm: () => handleDelete(id),
                                                        }}
                                                    />
                                                )}
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

TrainingMajorPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
