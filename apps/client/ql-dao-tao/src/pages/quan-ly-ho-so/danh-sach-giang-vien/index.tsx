import Table from '@components/commons/table'

import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import type { FixedClass, SubjectClass } from '@workspace/db'
import {
    useCountLecturer,
    useFindManyDM_DonVi,
    useFindManyLecturer,
    useFindManyLecturerType,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Col, Row } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useState } from 'react'

dayjs.locale('vi')

export default function UserProfilePageLecture() {
    const [currentPage, setCurrentPage] = useState(1)
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
            mainSubjectClasses: true,
            extraSubjectClasses: true,
            manageFixedClass: true,
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

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: lecturerTypeData = [] } = useFindManyLecturerType()
    const { data: manageOrgData = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })
    const treeData = buildOrgTree(manageOrgData)

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

    const handleRowClick = (record: { id?: string }) => {
        if (record?.id) {
            router.push(`${ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN}/${record.id}`)
        }
    }

    return (
        <div>
            <Row gutter={[16, 16]}>
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
                                title: 'Đơn vị',
                                dataIndex: 'organization',
                                align: 'center',
                                width: 150,
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
                                width: 150,
                                render: (__, record) => {
                                    return record?.mainSubjectClasses.length ? (
                                        <ul
                                            style={{
                                                paddingLeft: 16,
                                                margin: 0,
                                            }}
                                        >
                                            {record?.mainSubjectClasses?.map(
                                                (val: SubjectClass) => (
                                                    <li key={val.id}>{val.name}</li>
                                                )
                                            )}
                                        </ul>
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Lớp trợ giảng',
                                dataIndex: 'extraSubjectClasses',
                                align: 'center',
                                width: 150,
                                render: (__, record) => {
                                    return record?.extraSubjectClasses.length ? (
                                        <ul
                                            style={{
                                                paddingLeft: 16,
                                                margin: 0,
                                            }}
                                        >
                                            {record?.extraSubjectClasses?.map(
                                                (val: SubjectClass) => (
                                                    <li key={val.id}>{val.name}</li>
                                                )
                                            )}
                                        </ul>
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Lớp được quản lý',
                                dataIndex: 'manageFixedClass',
                                align: 'center',
                                width: 150,
                                render: (__, record) => {
                                    return record?.manageFixedClass.length ? (
                                        <ul
                                            style={{
                                                paddingLeft: 16,
                                                margin: 0,
                                            }}
                                        >
                                            {record?.manageFixedClass?.map((val: FixedClass) => (
                                                <li key={val.id}>{val.name}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        ''
                                    )
                                },
                            },
                        ]}
                        data={data}
                        rowKey="id"
                        onRowClick={(record) => handleRowClick(record)}
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
