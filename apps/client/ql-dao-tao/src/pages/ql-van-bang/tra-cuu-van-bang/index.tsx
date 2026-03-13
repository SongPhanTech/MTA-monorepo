import Select from '@components/commons/select'
import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import ViewIcon from '@components/icons/view'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import {
    $Enums,
    type FixedClass,
    type TrainingCourse,
    type TrainingField,
    type TrainingMajor,
    type TrainingObjectType,
} from '@workspace/db/client'
import {
    useCountGraduationDecision,
    useFindManyDiplomaType,
    useFindManyDM_DonVi,
    useFindManyFixedClass,
    useFindManyGraduationDecision,
    useFindManySemester,
    useFindManyTrainingCourse,
    useFindManyTrainingField,
    useFindManyTrainingMajor,
} from '@workspace/db/hooks'
import { whereOrganization } from '@workspace/libs/constants'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { useFindManyTrainingObjectTypePermission, useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Flex, Form, Row, Tooltip } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { BookCheckIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import TreeSelect from '@/components/commons/tree-select'
export default function GraduationDecisionDiploma() {
    const { can, canSome } = useAbility()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [student, setStudent] = useState<any>(null)
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
        idCardNumber: '',
        diplomaTypeId: undefined,
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
            ...(filters.diplomaTypeId
                ? {
                      diplomaTypeId: Array.isArray(filters.diplomaTypeId)
                          ? { in: filters.diplomaTypeId }
                          : filters.diplomaTypeId,
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
                    ...(filters.idCardNumber
                        ? {
                              idCardNumber: {
                                  contains: filters.idCardNumber,
                                  mode: 'insensitive' as const,
                              },
                          }
                        : {}),
                },
                ...(filters.fixedClassId
                    ? {
                          fixedClassId: filters.fixedClassId,
                      }
                    : filters.trainingCourseId
                      ? { fixedClass: { trainingCourseId: filters.trainingCourseId } }
                      : trainingObjectTypeId
                        ? { fixedClass: { trainingCourse: { trainingObjectTypeId } } }
                        : {}),
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
            filters.idCardNumber,
            filters.diplomaTypeId,
        ]
    )

    const { data = [], refetch } = useFindManyGraduationDecision({
        where,
        include: {
            student: {
                include: {
                    userProfile: true,
                    curriculumVersion: {
                        include: {
                            trainingLevel: true,
                            curriculum: {
                                include: {
                                    trainingMajor: {
                                        include: {
                                            trainingField: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    fixedClass: {
                        include: {
                            trainingCourse: {
                                include: {
                                    trainingObjectType: true,
                                    scoreConverts: true,
                                },
                            },
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
            { originalDiplomaNumber: 'asc' },
            { student: { userProfile: { firstName: 'asc' } } },
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
        tag: 'PutGraduationDecision',
    })
    const { onOpen: onOpenVanBang } = useDisclosure<string>({
        tag: 'ModalVanBang',
    })
    const { data: diplomaTypeData = [] } = useFindManyDiplomaType()
    const { data: organization = [] } = useFindManyDM_DonVi({
        orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
        where: whereOrganization,
    })
    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectTypePermission({
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
        where: { trainingObjectTypeId, deletedAt: null, active: true },
    })
    const { data: fixedClassData = [] } = useFindManyFixedClass({
        orderBy: { name: 'asc' },
    })

    const treeData = buildOrgTree(organization)

    const { onOpen: onOpenPhuLucVanBang, onClose } = useDisclosure<{
        dataTable: any
        dataStudent: any
    }>({
        tag: 'ModalPrintToKQHT',
    })

    const { onOpen: onOpenPhuLucThacSi } = useDisclosure<string>({
        tag: 'ModalPhuLucThacSi',
    })

    const { data: dataTable } = useFindManySemester(
        {
            where: {
                subjectClasses: {
                    some: {
                        subjectClassStudent: {
                            some: {
                                studentId: student?.id,
                            },
                        },
                    },
                },
            },
            include: {
                subjectClasses: {
                    where: {
                        subjectClassStudent: {
                            some: {
                                studentId: student?.id,
                            },
                        },
                    },
                    include: {
                        subjectClassStudent: {
                            where: {
                                studentId: student?.id,
                            },
                            include: {
                                subjectVersion: true,
                                certificates: {
                                    include: {
                                        archivedCertificate: true,
                                    },
                                },
                                awards: {
                                    where: {
                                        status: $Enums.ArchivedCertificateStatus.APPROVED,
                                    },
                                    include: {
                                        archivedAward: true,
                                    },
                                },
                            },
                        },
                    },
                },
                trainingCoursesStart: {
                    where: {
                        id: student?.fixedClass?.trainingCourseId ?? undefined,
                    },
                    include: {
                        scoreConverts: true,
                    },
                },
                schoolYear: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        },
        { enabled: !!student?.id }
    )

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
                                            placeholder="Chọn lớp quản lý"
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
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
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
                                title: 'Căn cước công dân',
                                width: 200,
                                dataIndex: 'idCardNumber',
                                fixed: 'left',
                                type: 'input',
                                render: (_, record) => record?.student?.userProfile?.idCardNumber,
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
                                title: 'GPA',
                                align: 'center',
                                width: 60,
                                dataIndex: 'finalGpa',
                                type: 'order',
                                render: (_, record) => record?.finalGpa?.toNumber(),
                            },
                            {
                                title: 'Loại bằng',
                                dataIndex: 'diplomaTypeId',
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
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_VAN_BANG_TRA_CUU_VAN_BANG,
                                    'XEM_CHI_TIET',
                                    'SUA'
                                ),
                                render: (_, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_VAN_BANG_TRA_CUU_VAN_BANG,
                                                    'XEM_CHI_TIET'
                                                ) && (
                                                    <>
                                                        <ViewIcon
                                                            title="Xem văn bằng"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                onOpenVanBang(record?.student?.id)
                                                            }}
                                                        />
                                                        <Tooltip
                                                            title="Phụ lục văn bằng"
                                                            placement="top"
                                                        >
                                                            <BookCheckIcon
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setStudent(record?.student)
                                                                    if (
                                                                        record?.diplomaType
                                                                            ?.type === 'MASTER'
                                                                    ) {
                                                                        // xử lý riêng cho MASTER
                                                                        onOpenPhuLucThacSi(
                                                                            record?.studentId
                                                                        )
                                                                    } else {
                                                                        // xử lý mặc định
                                                                        onOpenPhuLucVanBang({
                                                                            dataStudent:
                                                                                record?.student,
                                                                            dataTable,
                                                                        })
                                                                    }
                                                                }}
                                                                size={16}
                                                            />
                                                        </Tooltip>
                                                    </>
                                                )}
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_VAN_BANG_TRA_CUU_VAN_BANG,
                                                    'SUA'
                                                ) && (
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
                                                )}
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
