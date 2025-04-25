import {
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
    PutUserProfileUpdateModal,
    PutUserProfileLectureModal,
    AddUserProfileLecture,
} from '@components/modal'
import { DEFAULT_PAGINATE_SIZE, GENDER_MEAN } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    convertToTree,
    getAllChildrenByParentId,
} from '@/utils/convertOrganizationToTree'
import type { TreeNodeOrganization } from '@/utils/convertOrganizationToTree'
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
    useFindManyOrganization,
} from '@workspace/db/hooks'

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
    Tooltip,
    message,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import FilterLecture from '../../components/filter/filter-lecture'
import type { FilterProps } from '../../components/filter/filter-lecture'
import { AddUserProfileLectureProps } from '@components/modal/add-user-profile-lecture'
import { PutUserProfileLectureProps } from '@components/modal/put-user-profile-lecture-modal'
import { record } from 'zod'
import { OrganizationUserStatus } from '@workspace/db'
type Filter = FilterProps & {
    searchText: string
}
dayjs.locale('vi')

export default function UserProfilePageLecture() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [organizationIds, setOrganizationIds] = useState<string[]>([])
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
    const [filters, setFilters] = useState<Filter>({
        searchText: '',
        priorityObjectId: null,
        nationalityId: null,
        religionId: null,
        ethnicityId: null,
    })

    const { data: organization_data = [], refetch: refetch_organization } =
        useFindManyOrganization()

    const tree_organization = convertToTree(organization_data)

    const { data = [], refetch } = useFindManyUserProfile({
        where: {
            firstName: {
                contains: filters.searchText,
            },
            //   ...filters,
            ...(filters.priorityObjectId
                ? { priorityObjectId: filters.priorityObjectId }
                : {}),
            ...(filters.nationalityId
                ? { nationalityId: filters.nationalityId }
                : {}),
            ...(filters.religionId
                ? { nationalityId: filters.religionId }
                : {}),
            ...(filters.ethnicityId
                ? { ethnicityId: filters.ethnicityId }
                : {}),
            ...(organizationIds && organizationIds.length > 0
                ? {
                      organizationUser: {
                          some: {
                              organizationId: { in: organizationIds },
                              status: OrganizationUserStatus.ACTIVE,
                          },
                      },
                  }
                : {}),
            userType: {
                is: {
                    code: 'GV',
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
                    code: 'GV',
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
        onOpenModalAdd({ id: null, code: 'GV' })
    }
    const handleModalUpload = (type: string) => {
        if (type === 'upload') {
            onOpenUpload('GV')
        } else {
            onOpenUpdateFile('GV')
        }
    }

    const handleSelectOrganization = (idOrganization: string) => {
        const children = getAllChildrenByParentId(
            tree_organization,
            idOrganization
        )
        const listChildrenOrganizationId = children.map((item: any) => item.id)
        setOrganizationIds(listChildrenOrganizationId)
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
        useFindManyUserType({
            take: 1000,
            skip: 0,
        })
    const { data: templateFile = [], refetch: refetchTemplateFile } =
        useFindManyTemplateFile({
            take: 1000,
            skip: 0,
        })

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
            handleSelectOrganization(record.id)
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
                        <Col span={10}>
                            <FilterLecture
                                onSearchChange={handleFilterChange}
                                onFilterChange={handleAdvancedFilter}
                            />
                        </Col>
                        <Col span={14}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>

                                {/* Gói Dropdown vào Space để đảm bảo chỉ có một child */}
                                <>
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
                                </>
                                <>
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
                                </>
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
                <Col span={7}>
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
                        data={tree_organization}
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
                </Col>
                <Col span={17}>
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
                                title: 'Mã giảng viên',
                                dataIndex: 'code',
                                align: 'center',
                            },
                            {
                                title: 'Họ và tên',
                                render: ({ firstName, lastName }) =>
                                    `${lastName}` + ' ' + `${firstName}`,
                            },
                            {
                                title: 'Ngày sinh',
                                // dataIndex: 'startDate',
                                render: ({ dateOfBirth }) =>
                                    dayjs(dateOfBirth).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Cập bậc hàm',
                                dataIndex: 'rankName',
                            },
                            {
                                title: 'Đơn vị',
                                dataIndex: 'organizationName',
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
                                                onClick={onOpen.bind(id, {
                                                    id: id,
                                                    code: 'GV',
                                                })}
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
                        }}
                        // maxHeight={430}
                        // scrollable={true}
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
