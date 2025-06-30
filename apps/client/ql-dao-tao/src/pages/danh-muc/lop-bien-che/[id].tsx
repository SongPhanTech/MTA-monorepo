import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import {
    AddStudentToFixedClassModal,
    PutStudentModal,
    PutUpdateProfileModal,
    PutUploadProfileModal,
} from '@components/modal'
import {
    CUSSTOM_VI_LOCALE,
    DEFAULT_PAGINATE_SIZE,
    FIXED_CLASS_STUDENT_STATUS,
    GENDER_LIST,
    GENDER_MEAN,
} from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountStudent,
    useFindManyStudent,
    useFindManyTemplateFile,
    useFindUniqueFixedClass,
    useUpdateManyStudent,
    useUpdateStudent,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import {
    Button,
    Col,
    DatePicker,
    Divider,
    Dropdown,
    Flex,
    Form,
    Input,
    Menu,
    message,
    Popconfirm,
    Row,
    Select,
    Tag,
    Tooltip,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { BookCheckIcon, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')

export default function StudentFixedClassPage() {
    const router = useRouter()
    const fixedClassId = router.query.id as string
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const [open, setOpen] = useState(false)
    const [filters, setFilters] = useState({
        searchText: '',
        dateOfBirth: [],
        gender: null,
    })

    const { data: fixedClass } = useFindUniqueFixedClass(
        {
            where: {
                id: fixedClassId,
            },
            include: {
                trainingCourse: {
                    include: {
                        trainingObjectType: true,
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
        {
            enabled: !!fixedClassId,
        }
    )

    const { data = [], refetch } = useFindManyStudent({
        where: {
            fixedClassId,
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
                dateOfBirth: {
                    gte: filters.dateOfBirth?.[0],
                    lte: filters.dateOfBirth?.[1],
                },
                ...(filters.gender ? { gender: filters.gender } : {}),
            },
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
                    curriculum: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountStudent({
        where: {
            fixedClassId,
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
                dateOfBirth: {
                    gte: filters.dateOfBirth?.[0],
                    lte: filters.dateOfBirth?.[1],
                },

                ...(filters.gender ? { gender: filters.gender } : {}),
            },
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<{
        id: string
    }>({
        tag: AddStudentToFixedClassModal.name,
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
        onOpen({ id: fixedClassId })
    }

    const handleModalUpload = (type: string) => {
        if (type === 'upload') {
            onOpenUpload('SV')
        } else {
            onOpenUpdateFile('SV')
        }
    }
    const { mutateAsync: updateUserProfile } = useUpdateStudent()
    const { mutateAsync: updateManyUserProfile } = useUpdateManyStudent()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateUserProfile({
                where: {
                    id,
                },
                data: {
                    fixedClassId: null,
                },
            })
            setSelectedRowKeys([])
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    async function handleDeleteMulti() {
        try {
            showSpinner()
            if (selectedRowKeys?.length > 0) {
                await updateManyUserProfile({
                    where: {
                        id: {
                            in: selectedRowKeys,
                        },
                    },
                    data: {
                        fixedClassId: null,
                    },
                })
            }
            setOpen(false)
            setSelectedRowKeys([])
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: templateFile = [], refetch: refetchTemplateFile } = useFindManyTemplateFile()

    const handleFilterChange = (
        key: string,
        value: string | { startDate?: string; endDate?: string } | string[]
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

    const handleCancel = () => {
        setOpen(false)
    }

    const showPopconfirm = () => {
        setOpen(true)
    }

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                {fixedClass?.trainingCourse?.trainingObjectType.name} -{' '}
                {fixedClass?.trainingCourse?.name} - {fixedClass?.curriculumVersion?.name} -{' '}
                {fixedClass?.curriculumVersion?.curriculum.trainingMajor.name} -{' '}
                {fixedClass?.curriculumVersion?.curriculum.trainingMajor.trainingField.name}
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[8, 8]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Form.Item name="searchText">
                                    <Input
                                        id="search"
                                        onChange={(e) =>
                                            handleFilterChange('searchText', e.target.value)
                                        }
                                        placeholder="Tìm kiếm"
                                        style={{
                                            width: 200,
                                            marginRight: 8,
                                            height: 32,
                                        }}
                                        prefix={
                                            <Search
                                                size={16}
                                                style={{
                                                    color: 'rgba(0, 0, 0, 0.25)',
                                                }}
                                            />
                                        }
                                        allowClear
                                    />
                                </Form.Item>
                                <Form.Item
                                    className="mb-0"
                                    name="gender"
                                    labelCol={{ span: 24 }}
                                    wrapperCol={{ span: 24 }}
                                    labelAlign="left"
                                >
                                    <Select
                                        placeholder="Chọn giới tính"
                                        options={GENDER_LIST.map((i) => {
                                            return {
                                                value: i.id,
                                                label: i.name,
                                            }
                                        })}
                                        style={{
                                            width: 200,
                                            marginRight: 8,
                                            height: 32,
                                        }}
                                        onChange={(val) => handleFilterChange('gender', val)}
                                        allowClear
                                    />
                                </Form.Item>
                                <DatePicker.RangePicker
                                    placeholder={['Từ ngày', 'Đến ngày']}
                                    style={{
                                        width: 300,
                                        marginRight: 8,
                                        height: 32,
                                    }}
                                    allowClear
                                    onChange={(dates, dateStrings) => {
                                        handleFilterChange(
                                            'dateOfBirth',
                                            dates ? [dateStrings[0], dateStrings[1]] : []
                                        )
                                    }}
                                    locale={CUSSTOM_VI_LOCALE}
                                    format="DD/MM/YYYY"
                                />
                            </Flex>
                        </Col>

                        {/* Hàng chứa các button */}
                        <Col xs={12}>
                            <Flex justify="end" wrap="wrap" gap="8px" className="mt-1">
                                <Popconfirm
                                    title="Xác nhận xóa dữ liệu?"
                                    description="Bạn có chắc chắn muốn xoá những sinh viên đã chọn ra khỏi lớp này không?"
                                    open={open}
                                    onConfirm={handleDeleteMulti}
                                    onCancel={handleCancel}
                                >
                                    <Button
                                        disabled={selectedRowKeys?.length <= 0}
                                        onClick={showPopconfirm}
                                        type="primary"
                                    >
                                        {selectedRowKeys?.length > 0 && (
                                            <span>({selectedRowKeys?.length})</span>
                                        )}
                                        Xoá SV khỏi lớp
                                    </Button>
                                </Popconfirm>
                                <Button type="primary">In danh sách</Button>
                                <Button onClick={handleModal} type="primary">
                                    Thêm SV
                                </Button>
                                <Dropdown overlay={menuDownload} trigger={['hover']}>
                                    <Button type="primary" icon={<DownloadOutlined />}>
                                        Tải file mẫu
                                    </Button>
                                </Dropdown>
                                <Dropdown overlay={menuUpload} trigger={['hover']}>
                                    <Button type="primary" icon={<UploadOutlined />}>
                                        Nhập file
                                    </Button>
                                </Dropdown>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        rowSelection={{
                            selectedRowKeys,
                            onChange: (selectedKeys: any) => setSelectedRowKeys(selectedKeys),
                        }}
                        columns={[
                            // {
                            //     title: '',
                            //     width: 30,
                            //     align: 'center',
                            //     fixed: 'left',
                            //     render: () => <Checkbox />,
                            // },
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
                                fixed: 'left',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Họ và tên',
                                width: 150,
                                fixed: 'left',
                                align: 'center',
                                render: (record) =>
                                    record.userProfile
                                        ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                                        : '',
                            },
                            {
                                title: 'Ngày sinh',
                                align: 'center',
                                width: 100,
                                render: (record) =>
                                    record.userProfile?.dateOfBirth
                                        ? dayjs(record.userProfile.dateOfBirth).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Giới tính',
                                align: 'center',
                                width: 80,
                                render: (record) =>
                                    record.userProfile?.gender
                                        ? GENDER_MEAN[
                                              record.userProfile.gender as keyof typeof GENDER_MEAN
                                          ]
                                        : '',
                            },
                            {
                                title: 'Ngành',
                                width: 150,
                                align: 'center',
                                render: (record) => {
                                    return (
                                        record?.fixedClass?.curriculumVersion?.curriculum
                                            ?.trainingMajor?.trainingField?.name || ''
                                    )
                                },
                            },
                            {
                                title: 'Chuyên ngành',
                                width: 180,
                                align: 'center',
                                render: (record) => {
                                    return (
                                        record?.fixedClass?.curriculumVersion?.curriculum
                                            ?.trainingMajor?.name || ''
                                    )
                                },
                            },
                            {
                                title: 'Chương trình đào tạo',
                                width: 250,
                                align: 'center',
                                render: (record) => {
                                    const curriculum = record.curriculumVersion
                                    return curriculum ? curriculum.name : ''
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
                                        <Tooltip title="Kết quả học tập">
                                            <BookCheckIcon
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    router.push(
                                                        ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_KET_QUA_HOC_TAP_ID.replace(
                                                            '[id]',
                                                            id
                                                        )
                                                    )
                                                }}
                                                size={16}
                                            />
                                        </Tooltip>
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

StudentFixedClassPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout headerChildren="Danh sách sinh viên lớp niên chế">{page}</DefaultLayout>
}
