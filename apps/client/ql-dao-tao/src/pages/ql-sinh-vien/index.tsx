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
    useCountUserProfile,
    useFindManyTemplateFile,
    useFindManyOrganization,
    useFindManyStudent,
    useUpdateStudent,
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
    const [selectedDoiTuong, setSelectedDoiTuong] = useState<string>()

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
                userType: {
                    is: {
                        code: 'SV',
                    },
                },
                ...(selectedDoiTuong && {
                    organizationName: {
                        equals: selectedDoiTuong,
                    },
                }),
            }
        },
        include: {
            userProfile: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountUserProfile({
        where: {
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
            ...(selectedDoiTuong && {
                organizationName: {
                    equals: selectedDoiTuong,
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

    const { data: organizationData } = useFindManyOrganization()

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

    const handleDoiTuongChange = (value: string) => {
        setSelectedDoiTuong(value)
        refetch()
    }

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
                                options={organizationData?.map((item) => {
                                    return {
                                        value: item.name,
                                        label: item.name,
                                    }
                                })}
                                value={selectedDoiTuong}
                                onChange={handleDoiTuongChange}
                            />
                        </Col>
                        <Col flex="1 1" className="max-w-[350px]">
                            <Select
                                placeholder="Khóa đào tạo"
                                style={{ width: '100%' }}
                            />
                        </Col>
                        <Col flex="1 1">
                            <Select
                                placeholder="Lớp"
                                style={{ width: '100%' }}
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
                                render: ({
                                    firstName,
                                    lastName,
                                }: { firstName: string; lastName: string }) =>
                                    `${lastName} ${firstName}`,
                            },
                            {
                                title: 'Ngày sinh',
                                align: 'center',
                                width: 100,
                                render: ({ dateOfBirth }) =>
                                    dayjs(dateOfBirth).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Giới tính',
                                align: 'center',
                                width: 80,
                                render: ({ gender }) =>
                                    GENDER_MEAN[
                                    gender as keyof typeof GENDER_MEAN
                                    ],
                            },
                            {
                                title: 'Đối tượng ĐT',
                                align: 'center',
                                width: 120,
                                dataIndex: 'UserType',
                                render: (value) => value?.name || '',
                            },
                            {
                                title: 'Lớp',
                                align: 'center',
                                width: 120,
                                dataIndex: 'fixedClassStudent',
                                render: (value) =>
                                    value?.length > 0
                                        ? value[0]?.fixedClass?.name
                                        : 'Chưa phân lớp',
                            },
                            {
                                title: 'Khóa',
                                align: 'center',
                                width: 100,
                                dataIndex: 'educationLevel',
                            },
                            {
                                title: 'Ngành',
                                align: 'center',
                                width: 120,
                                dataIndex: 'trainingType',
                            },
                            {
                                title: 'Chuyên ngành',
                                align: 'center',
                                width: 130,
                                dataIndex: 'trainingObjectType',
                            },
                            {
                                title: 'Chương trình đào tạo',
                                align: 'center',
                                width: 130,
                                dataIndex: 'trainingForm',
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
