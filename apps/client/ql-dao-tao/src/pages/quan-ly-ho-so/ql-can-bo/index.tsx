import {
    DownloadOutlined,
    UploadOutlined,
    UserOutlined,
} from '@ant-design/icons'
import Table from '@components/commons/table'
import { FilterLecture } from '@components/filter'
import type { FilterProps } from '@components/filter/filter-hoc-vien'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import {
    PutUpdateProfileModal,
    PutUploadProfileModal,
    PutUserProfileStaffModal,
} from '@components/modal'
import { DEFAULT_PAGINATE_SIZE, GENDER_MEAN } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { getMinioUrl } from '@workspace/constant'
import {
    useCountStaff,
    useFindManyStaff,
    useFindManyTemplateFile,
    useUpdateStaff,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Dropdown,
    Flex,
    Image,
    Input,
    Menu,
    Row,
    message,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type Filter = FilterProps & {
    searchText: string
    organizationText: string
}

export default function StaffManagement() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

    const [filters, setFilters] = useState<Filter>({
        searchText: '',
        organizationText: '',
        priorityObjectId: null,
        nationalityId: null,
        religionId: null,
        ethnicityId: null,
    })

    const { data, refetch } = useFindManyStaff({
        where: {
            AND: [
                ...(filters.searchText
                    ? [
                          {
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
                      ]
                    : []),
                ...(filters.organizationText
                    ? [
                          {
                              organization: {
                                  name: {
                                      contains: filters.organizationText,
                                  },
                              },
                          },
                      ]
                    : []),
            ],
        },
        include: {
            organization: true,
            staffType: true,
            staffPosition: true,
            fixedClass: true,
            userProfile: {
                include: {
                    academicRankType: true,
                    academicDegreeType: true,
                    rank: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountStaff({
        where: {
            AND: [
                ...(filters.searchText
                    ? [
                          {
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
                      ]
                    : []),
                ...(filters.organizationText
                    ? [
                          {
                              organization: {
                                  name: {
                                      contains: filters.organizationText,
                                  },
                              },
                          },
                      ]
                    : []),
            ],
        },
    })

    const { mutateAsync: updateStaff } = useUpdateStaff()

    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateStaff({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    code: id,
                    userProfile: {
                        update: {
                            idCardNumber: id,
                        },
                    },
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const { data: templateFile = [], refetch: refetchTemplateFile } =
        useFindManyTemplateFile()

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { onOpen, onClose } = useDisclosure({
        tag: PutUserProfileStaffModal.name,
    })

    const { onOpen: onOpenModalAdd, onClose: onCloseModalAdd } = useDisclosure({
        tag: PutUserProfileStaffModal.name,
    })

    const handleModal = () => {
        onOpenModalAdd()
    }

    const { onOpen: onOpenUpload, onClose: onCloseUpload } =
        useDisclosure<string>({
            tag: PutUploadProfileModal.name,
        })

    const { onOpen: onOpenUpdateFile, onClose: onCloseUpdateFile } =
        useDisclosure<string>({
            tag: PutUpdateProfileModal.name,
        })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const handleAdvancedFilter = (values: FilterProps) => {
        const newFilters = { ...filters, ...values }
        setFilters(newFilters)
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

    const handleModalUpload = (type: string) => {
        if (type === 'upload') {
            onOpenUpload('GV')
        } else {
            onOpenUpdateFile('GV')
        }
    }

    const itemsDownload = [
        {
            key: 'import',
            label: 'Tải file nhập thông tin giảng viên',
            onClick: () => handleDownloadTemplate('IMPORT_USERPROFILE'),
        },
        {
            key: 'update',
            label: 'Tải file cập nhật thông tin giảng viên',
            onClick: () => handleDownloadTemplate('UPDATE_USERPROFILE'),
        },
    ]

    const itemsUpload = [
        {
            key: 'upload',
            label: 'Nhập file nhập thông tin giảng viên',
            onClick: () => handleModalUpload('upload'),
        },
        {
            key: 'update',
            label: 'Nhập file cập nhật thông tin giảng viên',
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
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={7}>
                            <Input
                                id="search"
                                onChange={(e) =>
                                    handleFilterChange(
                                        'organizationText',
                                        e.target.value
                                    )
                                }
                                placeholder="Tìm kiếm theo tên đơn vị"
                                style={{ height: 40 }}
                            />
                        </Col>
                        <Col span={10}>
                            <FilterLecture
                                onSearchChange={handleFilterChange}
                                onFilterChange={handleAdvancedFilter}
                            />
                        </Col>

                        <Col span={7}>
                            <Flex justify="end">
                                <Button
                                    onClick={handleModal}
                                    type="primary"
                                    style={{ height: 40 }}
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
                                        style={{ height: 40 }}
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
                                        style={{ height: 40 }}
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
                                title: 'Mã cán bộ',
                                dataIndex: 'code',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'SHSQ/SHQN',
                                render: (_, record) =>
                                    record.userProfile?.officerNumber,
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Họ và tên',
                                render: (record) =>
                                    record.userProfile
                                        ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                                        : '',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Giới tính',
                                align: 'center',
                                width: 100,
                                render: (record) =>
                                    record.userProfile?.gender
                                        ? GENDER_MEAN[
                                              record.userProfile
                                                  .gender as keyof typeof GENDER_MEAN
                                          ]
                                        : '',
                            },
                            {
                                title: 'Ngày sinh',
                                render: (_, record) =>
                                    record.userProfile?.dateOfBirth
                                        ? dayjs(
                                              record.userProfile.dateOfBirth
                                          ).format('DD/MM/YYYY')
                                        : '',
                                align: 'center',
                                width: 100,
                            },
                            {
                                title: 'Đơn vị',
                                width: 150,
                                render: (_, record) => {
                                    return (
                                        record.organization?.name || 'Chưa có'
                                    )
                                },
                                align: 'center',
                            },
                            {
                                title: 'Học hàm',
                                width: 120,
                                render: (_, record) =>
                                    record.userProfile?.academicRankType
                                        ?.name || '',
                                align: 'center',
                            },
                            {
                                title: 'Năm HH',
                                render: (_, record) =>
                                    record.userProfile?.academicRankDate
                                        ? dayjs(
                                              record.userProfile
                                                  .academicRankDate
                                          ).format('DD/MM/YYYY')
                                        : '',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Học vị',
                                render: (_, record) =>
                                    record.userProfile?.academicDegreeType
                                        ?.name || '',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Năm HV',
                                render: (_, record) =>
                                    record.userProfile?.academicDegreeDate
                                        ? dayjs(
                                              record.userProfile
                                                  .academicDegreeDate
                                          ).format('DD/MM/YYYY')
                                        : '',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Loại cán bộ',
                                align: 'center',
                                width: 120,
                                render: (_, record) =>
                                    record.staffType?.name || '',
                            },
                            {
                                title: 'Cập bậc hàm',
                                dataIndex: 'rankId',
                                render: (_, record) =>
                                    record.userProfile?.rank?.name || '',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Năm CB',
                                dataIndex: 'rankDate',
                                render: (_, record) =>
                                    record.userProfile?.rankDate
                                        ? dayjs(
                                              record.userProfile.rankDate
                                          ).format('DD/MM/YYYY')
                                        : '',
                                align: 'center',
                                width: 100,
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <EditIcon
                                            onClick={onOpen.bind(id, {
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
                        pagination={{
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

StaffManagement.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
