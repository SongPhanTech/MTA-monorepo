import {
    DownCircleFilled,
    DownloadOutlined,
    EyeOutlined,
    UploadOutlined,
} from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
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
import {
    useCountUserProfile,
    useFindManyUserProfile,
    useFindManyTrainingForm,
    useUpdateUserProfile,
    useFindManyTrainingType,
    useFindManyTrainingObjectType,
    useFindManyTrainingLevel,
    useFindManyUserType,
    useFindManyTemplateFile,
} from '@workspace/db/hooks'
import type {
    UserProfile,
    SchoolYear,
    TrainingForm,
    TrainingLevel,
    TrainingType,
    TrainingObjectType,
    UserType,
} from '@workspace/db'

import {
    Button,
    Col,
    Divider,
    Dropdown,
    Flex,
    Form,
    Input,
    Menu,
    Row,
    Space,
    Tag,
    Tooltip,
    message,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { TRAINING_COURSE_STATUS } from '@constants/constants'
import Select from '@components/commons/select'
import { FilterSinhVien } from '@components/filter'

dayjs.locale('vi')
export default function UserProfilePageDs() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState({
        searchText: '',
    })

    const { data = [], refetch } = useFindManyUserProfile({
        where: {
            firstName: {
                contains: filters.searchText,
            },
            userType: {
                is: {
                    code: 'SV',
                },
            },
        },
        include: {
            userType: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountUserProfile({
        where: {
            firstName: {
                contains: filters.searchText,
            },
            userType: {
                is: {
                    code: 'SV',
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
    const { mutateAsync: updateUserProfile } = useUpdateUserProfile()
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
    const { data: userTypeData = [], refetch: refetchUserType } =
        useFindManyUserType()
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
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24}>
                            <Flex>
                                <Col span={8} className="pl-0">
                                    <FilterSinhVien
                                        handleFilterChange={handleFilterChange}
                                        filters={filters}
                                        setFilters={setFilters}
                                    />
                                </Col>
                                <Col span={16}>
                                    <Flex justify="end">
                                        <Button
                                            onClick={handleModal}
                                            type="primary"
                                        >
                                            Thêm mới
                                        </Button>

                                        {/* Gói Dropdown vào Space để đảm bảo chỉ có một child */}
                                        <Dropdown
                                            overlay={menuDownload}
                                            trigger={['hover']}
                                        >
                                            <Button
                                                className="ml-4"
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
                                                className="ml-4"
                                                type="primary"
                                                icon={<UploadOutlined />}
                                            >
                                                Nhập file
                                            </Button>
                                        </Dropdown>
                                    </Flex>
                                </Col>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: (_, __, index) =>
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                align: 'center',
                            },
                            {
                                title: 'Họ và tên',
                                align: 'center',
                                render: ({
                                    firstName,
                                    lastName,
                                }: { firstName: string; lastName: string }) =>
                                    `${lastName} ${firstName}`,
                            },
                            // {
                            //     title: 'Đối tượng',
                            //     dataIndex: 'UserType',
                            //     render: (value) => value?.name ? value?.name : ""
                            // },
                            {
                                title: 'Ngày sinh',
                                align: 'center',
                                // dataIndex: 'startDate',
                                render: ({ dateOfBirth }) =>
                                    dayjs(dateOfBirth).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Giới tính',
                                align: 'center',
                                // dataIndex: 'gender',
                                render: ({ gender }) =>
                                    GENDER_MEAN[
                                        gender as keyof typeof GENDER_MEAN
                                    ],
                            },
                            {
                                title: 'Lớp',
                                align: 'center',
                                dataIndex: 'fixedClassStudent',
                                render: (value) =>
                                    value?.length > 0
                                        ? value[0]?.fixedClass?.name
                                        : 'Chưa phân lớp',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 130,
                                render: (record: UserProfile) => {
                                    return (
                                        <Select
                                            className="w-[155px]"
                                            value={
                                                record?.fixedClassStudent[0]
                                                    .status
                                            }
                                            // onChange={(newStatus) =>
                                            //     handleStatusChange(
                                            //         record.id,
                                            //         newStatus as FixedClassStudentStatus
                                            //     )
                                            // }
                                            options={options}
                                            optionLabelProp="label"
                                            // style={{ width: 180 }}
                                            bordered={false}
                                            showSearch={false}
                                        />
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <Tooltip
                                            title="Xem chi tiết"
                                            placement="leftTop"
                                        >
                                            <EyeOutlined
                                                onClick={onOpenUpdate.bind(
                                                    null,
                                                    { id: id, code: 'SV' }
                                                )}
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                        </Tooltip>
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
