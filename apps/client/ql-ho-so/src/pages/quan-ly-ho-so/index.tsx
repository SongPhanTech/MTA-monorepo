import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import ViewIcon from '@components/icons/view'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { DEFAULT_PAGINATE_SIZE, FIXED_CLASS_STUDENT_STATUS, USER_TYPE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountUserProfile,
    useFindManyDM_GioiTinh,
    useFindManyUserProfile,
    useUpdateStudent,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useState } from 'react'

dayjs.locale('vi')
export default function UserProfilePageDs() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        dateOfBirth: undefined,
        gender: undefined,
        email: '',
        phoneNumber: '',
        idCardNumber: '',
    })

    const [importModalVisible, setImportModalVisible] = useState(false)

    const router = useRouter()
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const { data: UserProfileData = [], refetch } = useFindManyUserProfile({
        where: {
            ...(filters.code
                ? {
                      code: {
                          contains: filters.code,
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
            ...(filters.name
                ? {
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
            ...(filters.gender
                ? {
                      genderId: {
                          in: filters.gender,
                      },
                  }
                : {}),
            ...(filters.phoneNumber
                ? {
                      phoneNumber: {
                          contains: filters.phoneNumber,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.email
                ? {
                      email: {
                          contains: filters.email,
                          mode: 'insensitive',
                      },
                  }
                : {}),
        },
        include: {
            gender: true,
        },
    })

    const { data: count } = useCountUserProfile({
        where: {
            ...(filters.code
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.name
                ? {
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
            ...(filters.gender
                ? {
                      genderId: {
                          in: filters.gender,
                      },
                  }
                : {}),
            ...(filters.phoneNumber
                ? {
                      phoneNumber: {
                          contains: filters.phoneNumber,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.email
                ? {
                      email: {
                          contains: filters.email,
                          mode: 'insensitive',
                      },
                  }
                : {}),
        },
        orderBy: {
            fullname: 'asc',
        },
    })

    const { data: genderData = [] } = useFindManyDM_GioiTinh()

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        router.push(ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_TAO_MOI)
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
            console.log(error)

            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[8, 8]} align="top" justify="end">
                        <Col xs={24}>
                            <Flex justify="end" wrap="wrap" gap="8px" className="mt-1">
                                {/* <Button
                                    type="primary"
                                    onClick={() => setImportModalVisible(true)}
                                    icon={<UploadOutlined />}
                                >
                                    Nhập dữ liêu Excel
                                </Button>
                                <ImportStudentModal
                                    visible={importModalVisible}
                                    onCancel={() => setImportModalVisible(false)}
                                />
                                <ExportTemplateStudent /> */}
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
                        setFilters={setFilters}
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
                                title: 'Mã',
                                dataIndex: 'code',
                                width: 150,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
                            },
                            {
                                title: 'Họ và tên',
                                align: 'center',
                                width: 180,
                                fixed: 'left',
                                render: (__, record) =>
                                    record ? `${record.lastName} ${record.firstName}` : '',
                                type: 'input',
                                dataIndex: 'name',
                            },
                            {
                                title: 'CCCD/CMND',
                                align: 'center',
                                width: 150,
                                fixed: 'left',
                                render: (__, record) =>
                                    record.idCardNumber ? record.idCardNumber : '',
                                type: 'input',
                                dataIndex: 'idCardNumber',
                            },
                            {
                                title: 'Ngày sinh',
                                align: 'center',
                                width: 150,
                                dataIndex: 'dateOfBirth',
                                type: 'date',
                                render: (__, record) =>
                                    record?.dateOfBirth
                                        ? dayjs(record.dateOfBirth).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Giới tính',
                                align: 'center',
                                width: 100,
                                type: 'select',
                                dataIndex: 'gender',
                                options: genderData.map((i) => ({
                                    label: i.sTen,
                                    value: i.Id,
                                })),

                                render: (__, record) =>
                                    record?.gender ? record?.gender?.sTen : '',
                            },
                            {
                                title: 'SĐT',
                                align: 'center',
                                width: 120,
                                type: 'input',
                                dataIndex: 'phoneNumber',
                                render: (__, record) =>
                                    record?.phoneNumber ? record?.phoneNumber : '',
                            },
                            {
                                title: 'Email',
                                align: 'center',
                                width: 150,
                                type: 'input',
                                dataIndex: 'email',
                                render: (__, record) => (record.email ? record?.email : ''),
                            },
                            {
                                title: 'Vị trí công việc',
                                align: 'center',
                                width: 150,
                                render: (__, record) =>
                                    record?.userType
                                        ? USER_TYPE.find((item) => item.value === record?.userType)
                                              ?.label
                                        : '',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 120,
                                render: (_, record: { status?: string }) => {
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
                                render: (_, { id, idCardNumber }) => (
                                    <Row className="justify-center gap-2">
                                        <ViewIcon
                                            onClick={() =>
                                                router.push(
                                                    ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_QL_SINH_VIEN_ID.replace(
                                                        '[id]',
                                                        id
                                                    )
                                                )
                                            }
                                        />
                                        <EditIcon
                                            onClick={() => {
                                                router.push(`quan-ly-ho-so/${idCardNumber}`)
                                            }}
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
                        rowKey="id"
                        // rowSelection={{
                        //     selectedRowKeys,
                        //     onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
                        // }}
                        data={UserProfileData}
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

UserProfilePageDs.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
