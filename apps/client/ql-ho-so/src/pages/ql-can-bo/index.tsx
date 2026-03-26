import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import {
    useCountStaff,
    useFindManyDM_CapBac,
    useFindManyDM_DonVi,
    useFindManyDM_GioiTinh,
    useFindManyStaff,
    useFindManyStaffType,
    useFindManyTemplateFile,
    useUpdateStaff,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Menu, message, Row } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export default function StaffManagement() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        dateOfBirth: undefined,
        academicRankType: undefined,
        academicDegreeType: undefined,
        organization: undefined,
        gender: undefined,
        rankId: undefined,
        officerNumber: undefined,
        staffType: undefined,
        idCardNumber: undefined,
    })

    const { data } = useFindManyStaff({
        where: {
            userProfile: {
                ...(filters.name
                    ? {
                          fullname: {
                              contains: filters.name,
                              mode: 'insensitive',
                          },
                      }
                    : {}),
                ...(filters.idCardNumber
                    ? {
                          idCardNumber: {
                              contains: filters.idCardNumber,
                              mode: 'insensitive',
                          },
                      }
                    : {}),
                ...(filters.gender
                    ? {
                          genderId: {
                              in: filters.gender,
                          },
                      }
                    : {}),
                ...(filters.dateOfBirth?.length === 2
                    ? {
                          dateOfBirth: {
                              gte: dayjs(filters.dateOfBirth?.[0], 'DD/MM/YYYY').toDate(),
                              lte: dayjs(filters.dateOfBirth?.[1], 'DD/MM/YYYY').toDate(),
                          },
                      }
                    : {}),
                ...(filters.officerNumber
                    ? {
                          officerNumber: {
                              contains: filters.officerNumber,
                              mode: 'insensitive',
                          },
                      }
                    : {}),
                ...(filters.academicRankType
                    ? {
                          academicRankTypeId: {
                              in: filters.academicRankType,
                          },
                      }
                    : {}),
                ...(filters.academicDegreeType
                    ? {
                          academicDegreeTypeId: {
                              in: filters.academicDegreeType,
                          },
                      }
                    : {}),
                ...(filters.rankId
                    ? {
                          rankId: {
                              in: filters.rankId,
                          },
                      }
                    : {}),
            },
            ...(filters.code
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.organization
                ? {
                      organizationId: {
                          in: filters.organization,
                      },
                  }
                : {}),
            ...(filters.staffType
                ? {
                      staffTypeId: {
                          in: filters.staffType,
                      },
                  }
                : {}),
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
            userProfile: {
                ...(filters.name
                    ? { fullname: { contains: filters.name, mode: 'insensitive' } }
                    : {}),
                ...(filters.idCardNumber
                    ? {
                          idCardNumber: {
                              contains: filters.idCardNumber,
                              mode: 'insensitive',
                          },
                      }
                    : {}),
                ...(filters.gender ? { genderId: { in: filters.gender } } : {}),
                ...(filters.dateOfBirth?.length === 2
                    ? {
                          dateOfBirth: {
                              gte: dayjs(filters.dateOfBirth?.[0], 'DD/MM/YYYY').toDate(),
                              lte: dayjs(filters.dateOfBirth?.[1], 'DD/MM/YYYY').toDate(),
                          },
                      }
                    : {}),
                ...(filters.officerNumber
                    ? {
                          officerNumber: {
                              contains: filters.officerNumber,
                              mode: 'insensitive',
                          },
                      }
                    : {}),
                ...(filters.academicRankType
                    ? {
                          academicRankTypeId: {
                              in: filters.academicRankType,
                          },
                      }
                    : {}),
                ...(filters.academicDegreeType
                    ? {
                          academicDegreeTypeId: {
                              in: filters.academicDegreeType,
                          },
                      }
                    : {}),
                ...(filters.rankId
                    ? {
                          rankId: {
                              in: filters.rankId,
                          },
                      }
                    : {}),
            },
            ...(filters.code
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.organization
                ? {
                      organizationId: {
                          in: filters.organization,
                      },
                  }
                : {}),
            ...(filters.staffType
                ? {
                      staffTypeId: {
                          in: filters.staffType,
                      },
                  }
                : {}),
            deletedAt: null,
        },
    })

    const { data: staffTypeData = [] } = useFindManyStaffType()
    const { data: manageOrgData = [] } = useFindManyDM_DonVi({
        orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
    })
    const treeData = buildOrgTree(manageOrgData)

    const { data: rankTypeData = [] } = useFindManyDM_CapBac()

    const { data: genderTypeData = [] } = useFindManyDM_GioiTinh()

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
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    const { data: templateFile = [] } = useFindManyTemplateFile()

    // const debouncedRefetch = useCallback(
    //     _.debounce(() => {
    //         refetch()
    //     }, 500),
    //     []
    // )

    const { onOpen, onClose } = useDisclosure({
        tag: 'PutUserProfileStaffModal',
    })

    const { onOpen: onOpenModalAdd, onClose: onCloseModalAdd } = useDisclosure({
        tag: 'PutUserProfileStaffModal',
    })

    // const { onOpen: onOpenModalTomTatLyLich } = useDisclosure<{
    //     id: string
    // }>({
    //     tag: 'ModalLyLichCanBo',
    // })

    const handleModal = () => {
        onOpenModalAdd()
    }

    const { onOpen: onOpenUpload, onClose: onCloseUpload } = useDisclosure<string>({
        tag: 'PutUploadProfileModal',
    })

    const { onOpen: onOpenUpdateFile, onClose: onCloseUpdateFile } = useDisclosure<string>({
        tag: 'PutUpdateProfileModal',
    })

    const { showSpinner, hideSpinner } = useSpinner()

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
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={7}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            // {
                            //     title: 'Ảnh',
                            //     align: 'center',
                            //     width: 120,
                            //     className: 'flex justify-center',
                            //     render: (_, record) => {
                            //         const avatar = record.userProfile?.avatar

                            //         return avatar ? (
                            //             <Image src={getMinioUrl(avatar)} width={100} height={80} />
                            //         ) : (
                            //             <div className="flex justify-center items-center ml-[10px] w-20 h-16 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                            //                 <UserOutlined
                            //                     style={{
                            //                         fontSize: 32,
                            //                         color: '#bfbfbf',
                            //                     }}
                            //                 />
                            //             </div>
                            //         )
                            //     },
                            // },
                            {
                                title: 'Mã giảng viên',
                                dataIndex: 'code',
                                align: 'center',
                                width: 150,
                                type: 'input',
                            },
                            {
                                title: 'Họ và tên',
                                render: (__, record) =>
                                    record.userProfile
                                        ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                                        : '',
                                align: 'center',
                                width: 150,
                                dataIndex: 'name',
                                type: 'input',
                            },
                            {
                                title: 'CCCD/CMND',
                                render: (__, record) =>
                                    record.userProfile ? `${record.userProfile.idCardNumber}` : '',
                                align: 'center',
                                width: 150,
                                dataIndex: 'idCardNumber',
                                type: 'input',
                            },
                            {
                                title: 'Ngày sinh',
                                dataIndex: 'dateOfBirth',
                                type: 'date',

                                render: (__, record) =>
                                    record.userProfile?.dateOfBirth
                                        ? dayjs(record.userProfile?.dateOfBirth).format(
                                              'DD/MM/YYYY'
                                          )
                                        : '',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Giới tính',
                                align: 'center',
                                width: 100,
                                type: 'select',
                                dataIndex: 'gender',
                                options: genderTypeData.map((i) => ({
                                    label: i.sTen,
                                    value: i.Id,
                                })),
                                render: (record) =>
                                    record?.userProfile?.gender
                                        ? record?.userProfile?.gender?.sTen
                                        : '',
                            },

                            {
                                title: 'Đơn vị',
                                dataIndex: 'organization',
                                align: 'center',
                                width: 150,
                                render: (value) => value?.sTen,
                                type: 'tree_select',
                                options: treeData,
                            },
                            // {
                            //     title: 'Học hàm',
                            //     width: 120,
                            //     dataIndex: 'academicRankType',
                            //     options: academicRankTypeData.map((aca) => ({
                            //         label: aca.sTen,
                            //         value: aca.Id,
                            //     })),
                            //     type: 'select',
                            //     render: (_, record) =>
                            //         record.userProfile?.academicRankType?.name || '',
                            //     align: 'center',
                            // },
                            // {
                            //     title: 'Năm HH',
                            //     render: (_, record) =>
                            //         record.userProfile?.academicRankDate
                            //             ? dayjs(record.userProfile.academicRankDate).format(
                            //                   'DD/MM/YYYY'
                            //               )
                            //             : '',
                            //     align: 'center',
                            //     width: 120,
                            // },
                            // {
                            //     title: 'Học vị',
                            //     dataIndex: 'academicDegreeType',
                            //     options: academicDegreeTypeData.map((hv) => ({
                            //         label: hv.sTen,
                            //         value: hv.Id,
                            //     })),
                            //     type: 'select',
                            //     render: (__, record) =>
                            //         record.userProfile?.academicDegreeType?.name || '',
                            //     align: 'center',
                            //     width: 120,
                            // },
                            // {
                            //     title: 'Năm HV',
                            //     render: (_, record) =>
                            //         record.userProfile?.academicDegreeDate
                            //             ? dayjs(record.userProfile.academicDegreeDate).format(
                            //                   'DD/MM/YYYY'
                            //               )
                            //             : '',
                            //     align: 'center',
                            //     width: 120,
                            // },
                            {
                                title: 'Loại giảng viên',
                                align: 'center',
                                options: staffTypeData.map((type) => ({
                                    label: type.name,
                                    value: type.id,
                                })),
                                dataIndex: 'staffType',
                                type: 'select',
                                width: 170,
                                render: (__, record) => record?.staffType?.name || '',
                            },
                            // {
                            //     title: 'Năm CV',
                            //     render: (_, record) =>
                            //         record.userProfile?.academicDegreeDate
                            //             ? dayjs(
                            //                   record.userProfile
                            //                       .academicDegreeDate
                            //               ).format('DD/MM/YYYY')
                            //             : '',
                            //     align: 'center',
                            //     width: 100,
                            // },
                            {
                                title: 'Cấp bậc hàm',
                                dataIndex: 'rankId',
                                options: rankTypeData.map((rank) => ({
                                    label: rank.sTen,
                                    value: rank.Id,
                                })),
                                type: 'select',
                                render: (_, record) => record.userProfile?.rank?.name || '',
                                align: 'center',
                                width: 140,
                            },
                            {
                                title: 'Năm CB',
                                dataIndex: 'rankDate',
                                render: (__, record) =>
                                    record.userProfile?.rankDate
                                        ? dayjs(record.userProfile.rankDate).format('DD/MM/YYYY')
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
                                        {/* <PrinterIcon
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onOpenModalTomTatLyLich({ id })
                                            }}
                                        /> */}
                                        <EditIcon
                                            onClick={onOpen.bind(id, {
                                                id,
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
                        rowKey="id"
                        // rowSelection={{
                        //     selectedRowKeys,
                        //     onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
                        // }}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,

                            onChange: (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
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
