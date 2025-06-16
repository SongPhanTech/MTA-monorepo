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

import { FilterSinhVien } from '@components/filter'
import EditIcon from '@components/icons/edit'
import { getMinioUrl } from '@workspace/constant'
import {
    useCountStudent,
    useFindManyStudent,
    useFindManyTemplateFile,
    useFindUniqueFixedClass,
    useUpdateStudent,
} from '@workspace/db/hooks'
import {
    Button,
    Checkbox,
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
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')
export default function StudentFixedClassPage() {
    const router = useRouter()
    const fixedClassId = router.query.id as string
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState({
        searchText: '',
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
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<{
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
                {fixedClass?.trainingCourse?.trainingObjectType.name} -{' '}
                {fixedClass?.trainingCourse?.name} -{' '}
                {fixedClass?.curriculumVersion?.name} -{' '}
                {fixedClass?.curriculumVersion?.curriculum.trainingMajor.name} -{' '}
                {
                    fixedClass?.curriculumVersion?.curriculum.trainingMajor
                        .trainingField.name
                }
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
                        {/* Hàng chứa các button */}
                        <Col xs={24}>
                            <Flex
                                justify="end"
                                wrap="wrap"
                                gap="8px"
                                className="mt-1"
                            >
                                <Button type="primary">In danh sách</Button>
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
                                title: '',
                                width: 30,
                                align: 'center',
                                fixed: 'left',
                                render: () => <Checkbox />,
                            },
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
                                width: 150,
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
                                title: 'Ngành',
                                width: 150,
                                render: (record) => {
                                    return record.fixedClass.curriculumVersion
                                        .curriculum.trainingMajor.trainingField
                                        .name
                                },
                            },
                            {
                                title: 'Chuyên ngành',
                                width: 180,
                                render: (record) => {
                                    return record.fixedClass.curriculumVersion
                                        .curriculum.trainingMajor.name
                                },
                            },
                            {
                                title: 'Chương trình đào tạo',
                                width: 250,
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
    return <DefaultLayout>{page}</DefaultLayout>
}
