import { UploadOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import type { PutUserProfileLectureProps } from '@components/modal/put-giang-vien'
import ExportTemplateLecturer from '@components/modal/quan-ly-ho-so/modals/export-template-lecturer'
import ImportLecturerModal from '@components/modal/quan-ly-ho-so/modals/import-excel-lecturer'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import {
    useCountLecturer,
    useFindManyDM_CapBac,
    useFindManyDM_DonVi,
    useFindManyDM_GioiTinh,
    useFindManyLecturer,
    useFindManyLecturerType,
    useUpdateLecturer,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')

export default function UserProfilePageLecture() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [importModalVisible, setImportModalVisible] = useState(false)
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
        lecturerType: undefined,
        idCardNumber: undefined,
    })

    const { data = [], refetch } = useFindManyLecturer({
        where: {
            userProfile: {
                OR: [
                    {
                        firstName: {
                            contains: filters.name,
                        },
                    },
                    {
                        lastName: {
                            contains: filters.name,
                        },
                    },
                ],
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
            ...(filters.lecturerType
                ? {
                      lecturerTypeId: {
                          in: filters.lecturerType,
                      },
                  }
                : {}),
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
            lecturerType: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen, onClose } = useDisclosure<PutUserProfileLectureProps>({
        tag: 'PutUserProfileLectureModal',
    })

    const { onOpen: onOpenModalAdd } = useDisclosure({
        tag: 'PutUserProfileLectureModal',
    })

    const { onOpen: onOpenUpload } = useDisclosure<string>({
        tag: 'PutUploadProfileModal',
    })
    const { onOpen: onOpenUpdateFile } = useDisclosure<string>({
        tag: 'PutUpdateProfileModal',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpenModalAdd()
    }
    const handleModalUpload = (type: string) => {
        if (type === 'upload') {
            onOpenUpload('GV')
        } else {
            onOpenUpdateFile('GV')
        }
    }

    const { data: lecturerTypeData = [] } = useFindManyLecturerType()
    const { data: manageOrgData = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })
    const treeData = buildOrgTree(manageOrgData)
    const { data: rankTypeData = [] } = useFindManyDM_CapBac()

    const { data: count } = useCountLecturer({
        where: {
            userProfile: {
                OR: [
                    {
                        firstName: {
                            contains: filters.name,
                        },
                    },
                    {
                        lastName: {
                            contains: filters.name,
                        },
                    },
                ],
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
            ...(filters.lecturerType
                ? {
                      lecturerTypeId: {
                          in: filters.lecturerType,
                      },
                  }
                : {}),
        },
    })

    const { mutateAsync: updateLecturer } = useUpdateLecturer()

    const { data: genderTypeData = [] } = useFindManyDM_GioiTinh()

    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateLecturer({
                where: {
                    id,
                },
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
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={24}>
                            <Flex justify="end" wrap="wrap" gap="8px" className="mt-1">
                                <Button
                                    type="primary"
                                    onClick={() => setImportModalVisible(true)}
                                    icon={<UploadOutlined />}
                                >
                                    Nhập dữ liêu Excel
                                </Button>
                                <ImportLecturerModal
                                    visible={importModalVisible}
                                    onCancel={() => setImportModalVisible(false)}
                                />
                                <ExportTemplateLecturer />
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
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
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã giảng viên',
                                dataIndex: 'code',
                                align: 'center',
                                width: 150,
                                type: 'input',
                            },
                            // {
                            //     title: 'SHSQ/SHQN',
                            //     dataIndex: 'officerNumber',
                            //     render: (__, record) => record.userProfile?.officerNumber,
                            //     align: 'center',
                            //     width: 150,
                            //     type: 'input',
                            // },
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
                                        ? record?.userProfile?.gender.sTen
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
                                options: lecturerTypeData.map((type) => ({
                                    label: type.name,
                                    value: type.id,
                                })),
                                dataIndex: 'lecturerType',
                                type: 'select',
                                width: 170,
                                render: (__, record) => record?.lecturerType?.name || '',
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
                                        <EditIcon
                                            onClick={onOpen.bind(id, {
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

UserProfilePageLecture.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
