import { UploadOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import { FilterSinhVien } from '@components/filter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import ViewIcon from '@components/icons/view'
import { PutHocvienModal, PutUpdateProfileModal, PutUploadProfileModal } from '@components/modal'
import ExportTemplateStudent from '@components/modal/export-template-student'
import ImportStudentModal from '@components/modal/import-excel-student'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import {
    DEFAULT_PAGINATE_SIZE,
    FIXED_CLASS_STUDENT_STATUS,
    GENDER_MEAN,
} from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    $Enums,
    type FixedClass,
    type TrainingCourse,
    type TrainingField,
    type TrainingMajor,
} from '@workspace/db'
import {
    useCountStudent,
    useFindManyCurriculumVersion,
    useFindManyFixedClass,
    useFindManyStudent,
    useFindManyTemplateFile,
    useFindManyTrainingCourse,
    useFindManyTrainingField,
    useFindManyTrainingMajor,
    useUpdateStudent,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, Menu, message, Row, Tag } from 'antd'
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
    })

    const [importModalVisible, setImportModalVisible] = useState(false)
    const [open, setOpen] = useState(false)

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
    }

    const router = useRouter()

    // const [selectedTrainingObjectType, setSelectedTrainingObjectType] = useState<string>()
    const [selectedTrainingCourse, setSelectedTrainingCourse] = useState<string>()
    const [selectedFixedClass, setSelectedFixedClass] = useState<string>()
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const { data = [], refetch } = useFindManyStudent({
        where: {
            trainingObjectType: {
                type: {
                    not: $Enums.TrainingObjectTypes.CIVILIAN,
                },
            },
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
                ...(filters.gender
                    ? {
                          gender: {
                              in: filters.gender,
                          },
                      }
                    : {}),
                ...(filters.dateOfBirth?.length === 2
                    ? {
                          dateOfBirth: {
                              gte: dayjs(filters.dateOfBirth?.[0]).toDate(),
                              lte: dayjs(filters.dateOfBirth?.[1]).toDate(),
                          },
                      }
                    : {}),
            },
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

    const { data: TrainingCourseData = [], refetch: refetchTrainingCourse } =
        useFindManyTrainingCourse({
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

    const { data: count } = useCountStudent({
        where: {
            trainingObjectType: {
                type: {
                    not: $Enums.TrainingObjectTypes.CIVILIAN,
                },
            },
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
                ...(filters.gender
                    ? {
                          gender: {
                              in: filters.gender,
                          },
                      }
                    : {}),
                ...(filters.dateOfBirth?.length === 2
                    ? {
                          dateOfBirth: {
                              gte: dayjs(filters.dateOfBirth?.[0]).toDate(),
                              lte: dayjs(filters.dateOfBirth?.[1]).toDate(),
                          },
                      }
                    : {}),
            },
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
        tag: PutHocvienModal.name,
    })

    const { onOpen: onOpenUpload, onClose: onCloseUpload } = useDisclosure<string>({
        tag: PutUploadProfileModal.name,
    })
    const { onOpen: onOpenUpdateFile, onClose: onCloseUpdateFile } = useDisclosure<string>({
        tag: PutUpdateProfileModal.name,
    })
    const { onOpen: onOpenUpdate, onClose: onCloseUpdate } = useDisclosure<{
        tag?: string
        preSelectedValues?: {
            trainingObjectTypeId?: string
            trainingCourseId?: string
            fixedClassId?: string
        }
        id: string | null
    }>({
        tag: PutHocvienModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen({
            preSelectedValues: {
                trainingCourseId: selectedTrainingCourse,
                fixedClassId: selectedFixedClass,
            },
        })
    }
    const handleModalUpload = (type: string) => {
        if (type === 'upload') {
            onOpenUpload('SV')
        } else {
            onOpenUpdateFile('SV')
        }
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
        }
        hideSpinner()
    }

    const { data: templateFile = [], refetch: refetchTemplateFile } = useFindManyTemplateFile()

    const handleFilterChange = (
        key: string,
        value: string | { startDate?: string; endDate?: string }
    ) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const handleDownloadTemplate = (type: string) => {
        const fileRecord = templateFile?.find((item) => item.code === type)
        const fileLink = fileRecord ? fileRecord.path : null
        if (fileLink) {
            const link = document.createElement('a')
            link.href = fileLink
            link.setAttribute('download', '')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    const itemsDownload = [
        {
            key: 'import',
            label: 'Tải file nhập thông tin sinh viên',
            onClick: () => handleDownloadTemplate('IMPORT_USERPROFILE'),
        },
        {
            key: 'update',
            label: 'Tải file cập nhật thông tin sinh viên',
            onClick: () => handleDownloadTemplate('UPDATE_USERPROFILE'),
        },
    ]

    const itemsUpload = [
        {
            key: 'upload',
            label: 'Nhập file nhập thông tin sinh viên',
            onClick: () => () => setImportModalVisible(true),
        },
        {
            key: 'update',
            label: 'Nhập file cập nhật thông tin sinh viên',
            onClick: () => handleModalUpload('update'),
        },
    ]
    const menuDownload = (
        <Menu>
            {itemsDownload.map((item) => (
                <Menu.Item key={item.key} onClick={item.onClick}>
                    {item.label}
                </Menu.Item>
            ))}
        </Menu>
    )

    const menuUpload = (
        <Menu>
            {itemsUpload.map((item) => (
                <Menu.Item key={item.key} onClick={item.onClick}>
                    {item.label}
                </Menu.Item>
            ))}
        </Menu>
    )

    const handleImportConfirm = (importedData: any) => {
        showSpinner()

        try {
            // const updatedScores = dataTable.map((record) => {
            //     const importedScore = importedData.find(
            //         (item) => item.studentCode === record.student?.code
            //     )

            //     if (importedScore) {
            //         return {
            //             id: record.id,
            //             attendanceScore: importedScore.attendanceScore,
            //             midtermScore: importedScore.midtermScore,
            //             examScore: importedScore.examScore,
            //         }
            //     }
            //     return record
            // })

            // // Cập nhật state
            // const newScoreCC = updatedScores.map((item) => ({
            //     id: item.id,
            //     value: item.attendanceScore || 0,
            // }))
            // const newScoreTX = updatedScores.map((item) => ({
            //     id: item.id,
            //     value: item.midtermScore || 0,
            // }))
            // const newScoreThi = updatedScores.map((item) => ({
            //     id: item.id,
            //     value: item.examScore || 0,
            // }))

            // setScoreCC(newScoreCC)
            // setScoreTX(newScoreTX)
            // setScoreThi(newScoreThi)

            message.success('Nhập dữ liệu từ file thành công!')
        } catch (_error) {
            message.error('Có lỗi xảy ra khi nhập dữ liệu từ file')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[8, 8]} align="top" justify="space-between">
                        <Col span={12}>
                            <FilterSinhVien
                                handleFilterChange={handleFilterChange}
                                filters={filters}
                                setFilters={setFilters}
                            />
                        </Col>
                        {/* <Col flex="1 1" >
                            <Select
                                placeholder="Đối tượng đào tạo"
                                style={{ width: '100%' }}
                                options={TrainingOnjectTypeData?.map((item) => {
                                    return {
                                        value: item.id,
                                        label: item.name,
                                    }
                                })}
                                value={selectedTrainingObjectType}
                                onChange={handleTrainingObjectTypeChange}
                            />
                        </Col>
                        <Col flex="1 1" >
                            <Select
                                placeholder="Khóa đào tạo"
                                style={{ width: '100%' }}
                                options={TrainingCourseData?.map((item) => {
                                    return {
                                        value: item.id,
                                        label: item.name,
                                    }
                                })}
                                value={selectedTrainingCourse}
                                onChange={handleTrainingCourseChange}
                            />
                        </Col>
                        <Col flex="1 1" >
                            <Select
                                placeholder="Lớp"
                                style={{ width: '100%' }}
                                options={filteredFixedClassData?.map((item) => {
                                    return {
                                        value: item.id,
                                        label: `${item.code}-${item.name}`,
                                    }
                                })}
                                value={selectedFixedClass}
                                onChange={handleFixedClassChange}
                            />
                        </Col> */}

                        {/* Hàng chứa các button */}
                        <Col xs={12}>
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
                                {/* <Dropdown overlay={menuDownload} trigger={['hover']}>
                                    <Button type="primary" icon={<DownloadOutlined />}>
                                        Tải file mẫu
                                    </Button>
                                </Dropdown> */}
                                {/* <Dropdown overlay={menuUpload} trigger={['hover']}>
                                    <Button type="primary" icon={<UploadOutlined />}>
                                        Nhập file
                                    </Button>
                                </Dropdown> */}
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
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                width: 150,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
                                multiple: [
                                    'name',
                                    'gender',
                                    'dateOfBirth',
                                    'curriculumVersion',
                                    'trainingField',
                                    'trainingMajors',
                                    'fixedClass',
                                    'trainingCourse',
                                ],
                            },
                            {
                                title: 'Họ và tên',
                                align: 'center',
                                width: 180,
                                fixed: 'left',
                                render: (__, record) =>
                                    record.userProfile
                                        ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                                        : '',
                                type: 'input',
                                dataIndex: 'name',
                                multiple: [
                                    'code',
                                    'gender',
                                    'dateOfBirth',
                                    'curriculumVersion',
                                    'trainingField',
                                    'trainingMajors',
                                    'fixedClass',
                                    'trainingCourse',
                                ],
                            },
                            {
                                title: 'Ngày sinh',
                                align: 'center',
                                width: 150,
                                dataIndex: 'dateOfBirth',
                                multiple: [
                                    'name',
                                    'gender',
                                    'code',
                                    'curriculumVersion',
                                    'trainingField',
                                    'trainingMajors',
                                    'fixedClass',
                                    'trainingCourse',
                                ],
                                type: 'date',
                                render: (__, record) =>
                                    record.userProfile?.dateOfBirth
                                        ? dayjs(record.userProfile.dateOfBirth).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Giới tính',
                                align: 'center',
                                width: 100,
                                type: 'select',
                                dataIndex: 'gender',
                                multiple: [
                                    'name',
                                    'code',
                                    'dateOfBirth',
                                    'curriculumVersion',
                                    'trainingField',
                                    'trainingMajors',
                                    'fixedClass',
                                    'trainingCourse',
                                ],
                                options: [
                                    { label: 'Nam', value: 'Male' },
                                    { label: 'Nữ', value: 'Female' },
                                ],

                                render: (__, record) =>
                                    record.userProfile?.gender
                                        ? GENDER_MEAN[
                                              record.userProfile.gender as keyof typeof GENDER_MEAN
                                          ]
                                        : '',
                            },
                            {
                                title: 'ĐTĐT',
                                align: 'center',
                                width: 150,
                                render: (__, record) =>
                                    record.trainingObjectType ? record.trainingObjectType.name : '',
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
                                multiple: [
                                    'name',
                                    'gender',
                                    'dateOfBirth',
                                    'curriculumVersion',
                                    'trainingField',
                                    'trainingMajors',
                                    'code',
                                    'trainingCourse',
                                ],
                                render: (__, record) => {
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
                                multiple: [
                                    'name',
                                    'gender',
                                    'dateOfBirth',
                                    'curriculumVersion',
                                    'trainingField',
                                    'trainingMajors',
                                    'fixedClass',
                                    'code',
                                ],
                                options: TrainingCourseData.map((item: TrainingCourse) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (__, record) => {
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
                                multiple: [
                                    'name',
                                    'gender',
                                    'dateOfBirth',
                                    'curriculumVersion',
                                    'code',
                                    'trainingMajors',
                                    'fixedClass',
                                    'trainingCourse',
                                ],
                                options: trainingFieldData.map((item: TrainingField) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (__, record) => {
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
                                multiple: [
                                    'name',
                                    'gender',
                                    'dateOfBirth',
                                    'curriculumVersion',
                                    'trainingField',
                                    'code',
                                    'fixedClass',
                                    'trainingCourse',
                                ],
                                render: (__, record) => {
                                    return record?.fixedClass?.curriculumVersion?.curriculum
                                        ?.trainingMajor?.name
                                },
                            },
                            {
                                title: 'CTĐT',
                                align: 'center',
                                dataIndex: 'curriculumVersion',
                                width: 180,
                                multiple: [
                                    'name',
                                    'gender',
                                    'dateOfBirth',
                                    'code',
                                    'trainingField',
                                    'trainingMajors',
                                    'fixedClass',
                                    'trainingCourse',
                                ],
                                options: TrainingCurriculumVersionData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                type: 'select',
                                render: (__, record) => {
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
                                        <ViewIcon
                                            onClick={() =>
                                                router.push(
                                                    ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_QL_SINH_VIEN_ID.replace(
                                                        '[id]',
                                                        id
                                                    )
                                                )
                                            }
                                        />
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
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
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
