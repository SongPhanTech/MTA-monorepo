import {
    DownloadOutlined,
    UploadOutlined,
    UserOutlined,
} from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import {
    PutStudentModal,
    PutUpdateProfileModal,
    PutUploadProfileModal,
} from '@components/modal'
import {
    DEFAULT_PAGINATE_SIZE,
    FIXED_CLASS_STUDENT_STATUS,
    GENDER_MEAN,
} from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'

import Select from '@components/commons/select'
import { FilterSinhVien } from '@components/filter'
import EditIcon from '@components/icons/edit'
import ViewIcon from '@components/icons/view'
import { getMinioUrl } from '@workspace/constant'
import {
    useCountStudent,
    useFindManyFixedClass,
    useFindManyStudent,
    useFindManyTemplateFile,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useUpdateStudent,
} from '@workspace/db/hooks'
import {
    useFindManyCurriculumVersion,
    // useFindManyFixedClass,
    // useFindManyStudent,
    // useFindManyTemplateFile,
    // useFindManyTrainingCourse,
    useFindManyTrainingField,
    useFindManyTrainingMajor,
    // useFindManyTrainingObjectType,
    // useUpdateStudent,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import {
    Button,
    Col,
    Divider,
    Dropdown,
    Flex,
    Image,
    Menu,
    Row,
    Tag,
    message,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')
export default function UserProfilePageDs() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState({
        searchText: '',
    })

    const router = useRouter()

    const [selectedTrainingObjectType, setSelectedTrainingObjectType] =
        useState<string>()
    const [selectedTrainingCourse, setSelectedTrainingCourse] =
        useState<string>()
    const [selectedFixedClass, setSelectedFixedClass] = useState<string>()
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
            ...(selectedTrainingObjectType && {
                trainingObjectTypeId: {
                    equals: selectedTrainingObjectType,
                },
            }),
            ...(selectedTrainingCourse && {
                fixedClass: {
                    trainingCourseId: {
                        equals: selectedTrainingCourse,
                    },
                },
            }),
            ...(selectedFixedClass && {
                fixedClassId: {
                    equals: selectedFixedClass,
                },
            }),
        },
        include: {
            userProfile: true,
            trainingObjectType: {
                include: {
                    trainingFields: {
                        include: {
                            trainingField: true,
                        },
                    },
                    trainingMajors: {
                        include: {
                            trainingMajor: true,
                        },
                    },
                },
            },
            fixedClass: {
                include: {
                    trainingCourse: true,
                    curriculumVersion: {
                        include: {
                            curriculum: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const {
        data: TrainingOnjectTypeData = [],
        refetch: refetchTrainingObjectType,
    } = useFindManyTrainingObjectType()

    const handleTrainingObjectTypeChange = (value: string) => {
        setSelectedTrainingObjectType(value)
        refetch()
    }

    const { data: TrainingCourseData = [], refetch: refetchTrainingCourse } =
        useFindManyTrainingCourse({
            include: {
                fixedClass: true,
            },
        })

    const handleTrainingCourseChange = (value: string) => {
        setSelectedTrainingCourse(value)

        // Kiểm tra xem lớp hiện tại có thuộc khóa mới không
        if (selectedFixedClass) {
            const selectedClass = FixedClassData?.find(
                (cls) => cls.id === selectedFixedClass
            )

            // Nếu lớp hiện tại không thuộc khóa mới được chọn
            if (selectedClass?.trainingCourseId !== value) {
                setSelectedFixedClass(undefined) // Reset lớp
            }
        }

        // Nếu khóa chỉ có 1 lớp, tự động chọn lớp đó
        const classesInCourse =
            FixedClassData?.filter((cls) => cls.trainingCourseId === value) ||
            []

        if (classesInCourse.length === 1 && !selectedFixedClass) {
            setSelectedFixedClass(classesInCourse[0].id)
        }

        refetch()
    }

    const { data: FixedClassData = [] } = useFindManyFixedClass({
        include: {
            trainingCourse: true,
        },
    })

    const { data: TrainingFieldData = [] } = useFindManyTrainingField()

    const { data: TrainingMajorData = [] } = useFindManyTrainingMajor()

    const { data: TrainingCurriculumVersionData = [] } =
        useFindManyCurriculumVersion()

    const handleFixedClassChange = (value: string) => {
        setSelectedFixedClass(value)

        const selectedClass = FixedClassData?.find((cls) => cls.id === value)

        if (selectedClass?.trainingCourseId) {
            const newCourse = selectedClass.trainingCourseId

            // Tự động set khóa học tương ứng với lớp
            setSelectedTrainingCourse(newCourse)
        }

        refetch()
    }

    const filteredFixedClassData = useMemo(() => {
        if (!selectedTrainingCourse) {
            return FixedClassData
        }

        return (
            FixedClassData?.filter(
                (cls) => cls.trainingCourseId === selectedTrainingCourse
            ) || []
        )
    }, [FixedClassData, selectedTrainingCourse])

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
            ...(selectedTrainingObjectType && {
                trainingObjectTypeId: {
                    equals: selectedTrainingObjectType,
                },
            }),
            ...(selectedTrainingCourse && {
                fixedClass: {
                    trainingCourseId: {
                        equals: selectedTrainingCourse,
                    },
                },
            }),
            ...(selectedFixedClass && {
                fixedClassId: {
                    equals: selectedFixedClass,
                },
            }),
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

    const { onOpen: onOpenUpload, onClose: onCloseUpload } =
        useDisclosure<string>({
            tag: PutUploadProfileModal.name,
        })
    const { onOpen: onOpenUpdateFile, onClose: onCloseUpdateFile } =
        useDisclosure<string>({
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
        tag: PutStudentModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen({
            preSelectedValues: {
                trainingObjectTypeId: selectedTrainingObjectType,
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

    const { data: templateFile = [], refetch: refetchTemplateFile } =
        useFindManyTemplateFile()

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

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Sinh viên / Học viên
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[8, 8]} align="top" justify="space-between">
                        <Col flex="1 1">
                            <FilterSinhVien
                                handleFilterChange={handleFilterChange}
                                filters={filters}
                                setFilters={setFilters}
                            />
                        </Col>
                        <Col flex="1 1" className="max-w-[300px]">
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
                        <Col flex="1 1" className="max-w-[300px]">
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
                        <Col flex="1 1" className="max-w-[300px]">
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
                        </Col>

                        {/* Hàng chứa các button */}
                        <Col xs={24}>
                            <Flex
                                justify="end"
                                wrap="wrap"
                                gap="8px"
                                className="mt-1"
                            >
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                                <Dropdown
                                    overlay={menuDownload}
                                    trigger={['hover']}
                                >
                                    <Button
                                        type="primary"
                                        icon={<DownloadOutlined />}
                                    >
                                        Tải file mẫu
                                    </Button>
                                </Dropdown>
                                <Dropdown
                                    overlay={menuUpload}
                                    trigger={['hover']}
                                >
                                    <Button
                                        type="primary"
                                        icon={<UploadOutlined />}
                                    >
                                        Nhập file
                                    </Button>
                                </Dropdown>
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
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Ảnh',
                                align: 'center',
                                width: 120,
                                render: (_, record) => {
                                    const avatar = record.userProfile?.avatar

                                    return avatar ? (
                                        <Image
                                            src={getMinioUrl(avatar)}
                                            width={100}
                                            height={80}
                                        />
                                    ) : (
                                        <div className="flex justify-center items-center ml-[10px] w-20 h-16 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                            <UserOutlined
                                                style={{
                                                    fontSize: 32,
                                                    color: '#bfbfbf',
                                                }}
                                            />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Họ và tên',
                                align: 'center',
                                width: 180,
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
                                        ? dayjs(
                                              record.userProfile.dateOfBirth
                                          ).format('DD/MM/YYYY')
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
                                onFilter: (value, record) =>
                                    record.userProfile.gender === value,
                                render: (record) =>
                                    record.userProfile?.gender
                                        ? GENDER_MEAN[
                                              record.userProfile
                                                  .gender as keyof typeof GENDER_MEAN
                                          ]
                                        : '',
                            },
                            {
                                title: 'Đối tượng ĐT',
                                align: 'center',
                                width: 130,
                                filters: TrainingOnjectTypeData.map((item) => ({
                                    text: item.name,
                                    value: item.name,
                                })),
                                onFilter: (value, record) =>
                                    record.trainingObjectType.name === value,
                                render: (record) =>
                                    record.trainingObjectType
                                        ? record.trainingObjectType.name
                                        : '',
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
                                        record.fixedClass?.trainingCourse?.name
                                    return trainingCourseName === value
                                },
                                render: (record) => {
                                    const trainingCourse =
                                        record.fixedClass?.trainingCourse
                                    return trainingCourse
                                        ? trainingCourse.name
                                        : ''
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
                                        record.fixedClass.curriculumVersion
                                            ?.curriculum?.trainingMajor
                                            ?.trainingField?.name
                                    return trainingField === value
                                },
                                render: (record) => {
                                    return record.fixedClass.curriculumVersion
                                        ?.curriculum?.trainingMajor
                                        ?.trainingField?.name
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
                                        record.fixedClass?.curriculumVersion
                                            ?.curriculum?.trainingMajor?.name
                                    return trainingMajor === value
                                },
                                render: (record) => {
                                    return record.fixedClass?.curriculumVersion
                                        ?.curriculum?.trainingMajor?.name
                                },
                            },
                            {
                                title: 'Chương trình đào tạo',
                                align: 'center',
                                width: 180,
                                filters: TrainingCurriculumVersionData.map(
                                    (item) => ({
                                        text: item.name,
                                        value: item.name,
                                    })
                                ),
                                render: (record) => {
                                    return record.fixedClass?.curriculumVersion
                                        ?.curriculum?.name
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
                                        <Tag color={statusInfo.color}>
                                            {statusInfo.label}
                                        </Tag>
                                    ) : (
                                        <Tag color="default">
                                            Không xác định
                                        </Tag>
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
                                                onConfirm: () =>
                                                    handleDelete(id),
                                            }}
                                        />
                                    </Row>
                                ),
                            },
                        ]}
                        rowKey="id"
                        rowSelection={{
                            selectedRowKeys,
                            onChange: (selectedKeys) =>
                                setSelectedRowKeys(selectedKeys),
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
