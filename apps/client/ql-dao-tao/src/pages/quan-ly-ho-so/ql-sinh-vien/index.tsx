import { UploadOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import ExportTemplateStudent from '@components/modal/export-template-student'
import ImportStudentModal from '@components/modal/import-excel-student'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { DEFAULT_PAGINATE_SIZE, FIXED_CLASS_STUDENT_STATUS } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type {
    FixedClass,
    TrainingCourse,
    TrainingField,
    TrainingMajor,
    UserProfile,
} from '@workspace/db'
import {
    useCountStudent,
    useFindManyCurriculumVersion,
    useFindManyFixedClass,
    useFindManySemester,
    useFindManyStudent,
    useFindManyTrainingCourse,
    useFindManyTrainingField,
    useFindManyTrainingMajor,
    useUpdateStudent,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, message, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { BookCheckIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')
export default function UserProfilePageDs() {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [student, setStudent] = useState<any>(null)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        dateOfBirth: undefined,
        trainingField: undefined,
        gender: undefined,
        fixedClass: undefined,
        trainingCourse: undefined,
        trainingMajors: undefined,
        curriculumVersion: undefined,
    })

    const [importModalVisible, setImportModalVisible] = useState(false)
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const where = useMemo(
        () => ({
            // ...(filters.trainingObjectTypes && {
            //     trainingObjectTypeId: { in: filters.trainingObjectTypes },
            // }),
            trainingObjectTypeId,
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
                      userProfile: {
                          OR: [
                              {
                                  firstName: {
                                      contains: filters.name,
                                      mode: 'insensitive' as const,
                                  },
                              },
                              {
                                  lastName: {
                                      contains: filters.name,
                                      mode: 'insensitive' as const,
                                  },
                              },
                              {
                                  fullname: {
                                      contains: filters.name,
                                      mode: 'insensitive' as const,
                                  },
                              },
                          ],
                      },
                  }
                : {}),
            ...(filters.curriculumVersion
                ? {
                      curriculumVersionId: {
                          in: filters.curriculumVersion,
                      },
                  }
                : {}),
            ...(filters.fixedClass
                ? {
                      fixedClassId: {
                          in: filters.fixedClass,
                      },
                  }
                : {}),
            ...(filters.trainingCourse
                ? {
                      fixedClass: {
                          trainingCourseId: {
                              in: filters.trainingCourse,
                          },
                      },
                  }
                : {}),
            ...(filters.trainingMajors || filters.trainingField
                ? {
                      fixedClass: {
                          curriculumVersion: {
                              curriculum: {
                                  trainingMajor: {
                                      ...(filters.trainingMajors
                                          ? {
                                                id: {
                                                    in: filters.trainingMajors,
                                                },
                                            }
                                          : {}),
                                      ...(filters.trainingField
                                          ? {
                                                trainingFieldId: {
                                                    in: filters.trainingField,
                                                },
                                            }
                                          : {}),
                                  },
                              },
                          },
                      },
                  }
                : {}),
        }),
        [
            filters.code,
            filters.name,
            trainingObjectTypeId,
            filters.trainingMajors,
            filters.fixedClass,
            filters.trainingField,
            filters.curriculumVersion,
            filters.trainingCourse,
        ]
    )

    const { data = [] } = useFindManyStudent({
        where,
        include: {
            userProfile: true,
            trainingObjectType: true,
            fixedClass: {
                include: {
                    trainingCourse: {
                        include: {
                            scoreConverts: true,
                        },
                    },
                    curriculumVersion: {
                        include: {
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
                },
            },
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
            trainingForm: true,
        },
        orderBy: {
            userProfile: {
                firstName: 'asc',
            },
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountStudent({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { data: TrainingCourseData = [] } = useFindManyTrainingCourse({
        include: {
            fixedClass: true,
        },
        orderBy: { name: 'asc' },
        where: { trainingObjectTypeId, deletedAt: null, active: true },
    })

    const { data: fixedClassData = [] } = useFindManyFixedClass({
        include: {
            trainingCourse: true,
        },
    })

    const { data: trainingFieldData = [] } = useFindManyTrainingField()

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const { data: TrainingCurriculumVersionData = [] } = useFindManyCurriculumVersion({
        orderBy: { name: 'asc' },
    })

    const { onOpen, onClose } = useDisclosure<{
        tag?: string
        preSelectedValues?: {
            trainingObjectTypeId?: string
            trainingCourseId?: string
            fixedClassId?: string
        }
        id?: string | null
    }>({
        tag: 'PutStudentModal',
    })

    const { onOpen: onOpenUpdate } = useDisclosure<{
        tag?: string
        id: string | null
    }>({
        tag: 'PutStudentModal',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen({
            preSelectedValues: {},
        })
    }
    const { mutateAsync: updateUserProfile } = useUpdateStudent()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateUserProfile({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error) {
            console.log(error)

            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

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

    const { onOpen: onOpenPhuLucVanBang } = useDisclosure<{
        dataTable: any
        dataStudent: any
    }>({
        tag: 'ModalPrintToKQHT',
    })

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[8, 8]} align="top" justify="end">
                        <Col xs={24}>
                            <Flex justify="end" wrap="wrap" gap="8px" className="mt-1">
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_QL_SINH_VIEN,
                                    'NHAP_EXCEL'
                                ) && (
                                    <>
                                        <Button
                                            type="primary"
                                            onClick={() => setImportModalVisible(true)}
                                            icon={<UploadOutlined />}
                                        >
                                            Nhập dữ liêu Excel
                                        </Button>
                                        <ImportStudentModal
                                            visible={importModalVisible}
                                            onCancel={() => setImportModalVisible(false)}
                                        />
                                        <ExportTemplateStudent />
                                    </>
                                )}
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_QL_SINH_VIEN,
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
                <Col span={24}>
                    <Table
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
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                width: 130,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
                                render: (__, record: any) => (record.code ? record?.code : ''),
                            },
                            {
                                title: 'Họ và tên',
                                align: 'center',
                                width: 180,
                                fixed: 'left',
                                dataIndex: 'name',
                                type: 'input',
                                render: (__, record: { userProfile?: UserProfile }) =>
                                    record.userProfile
                                        ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                                        : '',
                            },
                            {
                                title: 'ĐTĐT',
                                align: 'center',
                                width: 150,
                                // type: 'select',
                                dataIndex: 'trainingObjectTypes',
                                // options: trainingObjectTypeData.map((item: TrainingObjectType) => ({
                                //     label: item.name,
                                //     value: item.id,
                                // })),
                                render: (__, record: any) =>
                                    record?.trainingObjectType
                                        ? record?.trainingObjectType?.name
                                        : '',
                            },
                            {
                                title: 'Lớp',
                                align: 'center',
                                width: 200,
                                dataIndex: 'fixedClass',
                                type: 'select',
                                options: fixedClassData.map((item: FixedClass) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (__, record: any) => {
                                    if (!record.fixedClass) return ''
                                    const fiexedClass = `${record.fixedClass?.code || ''} - ${record.fixedClass?.name}`
                                    return fiexedClass || ''
                                },
                            },
                            {
                                title: 'Khóa',
                                align: 'center',
                                width: 100,
                                dataIndex: 'trainingCourse',
                                type: 'select',
                                options: TrainingCourseData.map((item: TrainingCourse) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (__, record: any) => {
                                    const trainingCourse = record?.fixedClass?.trainingCourse
                                    return trainingCourse ? trainingCourse?.name : ''
                                },
                            },
                            {
                                title: 'Ngành',
                                align: 'center',
                                width: 160,
                                dataIndex: 'trainingField',
                                type: 'select',
                                options: trainingFieldData.map((item: TrainingField) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (__, record: any) => {
                                    return record?.fixedClass?.curriculumVersion?.curriculum
                                        ?.trainingMajor?.trainingField?.name
                                },
                            },
                            {
                                title: 'Chuyên ngành',
                                align: 'center',
                                width: 180,
                                type: 'select',
                                dataIndex: 'trainingMajors',
                                options: trainingMajorData.map((item: TrainingMajor) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (__, record: any) => {
                                    return record?.fixedClass?.curriculumVersion?.curriculum
                                        ?.trainingMajor?.name
                                },
                            },
                            {
                                title: 'CTĐT',
                                align: 'center',
                                dataIndex: 'curriculumVersion',
                                width: 180,
                                type: 'select',
                                options: TrainingCurriculumVersionData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (__, record: any) => {
                                    return record?.fixedClass?.curriculumVersion?.name
                                },
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 120,
                                render: (_, record) => {
                                    const statusInfo =
                                        FIXED_CLASS_STUDENT_STATUS[
                                            record.status as keyof typeof FIXED_CLASS_STUDENT_STATUS
                                        ]
                                    return statusInfo ? (
                                        <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                                    ) : (
                                        <Tag color="default">Không xác định</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => (
                                    <Row className="justify-center gap-2">
                                        <Tooltip title="Phụ lục văn bằng" placement="top">
                                            <BookCheckIcon
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setStudent(record)
                                                    onOpenPhuLucVanBang({
                                                        dataStudent: record,
                                                        dataTable,
                                                    })
                                                }}
                                                size={16}
                                            />
                                        </Tooltip>
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_QL_SINH_VIEN,
                                            'SUA'
                                        ) && (
                                            <EditIcon
                                                onClick={onOpenUpdate.bind(null, {
                                                    id: record.id,
                                                })}
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                        )}
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_QL_SINH_VIEN,
                                            'XOA'
                                        ) && (
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () => handleDelete(record.id),
                                                }}
                                            />
                                        )}
                                    </Row>
                                ),
                            },
                        ]}
                        rowKey="id"
                        // rowSelection={{
                        //     selectedRowKeys,
                        //     onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
                        // }}
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
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

UserProfilePageDs.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
