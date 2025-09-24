import { UploadOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import TextTruncate from '@components/commons/text-truncate'
import ExportTemplateLecturer from '@components/modal/export-template-lecturer'
import ImportLecturerModal from '@components/modal/import-excel-lecturer'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import type { UserProfile } from '@workspace/db'
import {
    useCountLecturer,
    useFindManyDM_DonVi,
    useFindManyLecturer,
    useFindManyLecturerType,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, Row, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { Eye } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')

export default function UserProfilePageLecture() {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [importModalVisible, setImportModalVisible] = useState(false)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const router = useRouter()
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

    const where = useMemo(
        () => ({
            ...(filters.code && filters.code !== ''
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.name && filters.name !== ''
                ? {
                      userProfile: {
                          OR: [
                              {
                                  firstName: {
                                      contains: filters.name,
                                      mode: 'insensitive' as const,
                                  },
                              },
                              {
                                  lastName: {
                                      contains: filters.name,
                                      mode: 'insensitive' as const,
                                  },
                              },
                              {
                                  fullname: {
                                      contains: filters.name,
                                      mode: 'insensitive' as const,
                                  },
                              },
                          ],
                      },
                  }
                : {}),
            ...(filters.idCardNumber
                ? {
                      userProfile: {
                          idCardNumber: {
                              contains: filters.idCardNumber,
                              mode: 'insensitive' as const,
                          },
                      },
                  }
                : {}),
            ...(filters.gender
                ? {
                      userProfile: {
                          genderId: {
                              in: filters.gender,
                          },
                      },
                  }
                : {}),
            ...(filters.dateOfBirth?.length === 2
                ? {
                      userProfile: {
                          dateOfBirth: {
                              gte: dayjs(filters.dateOfBirth?.[0], 'DD/MM/YYYY').toDate(),
                              lte: dayjs(filters.dateOfBirth?.[1], 'DD/MM/YYYY').toDate(),
                          },
                      },
                  }
                : {}),
            ...(filters.officerNumber
                ? {
                      userProfile: {
                          officerNumber: {
                              contains: filters.officerNumber,
                              mode: 'insensitive' as const,
                          },
                      },
                  }
                : {}),
            ...(filters.academicRankType
                ? {
                      userProfile: {
                          academicRankTypeId: {
                              in: filters.academicRankType,
                          },
                      },
                  }
                : {}),
            ...(filters.academicDegreeType
                ? {
                      userProfile: {
                          academicDegreeTypeId: {
                              in: filters.academicDegreeType,
                          },
                      },
                  }
                : {}),
            ...(filters.rankId
                ? {
                      userProfile: {
                          rankId: {
                              in: filters.rankId,
                          },
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
        }),
        [filters]
    )

    const { data = [] } = useFindManyLecturer({
        where,
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
            mainSubjectClasses: true,
            extraSubjectClasses: true,
            manageFixedClass: true,
        },
        orderBy: {
            userProfile: {
                firstName: 'asc',
            },
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountLecturer({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { data: lecturerTypeData = [] } = useFindManyLecturerType()
    const { data: manageOrgData = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })
    const treeData = buildOrgTree(manageOrgData)
    const { onOpen: onOpenModalAdd } = useDisclosure({
        tag: 'PutUserProfileLectureModal',
    })

    const handleModal = () => {
        onOpenModalAdd()
    }

    const handleRowClick = (record: { id?: string }) => {
        if (record?.id) {
            router.push(`${ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN}/${record.id}`)
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
                                {/* <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button> */}
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        filters={filters}
                        onRowClick={(record) => {
                            if (
                                can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN,
                                    'XEM_CHI_TIET'
                                ) &&
                                record?.id
                            ) {
                                router.push(
                                    `${ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN}/${record.id}`
                                )
                            }
                        }}
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
                            {
                                title: 'Mã giảng viên',
                                dataIndex: 'code',
                                align: 'center',
                                width: 150,
                                type: 'input',
                            },
                            {
                                title: 'Họ và tên',
                                align: 'center',
                                width: 180,
                                fixed: 'left',
                                dataIndex: 'name',
                                type: 'input',
                                render: (__, record: { userProfile?: UserProfile }) =>
                                    record.userProfile
                                        ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                                        : '',
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
                                title: 'Đơn vị',
                                dataIndex: 'organization',
                                align: 'center',
                                width: 200,
                                render: (value) => value?.sTen,
                                type: 'tree_select',
                                options: treeData,
                            },

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

                            {
                                title: 'Lớp giảng dạy',
                                dataIndex: 'mainSubjectClasses',
                                align: 'center',
                                width: 250,
                                render: (__, record: any) => {
                                    return record?.mainSubjectClasses.length ? (
                                        <TextTruncate
                                            arr={record?.mainSubjectClasses.map((i: any) => {
                                                return { key: i?.id, label: i?.name }
                                            })}
                                            key="mainSubjectClasses"
                                            record={record}
                                        />
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Lớp trợ giảng',
                                dataIndex: 'extraSubjectClasses',
                                align: 'center',
                                width: 200,
                                render: (__, record) => {
                                    return record?.extraSubjectClasses.length ? (
                                        <TextTruncate
                                            arr={record?.extraSubjectClasses.map((i: any) => {
                                                return { key: i?.id, label: i?.name }
                                            })}
                                            key="extraSubjectClasses"
                                            record={record}
                                        />
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Lớp được quản lý',
                                dataIndex: 'manageFixedClass',
                                align: 'center',
                                width: 200,
                                render: (__, record) => {
                                    return record?.manageFixedClass.length ? (
                                        <TextTruncate
                                            arr={record?.manageFixedClass.map((i: any) => {
                                                return { key: i?.id, label: i?.name }
                                            })}
                                            key="manageFixedClass"
                                            record={record}
                                        />
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN,
                                    'XEM_CHI_TIET'
                                ),
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN,
                                                    'XEM_CHI_TIET'
                                                ) && (
                                                    <Tooltip title="Xem chi tiết" placement="top">
                                                        <Eye
                                                            size={16}
                                                            strokeWidth={1.5}
                                                            className="text-base cursor-pointer"
                                                        />
                                                    </Tooltip>
                                                )}
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={data}
                        rowKey="id"
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
