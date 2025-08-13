import Select from '@components/commons/select'
import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import ViewIcon from '@components/icons/view'
import { ModalVanBang, PutGraduationDecision } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import type {
    FixedClass,
    TrainingCourse,
    TrainingField,
    TrainingMajor,
    TrainingObjectType,
} from '@workspace/db'
import {
    useCountGraduationDecision,
    useFindManyDiplomaType,
    useFindManyDM_DonVi,
    useFindManyFixedClass,
    useFindManyGraduationDecision,
    useFindManyTrainingCourse,
    useFindManyTrainingField,
    useFindManyTrainingMajor,
    useFindManyTrainingObjectType,
} from '@workspace/db/hooks'
import { Col, Flex, Form, Row, TreeSelect } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function GraduationDecisionDiploma() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        decisionDate: undefined,
        finalGpa: undefined,
        diplomaNumber: '',
        originalDiplomaNumber: '',
        diplomaIssueDate: undefined,
        managementOrganizationId: undefined,
        trainingCourseId: undefined,
        trainingObjectId: undefined,
        trainingFieldId: undefined,
        trainingMajorId: undefined,
        fixedClassId: undefined,
    })

    const where = useMemo(
        () => ({
            ...(filters.decisionDate
                ? {
                      decisionDate: {
                          gte: dayjs(filters.decisionDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.decisionDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.diplomaIssueDate
                ? {
                      diplomaIssueDate: {
                          gte: dayjs(filters.diplomaIssueDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.diplomaIssueDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.diplomaNumber
                ? {
                      diplomaNumber: {
                          contains: filters.diplomaNumber,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.originalDiplomaNumber
                ? {
                      originalDiplomaNumber: {
                          contains: filters.originalDiplomaNumber,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.trainingMajorId
                ? {
                      trainingMajorId: filters.trainingMajorId,
                  }
                : {}),

            trainingMajor: {
                ...(filters.managementOrganizationId
                    ? {
                          organizationId: filters.managementOrganizationId,
                      }
                    : {}),
                ...(filters.trainingFieldId
                    ? {
                          trainingFieldId: filters.trainingFieldId,
                      }
                    : {}),
            },
            student: {
                ...(filters.code
                    ? {
                          code: {
                              contains: filters.code,
                              mode: 'insensitive' as const,
                          },
                      }
                    : {}),
                userProfile: {
                    ...(filters.name
                        ? {
                              fullname: {
                                  contains: filters.name,
                                  mode: 'insensitive' as const,
                              },
                          }
                        : {}),
                },
                ...(filters.fixedClassId
                    ? {
                          fixedClassId: filters.fixedClassId,
                      }
                    : {}),
                ...(filters.trainingObjectId
                    ? {
                          trainingObjectTypeId: filters.trainingObjectId,
                      }
                    : {}),
                fixedClass: {
                    ...(filters.trainingCourseId
                        ? {
                              trainingCourseId: filters.trainingCourseId,
                          }
                        : {}),
                },
            },
        }),
        [
            filters.decisionDate,
            filters.diplomaIssueDate,
            filters.diplomaNumber,
            filters.trainingMajorId,
            filters.managementOrganizationId,
            filters.trainingFieldId,
            filters.name,
            filters.code,
            filters.fixedClassId,
            filters.trainingObjectId,
            filters.trainingCourseId,
            filters.originalDiplomaNumber,
        ]
    )

    const { data = [], refetch } = useFindManyGraduationDecision({
        where,
        include: {
            student: {
                include: {
                    userProfile: true,
                    fixedClass: {
                        select: {
                            trainingCourseId: true,
                        },
                    },
                    graduationDecision: {
                        select: {
                            id: true,
                        },
                    },
                },
            },
            trainingMajor: true,
            diplomaType: true,
            finalRanking: true,
        },
        orderBy: [
            ...emptyObjectIf(
                [
                    {
                        finalGpa: filters.finalGpa,
                    },
                ],
                !!filters.finalGpa
            ),
            {
                createdAt: 'desc',
            },
        ],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountGraduationDecision({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }
    const { onOpen } = useDisclosure<{
        id: string
        trainingCourseId: string
    }>({
        tag: PutGraduationDecision.name,
    })
    const { onOpen: onOpenVanBang } = useDisclosure<string>({
        tag: ModalVanBang.name,
    })
    const { data: diplomaTypeData = [] } = useFindManyDiplomaType()
    const { data: organization = [] } = useFindManyDM_DonVi({
        orderBy: { sTen: 'asc' },
    })
    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType({
        orderBy: { name: 'asc' },
    })
    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })
    const { data: trainingFieldData = [] } = useFindManyTrainingField({
        orderBy: { name: 'asc' },
    })
    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
    })
    const { data: fixedClassData = [] } = useFindManyFixedClass({
        orderBy: { name: 'asc' },
    })

    const treeData = buildOrgTree(organization)

    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24}>
                            <Flex>
                                <Col span={4}>
                                    <Form.Item
                                        className="mb-0"
                                        name="managementOrganizationId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <TreeSelect
                                            placeholder="Chọn đơn vị quản lý"
                                            allowClear
                                            showSearch
                                            treeDefaultExpandAll
                                            onChange={(val) =>
                                                handleFilterChange('managementOrganizationId', val)
                                            }
                                            treeData={treeData}
                                            filterTreeNode={(input, node) =>
                                                (node.label as string)
                                                    .toLowerCase()
                                                    .includes(input.toLowerCase())
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item className="mb-0" name="trainingCourseId">
                                        <Select
                                            placeholder="Khoá đào tạo"
                                            options={trainingCourseData.map(
                                                (i: TrainingCourse) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            onChange={(val) =>
                                                handleFilterChange('trainingCourseId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item className="mb-0" name="trainingObjectId">
                                        <Select
                                            placeholder="Chọn đối tượng đào tạo"
                                            options={trainingObjectTypeData.map(
                                                (i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            onChange={(val) =>
                                                handleFilterChange('trainingObjectId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item className="mb-0" name="trainingFieldId">
                                        <Select
                                            placeholder="Chọn ngành"
                                            options={trainingFieldData.map((i: TrainingField) => ({
                                                value: i.id,
                                                label: i.name,
                                            }))}
                                            onChange={(val) =>
                                                handleFilterChange('trainingFieldId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item className="mb-0" name="trainingMajorId">
                                        <Select
                                            placeholder="Chọn chuyên ngành"
                                            options={trainingMajorData.map((i: TrainingMajor) => ({
                                                value: i.id,
                                                label: i.name,
                                            }))}
                                            onChange={(val) =>
                                                handleFilterChange('trainingMajorId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item className="mb-0" name="fixedClassId">
                                        <Select
                                            placeholder="Chọn lớp biên chế"
                                            options={fixedClassData.map((i: FixedClass) => ({
                                                value: i.id,
                                                label: i.name,
                                            }))}
                                            onChange={(val) =>
                                                handleFilterChange('fixedClassId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey={'key'}
                        data={data}
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'Mã sinh viên',
                                align: 'center',
                                dataIndex: 'code',
                                width: 120,
                                fixed: 'left',
                                type: 'input',
                                render: (_, record) => record?.student?.code || '',
                            },
                            {
                                title: 'Họ và tên',
                                width: 200,
                                dataIndex: 'name',
                                fixed: 'left',
                                type: 'input',
                                render: (_, record) => record?.student?.userProfile?.fullname,
                            },
                            {
                                title: 'Ngày duyệt đơn',
                                dataIndex: 'decisionDate',
                                align: 'center',
                                type: 'date',
                                width: 130,
                                render: (_, record) =>
                                    record.decisionDate
                                        ? dayjs(record.decisionDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'GPA cuối cùng',
                                align: 'center',
                                width: 100,
                                dataIndex: 'finalGpa',
                                type: 'order',
                                render: (_, record) => record?.finalGpa?.toNumber(),
                            },
                            {
                                title: 'Loại bằng',
                                align: 'center',
                                type: 'select',
                                options: diplomaTypeData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                width: 100,
                                render: (_, record) => record?.diplomaType?.name,
                            },
                            {
                                title: 'Số hiệu văn bằng',
                                align: 'center',
                                dataIndex: 'diplomaNumber',
                                type: 'input',
                                width: 120,
                                render: (_, record) => record?.diplomaNumber,
                            },
                            {
                                title: 'Số vào sổ gốc văn bằng',
                                align: 'center',
                                dataIndex: 'originalDiplomaNumber',
                                type: 'input',
                                width: 120,
                                render: (_, record) => record?.originalDiplomaNumber,
                            },
                            {
                                title: 'Ngày cấp bằng',
                                dataIndex: 'diplomaIssueDate',
                                align: 'center',
                                type: 'date',
                                width: 120,
                                render: (_, record) =>
                                    record.diplomaIssueDate
                                        ? dayjs(record.diplomaIssueDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Số lần sao y',
                                dataIndex: 'totalCopy',
                                align: 'center',
                                width: 80,
                            },
                            {
                                title: 'Xếp loại',
                                align: 'center',
                                // type: 'select',
                                // dataIndex: 'classification',
                                width: 100,
                                render: (_, record) => record?.finalRanking?.classification,
                            },
                            {
                                title: 'Ghi chú của hội đồng',
                                width: 200,
                                render: (_, record) => record?.notes,
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <ViewIcon
                                                    title="Xem văn bằng"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenVanBang(record?.student?.id)
                                                    }}
                                                />
                                                <EditIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpen({
                                                            id: record?.id,
                                                            trainingCourseId:
                                                                record?.student?.fixedClass
                                                                    ?.trainingCourseId,
                                                        })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
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

GraduationDecisionDiploma.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
