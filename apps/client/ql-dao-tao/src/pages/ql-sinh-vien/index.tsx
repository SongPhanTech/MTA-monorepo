import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import {
    PutUpdateProfileModal,
    PutUploadProfileModal,
    PutUserProfileModal,
    PutUserProfileUpdateModal,
} from '@components/modal'
import {
    DEFAULT_PAGINATE_SIZE,
    GENDER_MEAN,
    TRANG_THAI_HOC_VIEN,
} from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { UserProfile } from '@workspace/db'
import {
    useFindManyTemplateFile,
    useFindManyStudent,
    useUpdateStudent,
    useFindManyTrainingObjectType,
    useFindManyTrainingCourse,
    useCountStudent,
    useFindManyFixedClass,
} from '@workspace/db/hooks'

import Select from '@components/commons/select'
import { FilterSinhVien } from '@components/filter'
import EditIcon from '@components/icons/edit'
import {
    Button,
    Col,
    Divider,
    Dropdown,
    Flex,
    Menu,
    Row,
    Tag,
    message,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
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
    const [selectedTrainingObjectType, setSelectedTrainingObjectType] =
        useState<string>()
    const [selectedTrainingCourse, setSelectedTrainingCourse] =
        useState<string>()
    const [selectedFixedClass, setSelectedFixedClass] = useState<string>()

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
                    curriculum: true,
                },
            },
            fixedClass: {
                include: {
                    trainingCourse: true,
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

    const { data: TrainingCourseData, refetch: refetchTrainingCourse } =
        useFindManyTrainingCourse()

    const handleTrainingCourseChange = (value: string) => {
        setSelectedTrainingCourse(value)
        refetch()
    }

    const { data: FixedClassData } = useFindManyFixedClass()

    const handleFixedClassChange = (value: string) => {
        setSelectedFixedClass(value)
        refetch()
    }

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
        id: string | null
        code: string
    }>({
        tag: PutUserProfileModal.name,
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
        id: string | null
        code: string
    }>({
        tag: PutUserProfileUpdateModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen({ id: null, code: 'SV' })
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
    const options = Object.entries(TRANG_THAI_HOC_VIEN).map(
        ([value, { label, color }]) => ({
            value,
            label: <Tag color={color}>{label}</Tag>, // hiển thị trong dropdown
        })
    )

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Sinh viên
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
                        <Col flex="1 1" className="max-w-[350px]">
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
                        <Col flex="1 1" className="max-w-[350px]">
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
                        <Col flex="1 1">
                            <Select
                                placeholder="Lớp"
                                style={{ width: '100%' }}
                                options={FixedClassData?.map((item) => {
                                    return {
                                        value: item.id,
                                        label: item.name,
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
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Họ và tên',
                                align: 'center',
                                width: 150,
                                render: (record) =>
                                    record.userProfile
                                        ? `${record.userProfile.firstName} ${record.userProfile.lastName}`
                                        : '',
                            },
                            {
                                title: 'Ngày sinh',
                                align: 'center',
                                width: 100,
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
                                width: 80,
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
                                width: 120,
                                render: (record) =>
                                    record.trainingObjectType
                                        ? record.trainingObjectType.name
                                        : '',
                            },
                            {
                                title: 'Lớp',
                                align: 'center',
                                width: 120,
                                render: (record) => {
                                    const fiexedClass = record.fixedClass?.name
                                    return fiexedClass || ''
                                },
                            },
                            {
                                title: 'Khóa',
                                align: 'center',
                                width: 100,
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
                                width: 120,
                                render: (record) => {
                                    const trainingField =
                                        record.trainingObjectType
                                            ?.trainingFields?.[0]?.trainingField
                                    return trainingField?.name || ''
                                },
                            },
                            {
                                title: 'Chuyên ngành',
                                align: 'center',
                                width: 130,
                                render: (record) => {
                                    const trainingMajor =
                                        record.trainingObjectType
                                            ?.trainingMajors?.[0]?.trainingMajor
                                    return trainingMajor?.name || ''
                                },
                            },
                            {
                                title: 'Chương trình đào tạo',
                                align: 'center',
                                width: 150,
                                render: (record) => {
                                    const curriculum =
                                        record.trainingObjectType
                                            ?.curriculum?.[0]
                                    return curriculum ? curriculum.name : ''
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <EditIcon
                                            onClick={onOpenUpdate.bind(null, {
                                                id: id,
                                                code: 'SV',
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
                        data={data}
                        scroll={{ x: 'max-content' }}
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
