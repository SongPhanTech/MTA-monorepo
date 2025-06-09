import type { TreeNodeOrganization } from '@/utils/convertOrganizationToTree'
import {
    DownloadOutlined,
    EyeOutlined,
    UploadOutlined,
    UserOutlined,
} from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import {
    AddUserProfileLecture,
    PutUpdateProfileModal,
    PutUploadProfileModal,
    PutUserProfileLectureModal,
} from '@components/modal'
import { DEFAULT_PAGINATE_SIZE, GENDER_MEAN } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountLecturer,
    useCountUserProfile,
    useFindManyLecturer,
    useFindManyTemplateFile,
    useFindManyUserProfile,
    useUpdateLecturer,
    useUpdateUserProfile,
} from '@workspace/db/hooks'

import EditIcon from '@components/icons/edit'
import type { AddUserProfileLectureProps } from '@components/modal/add-user-profile-lecture'
import type { PutUserProfileLectureProps } from '@components/modal/put-user-profile-lecture-modal'
import {
    Avatar,
    Button,
    Col,
    Divider,
    Dropdown,
    Flex,
    Image,
    Input,
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
import type { FilterProps } from '../../components/filter/filter-lecture'
import FilterLecture from '../../components/filter/filter-lecture'
type Filter = FilterProps & {
    searchText: string
    organizationText: string
}
dayjs.locale('vi')

export default function UserProfilePageLecture() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [organizationIds, setOrganizationIds] = useState<string[]>([])
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
    const [searchOrganization, setSearchOrganization] = useState<string>('')

    const debouncedSearchText = _.debounce(setSearchOrganization, 200)
    const [filters, setFilters] = useState<Filter>({
        searchText: '',
        organizationText: '',
        priorityObjectId: null,
        nationalityId: null,
        religionId: null,
        ethnicityId: null,
    })

    // const { data: organization_data = [], refetch: refetch_organization } =
    //     useFindManyOrganization()

    // const tree_organization = convertToTree(organization_data)
    // const tree_search_organization = searchTree(
    //     tree_organization,
    //     searchOrganization
    // )

    const { data = [], refetch } = useFindManyLecturer({
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
                ...(filters.nationalityId
                    ? [
                          {
                              userProfile: {
                                  nationalityId: filters.nationalityId,
                              },
                          },
                      ]
                    : []),
                ...(filters.religionId
                    ? [
                          {
                              userProfile: {
                                  religionId: filters.religionId,
                              },
                          },
                      ]
                    : []),
                ...(filters.ethnicityId
                    ? [
                          {
                              userProfile: {
                                  ethnicityId: filters.ethnicityId,
                              },
                          },
                      ]
                    : []),
            ],
        },
        include: {
            userProfile: {
                include: {
                    academicRankType: true,
                    academicDegreeType: true,
                    rank: true,
                },
            },
            organization: true,
            lecturerType: {
                include: {
                    staffPosition: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountLecturer({
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

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen, onClose } = useDisclosure<PutUserProfileLectureProps>({
        tag: PutUserProfileLectureModal.name,
    })

    const { onOpen: onOpenModalAdd, onClose: onCloseModalAdd } =
        useDisclosure<AddUserProfileLectureProps>({
            tag: AddUserProfileLecture.name,
        })

    const { onOpen: onOpenUpload, onClose: onCloseUpload } =
        useDisclosure<string>({
            tag: PutUploadProfileModal.name,
        })
    const { onOpen: onOpenUpdateFile, onClose: onCloseUpdateFile } =
        useDisclosure<string>({
            tag: PutUpdateProfileModal.name,
        })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpenModalAdd({ userType: 'LECTURER' })
    }
    const handleModalUpload = (type: string) => {
        if (type === 'upload') {
            onOpenUpload('GV')
        } else {
            onOpenUpdateFile('GV')
        }
    }

    // const handleSelectOrganization = (idOrganization: string) => {
    //     const children = getAllChildrenByParentId(
    //         tree_organization,
    //         idOrganization
    //     )
    //     const listChildrenOrganizationId = children.map((item: any) => item.id)
    //     setOrganizationIds(listChildrenOrganizationId)
    // }

    const { mutateAsync: updateLecturer } = useUpdateLecturer()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateLecturer({
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

    const handleFilterChange = (key: string, value: string) => {
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

    const handleAdvancedFilter = (values: FilterProps) => {
        const newFilters = { ...filters, ...values }
        setFilters(newFilters)
    }

    const handleRowOrganizationClick = (record: TreeNodeOrganization) => {
        if (selectedRowId === record.id) {
            setSelectedRowId(null)
            setOrganizationIds([])
        } else {
            setSelectedRowId(record.id)
            // handleSelectOrganization(record.id)
        }
    }
    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Cán bộ / Giảng viên
            </Divider>
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
                                <Button onClick={handleModal} type="primary">
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
                    </Row>
                    {/* Row ô tìm kiếm */}
                    {/* <Row gutter={[16, 16]}>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={24}>
                <FilterLecture
                  onSearchChange={handleFilterChange}
                  onFilterChange={handleAdvancedFilter}
                />
              </Col>
            </Row>
          </Row> */}
                </Col>
                {/* <Col span={7}>
                    <Table
                        columns={[
                            {
                                title: 'Mã đơn vị',
                                dataIndex: 'code',
                            },
                            {
                                title: 'Tên đơn vị',
                                dataIndex: 'name',
                            },
                        ]}
                        data={tree_search_organization}
                        expandable={{
                            defaultExpandedRowKeys: ['root'],
                        }}
                        onRowClick={(record) =>
                            handleRowOrganizationClick(
                                record as TreeNodeOrganization
                            )
                        }
                        selectedRow={selectedRowId}
                        pagination={{
                            current: 1,
                            pageSize: 10000,
                            onChange: setCurrentPage,
                            showSizeChanger: false,
                            showTotal: () => null,
                        }}
                        scrollable={true}
                        maxHeight={430}
                    />
                </Col> */}
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
                                dataIndex: 'avatar',
                                align: 'center',
                                width: 120,
                                render: (avatar) =>
                                    avatar ? (
                                        <Image
                                            src={avatar}
                                            width={80}
                                            // height={80}
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
                                    ),
                            },
                            {
                                title: 'Mã giảng viên',
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
                                        ? `${record.userProfile.firstName} ${record.userProfile.lastName}`
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
                                title: 'Chức vụ',
                                align: 'center',
                                width: 200,
                                render: (_, record) => {
                                    const staffPositions =
                                        record.lecturerType?.staffPosition || []

                                    if (staffPositions.length === 0) {
                                        return (
                                            <Tag color="default">Chưa có</Tag>
                                        )
                                    }

                                    return (
                                        <div className="flex flex-wrap gap-1 justify-start items-center">
                                            {staffPositions.map(
                                                (position, index) => (
                                                    <Tag
                                                        key={`${position.id}-${index}`}
                                                        className="whitespace-nowrap"
                                                    >
                                                        {position.name}
                                                    </Tag>
                                                )
                                            )}
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Năm CV',
                                render: (_, record) =>
                                    record.userProfile?.academicDegreeDate
                                        ? dayjs(
                                              record.userProfile
                                                  .academicDegreeDate
                                          ).format('DD/MM/YYYY')
                                        : '',
                                align: 'center',
                                width: 100,
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
                        scroll={{ x: 'max-content' }}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
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

UserProfilePageLecture.getLayout = function getLayout(
    page: React.ReactElement
) {
    return <DefaultLayout>{page}</DefaultLayout>
}
