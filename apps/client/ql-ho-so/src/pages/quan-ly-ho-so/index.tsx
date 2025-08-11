import Select from '@components/commons/select'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { ModalLyLichCanBo, ModalSoYeuLyLich, ModalTomTatLyLich } from '@components/modal'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { DEFAULT_PAGINATE_SIZE, FIXED_CLASS_STUDENT_STATUS } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { DM_DonVi } from '@workspace/db'
import {
    useCountUserProfile,
    useFindManyDM_DonVi,
    useFindManyDM_GioiTinh,
    useFindManyUserProfile,
    useUpdateStudent,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Dropdown, Flex, Form, Input, Menu, message, Row, Tag } from 'antd'
import axios from 'axios'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Printer } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

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
        originalPlace: '',
        sDM_DonViId: '',
    })

    const router = useRouter()

    const { data: UserProfileData = [], refetch } = useFindManyUserProfile({
        where: {
            ...(filters.originalPlace
                ? {
                      originalPlace: {
                          contains: filters.originalPlace,
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
            ...(filters.sDM_DonViId
                ? {
                      sDM_DonViId: {
                          equals: filters.sDM_DonViId,
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
            capBac: {
                include: {
                    capBac: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: DEFAULT_PAGINATE_SIZE,
        skip: (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
    })

    const { data: count } = useCountUserProfile({
        where: {
            ...(filters.originalPlace
                ? {
                      originalPlace: {
                          contains: filters.originalPlace,
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
            ...(filters.sDM_DonViId
                ? {
                      sDM_DonViId: {
                          equals: filters.sDM_DonViId,
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
    const { data: organizations = [] } = useFindManyDM_DonVi()
    const { showSpinner, hideSpinner } = useSpinner()
    // const treeData = buildOrgTree(organizations)
    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }
    const handleModal = () => {
        router.push(ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_TAO_MOI)
    }

    const { onOpen: onOpenModalTomTatLyLich } = useDisclosure<{
        id: string
    }>({
        tag: ModalTomTatLyLich.name,
    })

    const { onOpen: onOpenModalLyLichCanBo } = useDisclosure<{
        id: string
    }>({
        tag: ModalLyLichCanBo.name,
    })

    const { onOpen: onOpenModalSoYeuLyLich } = useDisclosure<{
        id: string
    }>({
        tag: ModalSoYeuLyLich.name,
    })

    const { mutateAsync: updateUserProfile } = useUpdateStudent()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            const res = await axios.delete(`https://mta.swantech.vn/DM_NhanViens/${id}`)
            if (res.status === 200) {
                await updateUserProfile({
                    where: {
                        id,
                    },
                    data: {
                        deletedAt: new Date(),
                    },
                })
                message.success('Xoá hồ sơ thành công')
            }
        } catch (error) {
            console.log(error)

            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const list = [
        {
            key: '1',
            label: 'Xuất dữ liệu theo mẫu trích yếu 63',
            onClick: ({ id }: { id: string }) => onOpenModalTomTatLyLich({ id }),
        },
        {
            key: '2',
            label: 'Xuất dữ liệu theo mẫu C2',
            onClick: ({ id }: { id: string }) => onOpenModalLyLichCanBo({ id }),
        },
        {
            key: '3',
            label: 'Xuất dữ liệu theo mẫu sơ yếu lý lịch',
            onClick: ({ id }: { id: string }) => onOpenModalSoYeuLyLich({ id }),
        },
    ]

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[8, 8]} align="top" justify="space-between">
                        <Col xs={12} md={12}>
                            <Flex>
                                <Form.Item
                                    className="mb-0 mr-3"
                                    name="sDM_DonViId"
                                    labelCol={{ span: 24 }}
                                    wrapperCol={{ span: 24 }}
                                    labelAlign="left"
                                >
                                    <Input
                                        id="search"
                                        className="w-[250px]"
                                        onChange={(e) => handleFilterChange('name', e.target.value)}
                                        allowClear
                                        placeholder="Tìm kiếm"
                                    />
                                </Form.Item>
                                <Form.Item
                                    className="mb-0"
                                    name="sDM_DonViId"
                                    labelCol={{ span: 24 }}
                                    wrapperCol={{ span: 24 }}
                                    labelAlign="left"
                                >
                                    <Select
                                        placeholder="Chọn đơn vị quản lý"
                                        options={organizations.map((i: DM_DonVi) => ({
                                            value: i.Id,
                                            label: i.sTen,
                                        }))}
                                        onChange={(val) => handleFilterChange('sDM_DonViId', val)}
                                        allowClear
                                        className="h-8"
                                    />
                                </Form.Item>
                            </Flex>
                        </Col>
                        <Col xs={12}>
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
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
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
                                title: 'Nguyên quán',
                                align: 'center',
                                width: 150,
                                type: 'input',
                                dataIndex: 'originalPlace',
                                render: (__, record) =>
                                    record?.originalPlace ? record?.originalPlace : '',
                            },
                            {
                                title: 'Đơn vị',
                                align: 'center',
                                width: 120,
                                // type: 'tree_select',
                                // options: treeData,
                                dataIndex: 'sDM_DonViId',
                                render: (__, record) => {
                                    if (record?.sDM_DonViId) {
                                        const donVi = organizations.find(
                                            (item: DM_DonVi) => item.Id === record?.sDM_DonViId
                                        )
                                        if (donVi) {
                                            return donVi.sTen
                                        }
                                        return ''
                                    }
                                    return ''
                                },
                            },
                            {
                                title: 'Cấp bậc',
                                align: 'center',
                                width: 120,
                                type: 'input',
                                dataIndex: 'capBac',
                                render: (__, record) =>
                                    record?.capBac?.length ? (
                                        <ul>
                                            {record?.capBac?.map((item: any) => (
                                                <li>- {item?.capBac?.sTen}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        ''
                                    ),
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
                                width: 120,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <Dropdown
                                            overlay={
                                                <Menu>
                                                    {list.map((item) => (
                                                        <Menu.Item
                                                            key={item.key}
                                                            onClick={(e) => item.onClick({ id })}
                                                        >
                                                            {item.label}
                                                        </Menu.Item>
                                                    ))}
                                                </Menu>
                                            }
                                            trigger={['click']}
                                        >
                                            <Button
                                                className="w-fit"
                                                type="link"
                                                icon={<Printer className="text-[#212121]" />}
                                                size="large"
                                            />
                                        </Dropdown>
                                        <EditIcon
                                            onClick={() => {
                                                router.push(`quan-ly-ho-so/${id}`)
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
