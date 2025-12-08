import { UploadOutlined } from '@ant-design/icons'
import { InfoIcon } from 'lucide-react'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import ExportTemplateStudent from '@components/modal/export-template-student'
import ImportStudentModal from '@components/modal/import-excel-student'
import { DEFAULT_PAGINATE_SIZE, FIXED_CLASS_STUDENT_STATUS } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type {
    FixedClass,
    TrainingCourse,
    TrainingField,
    TrainingMajor,
    UserProfile,
} from '@workspace/db/client'
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
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, Form, message, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { BookCheckIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')
export default function UserProfilePageDs() {
    const router = useRouter()
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
        trainingCourseId: undefined,
        fixedClassId: undefined,
        rank: undefined,
        phone: undefined,
        curriculumVersionParallel: undefined,
    })

    const form = Form.useForm<{ trainingCourseId: string }>()

    const [importModalVisible, setImportModalVisible] = useState(false)
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const where: any = useMemo(
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
            ...((filters.name && filters.name !== '') ||
            (filters.rank && filters.rank !== '') ||
            (filters.phone && filters.phone !== '')
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
                          ...(filters.rank
                              ? {
                                    rank: {
                                        sTen: {
                                            contains: filters.rank,
                                            mode: 'insensitive',
                                        },
                                    },
                                }
                              : {}),
                          ...(filters.phone
                              ? {
                                    phoneNumber: {
                                        contains: filters.phone,
                                        mode: 'insensitive',
                                    },
                                }
                              : {}),
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
            ...(filters.curriculumVersionParallel
                ? {
                      curriculumVersionParallelId: {
                          in: filters.curriculumVersionParallel,
                      },
                  }
                : undefined),
            ...(filters.fixedClass
                ? {
                      fixedClassId: {
                          in: filters.fixedClass,
                      },
                  }
                : {}),
            ...(filters.fixedClassId
                ? {
                      fixedClassId: filters.fixedClassId,
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
            ...(filters.trainingCourseId
                ? {
                      fixedClass: {
                          trainingCourseId: filters.trainingCourseId,
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
        [filters, trainingObjectTypeId]
    )

    const { data = [], refetch } = useFindManyStudent({
        where,
        include: {
            userProfile: {
                include: {
                    rank: true,
                },
            },
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
            curriculumVersionParallel: true,
        },
        orderBy: [{ userProfile: { firstName: 'asc' } }, { userProfile: { lastName: 'asc' } }],
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
        where: {
            trainingCourse: {
                trainingObjectTypeId,
                deletedAt: null,
                active: true,
            },
        },
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

    const { onOpen: onOpenDetail } = useDisclosure({
        tag: 'ModalChiTietSinhVien',
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
                where: { id },
                data: { deletedAt: new Date() },
            })
            message.success('Xóa thành công')
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
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={12}>
                            <Flex>
                                <Col span={12}>
                                    <Select
                                        className="w-full"
                                        placeholder="Chọn khoá học"
                                        options={TrainingCourseData.map((i: TrainingCourse) => ({
                                            value: i.id,
                                            label: i.name,
                                        }))}
                                        onChange={(val) =>
                                            setFilters({
                                                ...filters,
                                                trainingCourseId: val,
                                            })
                                        }
                                        allowClear
                                    />
                                </Col>

                                <Col span={12}>
                                    <Select
                                        className="w-full"
                                        placeholder="Chọn lớp quản lý"
                                        options={fixedClassData.map((i: FixedClass) => ({
                                            value: i.id,
                                            label: i.name,
                                        }))}
                                        onChange={(val) =>
                                            setFilters({
                                                ...filters,
                                                fixedClassId: val,
                                            })
                                        }
                                        allowClear
                                    />
                                </Col>
                            </Flex>
                        </Col>
                        <Col xs={12}>
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
                                            onCancel={() => {
                                                setImportModalVisible(false)
                                                refetch()
                                            }}
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
                                title: 'SĐT',
                                align: 'center',
                                width: 120,
                                dataIndex: 'phone',
                                type: 'input',
                                render: (__, record) =>
                                    record.userProfile?.phoneNumber
                                        ? record.userProfile?.phoneNumber
                                        : '',
                            },
                            {
                                title: 'Cấp bậc',
                                align: 'center',
                                width: 120,
                                dataIndex: 'rank',
                                type: 'input',
                                render: (__, record) =>
                                    record.userProfile?.rank?.sTen
                                        ? record.userProfile?.rank?.sTen
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
                                    const fixedClass = `${record.fixedClass?.code || ''} - ${
                                        record.fixedClass?.name
                                    }`
                                    return fixedClass || ''
                                },
                            },
                            {
                                title: 'Khoá',
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
                                title: 'CTĐT song song',
                                align: 'center',
                                dataIndex: 'curriculumVersionParallel',
                                width: 180,
                                type: 'select',
                                options: TrainingCurriculumVersionData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (__, record) => {
                                    return record?.curriculumVersionParallel?.name || ''
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
                                width: 130,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => (
                                    <Row className="justify-center gap-2">
                                        <Tooltip title="Xem chi tiết" placement="top">
                                            <InfoIcon
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onOpenDetail(record.id)
                                                }}
                                                size={16}
                                                className="text-green-600 cursor-pointer"
                                            />
                                        </Tooltip>
                                        {/* <Tooltip title="Phụ lục văn bằng" placement="top">
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
                                        </Tooltip> */}
                                        <Tooltip title="Kết quả học tập" placement="top">
                                            <BookCheckIcon
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    router.push(
                                                        ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_KET_QUA_HOC_TAP_ID.replace(
                                                            '[id]',
                                                            record.id
                                                        )
                                                    )
                                                }}
                                                size={16}
                                                className="cursor-pointer"
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
