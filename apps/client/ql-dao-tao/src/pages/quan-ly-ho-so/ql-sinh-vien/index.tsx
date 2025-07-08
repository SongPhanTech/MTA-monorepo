import { UploadOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import { FilterSinhVien } from '@components/filter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import ViewIcon from '@components/icons/view'
import { PutStudentModal, PutUpdateProfileModal, PutUploadProfileModal } from '@components/modal'
import ImportStudentModal from '@components/modal/import-excel-student'
import {
    DEFAULT_PAGINATE_SIZE,
    FIXED_CLASS_STUDENT_STATUS,
    GENDER_MEAN,
} from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { $Enums } from '@workspace/db'
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
    const [filters, setFilters] = useState({
        searchText: '',
    })

    const [importModalVisible, setImportModalVisible] = useState(false)

    const router = useRouter()
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const { data = [], refetch } = useFindManyStudent({
        where: {
            userProfile: {
                OR: [
                    {
                        firstName: {
                            contains: filters.searchText,
                        },
                    },
                    {
                        lastName: {
                            contains: filters.searchText,
                        },
                    },
                ],
            },
            trainingObjectType: {
                type: {
                    equals: $Enums.TrainingObjectTypes.CIVILIAN,
                },
            },
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

    // const handleTrainingCourseChange = (value: string) => {
    //     setSelectedTrainingCourse(value)

    //     // Kiểm tra xem lớp hiện tại có thuộc khóa mới không
    //     if (selectedFixedClass) {
    //         const selectedClass = FixedClassData?.find((cls) => cls.id === selectedFixedClass)

    //         // Nếu lớp hiện tại không thuộc khóa mới được chọn
    //         if (selectedClass?.trainingCourseId !== value) {
    //             setSelectedFixedClass(undefined) // Reset lớp
    //         }
    //     }

    //     // Nếu khóa chỉ có 1 lớp, tự động chọn lớp đó
    //     const classesInCourse =
    //         FixedClassData?.filter((cls) => cls.trainingCourseId === value) || []

    //     if (classesInCourse.length === 1 && !selectedFixedClass) {
    //         setSelectedFixedClass(classesInCourse[0].id)
    //     }

    //     refetch()
    // }

    const { data: FixedClassData = [] } = useFindManyFixedClass({
        include: {
            trainingCourse: true,
        },
    })

    const { data: TrainingFieldData = [] } = useFindManyTrainingField()

    const { data: TrainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const { data: TrainingCurriculumVersionData = [] } = useFindManyCurriculumVersion({
        orderBy: { name: 'asc' },
    })

    const { data: count } = useCountStudent({
        where: {
            userProfile: {
                OR: [
                    {
                        firstName: {
                            contains: filters.searchText,
                        },
                    },
                    {
                        lastName: {
                            contains: filters.searchText,
                        },
                    },
                ],
            },
            trainingObjectType: {
                type: {
                    equals: $Enums.TrainingObjectTypes.CIVILIAN,
                },
            },
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
        tag: PutStudentModal.name,
    })

    const { onOpen: onOpenUpload } = useDisclosure<string>({
        tag: PutUploadProfileModal.name,
    })
    const { onOpen: onOpenUpdateFile } = useDisclosure<string>({
        tag: PutUpdateProfileModal.name,
    })
    const { onOpen: onOpenUpdate } = useDisclosure<{
        tag?: string
        preSelectedValues?: {
            trainingObjectTypeId?: string
            trainingCourseId?: string
            fixedClassId?: string
        }
        id: string | null
    }>({
        tag: PutStudentModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen({
            preSelectedValues: {},
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
            onClick: () => handleModalUpload('upload'),
        },
        {
            key: 'update',
            label: 'Nhập file cập nhật thông tin sinh viên',
            onClick: () => handleModalUpload('update'),
        },
    ]

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
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
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
                                width: 120,
                                align: 'center',
                                fixed: 'left',
                            },
                            {
                                title: 'Họ và tên',
                                align: 'center',
                                width: 180,
                                fixed: 'left',
                                render: (record) =>
                                    record.userProfile
                                        ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                                        : '',
                            },
                            {
                                title: 'Ngày sinh',
                                align: 'center',
                                width: 150,
                                render: (record) =>
                                    record.userProfile?.dateOfBirth
                                        ? dayjs(record.userProfile.dateOfBirth).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Giới tính',
                                align: 'center',
                                width: 100,
                                filters: [
                                    {
                                        text: 'Nam',
                                        value: 'Male',
                                    },
                                    {
                                        text: 'Nữ',
                                        value: 'Female',
                                    },
                                ],
                                onFilter: (value, record) => record.userProfile?.gender === value,
                                render: (record) =>
                                    record.userProfile?.gender
                                        ? GENDER_MEAN[
                                              record.userProfile.gender as keyof typeof GENDER_MEAN
                                          ]
                                        : '',
                            },
                            {
                                title: 'Đối tượng ĐT',
                                align: 'center',
                                width: 130,
                                // filters: TrainingOnjectTypeData.map((item) => ({
                                //     text: item.name,
                                //     value: item.name,
                                // })),
                                // onFilter: (value, record) =>
                                //     record.trainingObjectType.name === value,
                                render: (record) =>
                                    record.trainingObjectType ? record.trainingObjectType.name : '',
                            },
                            {
                                title: 'Lớp',
                                align: 'center',
                                width: 200,
                                filters: FixedClassData.map((item) => ({
                                    text: `${item.code}-${item.name}`,
                                    value: `${item.code}-${item.name}`,
                                })),
                                onFilter: (value, record) => {
                                    const fiexedClass = `${record.fixedClass?.code}-${record.fixedClass?.name}`
                                    return fiexedClass === value
                                },
                                render: (record) => {
                                    const fiexedClass = `${record.fixedClass?.code}-${record.fixedClass?.name}`
                                    return fiexedClass || ''
                                },
                            },
                            {
                                title: 'Khóa',
                                align: 'center',
                                width: 100,
                                filters: TrainingCourseData.map((item) => ({
                                    text: item.name,
                                    value: item.name,
                                })),
                                onFilter: (value, record) => {
                                    const trainingCourseName =
                                        record?.fixedClass?.trainingCourse?.name
                                    return trainingCourseName === value
                                },
                                render: (record) => {
                                    const trainingCourse = record?.fixedClass?.trainingCourse
                                    return trainingCourse ? trainingCourse?.name : ''
                                },
                            },
                            {
                                title: 'Ngành',
                                align: 'center',
                                width: 160,
                                filters: TrainingFieldData.map((item) => ({
                                    text: item.name,
                                    value: item.name,
                                })),
                                onFilter: (value, record) => {
                                    const trainingField =
                                        record?.fixedClass?.curriculumVersion?.curriculum
                                            ?.trainingMajor?.trainingField?.name
                                    return trainingField === value
                                },
                                render: (record) => {
                                    return record?.fixedClass?.curriculumVersion?.curriculum
                                        ?.trainingMajor?.trainingField?.name
                                },
                            },
                            {
                                title: 'Chuyên ngành',
                                align: 'center',
                                width: 180,
                                filters: TrainingMajorData.map((item) => ({
                                    text: item.name,
                                    value: item.name,
                                })),
                                onFilter: (value, record) => {
                                    const trainingMajor =
                                        record?.fixedClass?.curriculumVersion?.curriculum
                                            ?.trainingMajor?.name
                                    return trainingMajor === value
                                },
                                render: (record) => {
                                    return record?.fixedClass?.curriculumVersion?.curriculum
                                        ?.trainingMajor?.name
                                },
                            },
                            {
                                title: 'CTĐT',
                                align: 'center',
                                width: 180,
                                filters: TrainingCurriculumVersionData.map((item) => ({
                                    text: item.name,
                                    value: item.name,
                                })),
                                render: (record) => {
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
                        rowSelection={{
                            selectedRowKeys,
                            onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
                        }}
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
