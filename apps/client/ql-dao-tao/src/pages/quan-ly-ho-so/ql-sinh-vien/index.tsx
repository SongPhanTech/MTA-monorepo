import { UploadOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import ExportTemplateStudent from '@components/modal/export-template-student'
import ImportStudentModal from '@components/modal/import-excel-student'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import {
    DEFAULT_PAGINATE_SIZE,
    FIXED_CLASS_STUDENT_STATUS,
    TRAINING_OBJECT_TYPE,
} from '@constants/constants'
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
    useFindManyStudent,
    useFindManyTrainingCourse,
    useFindManyTrainingField,
    useFindManyTrainingMajor,
    useUpdateStudent,
} from '@workspace/db/hooks'
// import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')
export default function UserProfilePageDs() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
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
        trainingObjectType: undefined,
    })

    const [importModalVisible, setImportModalVisible] = useState(false)

    const router = useRouter()
    const { data = [], refetch } = useFindManyStudent({
        where: {
            trainingObjectType: {
                type: {
                    in: filters?.trainingObjectType
                        ? filters?.trainingObjectType
                        : ['MILITARY', 'CIVILIAN', 'INTERNATIONAL_MILITARY'],
                },
            },
            ...(filters.name
                ? {
                      userProfile: {
                          OR: [
                              {
                                  firstName: {
                                      contains: filters.name,
                                  },
                              },
                              {
                                  lastName: {
                                      contains: filters.name,
                                  },
                              },
                          ],
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
        },
        include: {
            userProfile: true,
            trainingObjectType: true,
            fixedClass: {
                include: {
                    trainingCourse: true,
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
            trainingObjectType: {
                type: {
                    in: filters?.trainingObjectType
                        ? filters?.trainingObjectType
                        : ['MILITARY', 'CIVILIAN', 'INTERNATIONAL_MILITARY'],
                },
            },
            ...(filters.name
                ? {
                      userProfile: {
                          OR: [
                              {
                                  firstName: {
                                      contains: filters.name,
                                  },
                              },
                              {
                                  lastName: {
                                      contains: filters.name,
                                  },
                              },
                          ],
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
        },
    })

    const { data: TrainingCourseData = [] } = useFindManyTrainingCourse({
        include: {
            fixedClass: true,
        },
        orderBy: { name: 'asc' },
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

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
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

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[8, 8]} align="top" justify="end">
                        <Col xs={24}>
                            <Flex justify="end" wrap="wrap" gap="8px" className="mt-1">
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
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
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
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                width: 130,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
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
                                type: 'select',
                                dataIndex: 'trainingObjectType',
                                options: Object.keys(TRAINING_OBJECT_TYPE).map((key) => {
                                    return {
                                        label: TRAINING_OBJECT_TYPE[
                                            key as keyof typeof TRAINING_OBJECT_TYPE
                                        ],
                                        value: key,
                                    }
                                }),
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
                                    const fiexedClass = `${record.fixedClass?.code}-${record.fixedClass?.name}`
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
                                    value: item.name,
                                })),
                                render: (__, record: any) => {
                                    return record?.fixedClass?.curriculumVersion?.curriculum?.name
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
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        {/* <ViewIcon
                                            onClick={() =>
                                                router.push(
                                                    ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_QL_SINH_VIEN_ID.replace(
                                                        '[id]',
                                                        id
                                                    )
                                                )
                                            }
                                        /> */}
                                        <EditIcon
                                            onClick={onOpenUpdate.bind(null, {
                                                id: id,
                                            })}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
                                        <DeleteIcon
                                            popConfirm={{
                                                onConfirm: () => handleDelete(id),
                                            }}
                                        />
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
