import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import PrinterIcon from '@components/icons/print'
import { ModalTomTatLyLich, PutStudentModal } from '@components/modal'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import {
    DEFAULT_PAGINATE_SIZE,
    FIXED_CLASS_STUDENT_STATUS,
    GENDER_MEAN_NEW,
    USER_TYPE,
} from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { useCountUserProfile, useFindManyDM_NhanVien, useUpdateStudent } from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
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
        iGioiTinh: undefined,
        email: '',
        phoneNumber: '',
    })

    const [importModalVisible, setImportModalVisible] = useState(false)

    const router = useRouter()
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const { data: UserProfileData = [], refetch } = useFindManyDM_NhanVien({
        where: {
            ...(filters.code
                ? {
                      sMa: {
                          contains: filters.code,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.name
                ? {
                      OR: [
                          {
                              sTen: {
                                  contains: filters.name,
                              },
                          },
                          {
                              sHoVaDem: {
                                  contains: filters.name,
                              },
                          },
                      ],
                  }
                : {}),
            ...(filters.dateOfBirth?.length === 2
                ? {
                      dNgaySinh: {
                          gte: dayjs(filters.dateOfBirth?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.dateOfBirth?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            // ...(filters.iGioiTinh
            //     ? {
            //           iGioiTinh: {
            //               in: filters.iGioiTinh,
            //           },
            //       }
            //     : {}),
            // ...(filters.phoneNumber
            //     ? {
            //           sSDTDiDong: {
            //               contains: filters.phoneNumber,
            //               mode: 'insensitive',
            //           },
            //       }
            //     : {}),
            // ...(filters.email
            //     ? {
            //           sEmail: {
            //               contains: filters.email,
            //               mode: 'insensitive',
            //           },
            //       }
            //     : {}),
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
                      gender: {
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

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen, onClose } = useDisclosure<{
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

    const { onOpen: onOpenModalTomTatLyLich } = useDisclosure<{
        id: string
    }>({
        tag: ModalTomTatLyLich.name,
    })

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
                                render: (__, record) => record.sMa,
                            },
                            {
                                title: 'Họ và tên',
                                align: 'center',
                                width: 180,
                                fixed: 'left',
                                render: (__, record) =>
                                    record.sTenDayDu
                                        ? record.sTenDayDu
                                        : `${record?.sHoVaDem} ${record?.sTenDayDu}`,
                                type: 'input',
                                dataIndex: 'name',
                            },
                            {
                                title: 'CCCD/CMND',
                                align: 'center',
                                width: 150,
                                fixed: 'left',
                                render: (__, record) => (record.sCCCD ? record.sCCCD : ''),
                                type: 'input',
                                dataIndex: 'sCCCD',
                            },
                            {
                                title: 'Ngày sinh',
                                align: 'center',
                                width: 150,
                                dataIndex: 'dNgaySinh',
                                type: 'date',
                                render: (__, record) =>
                                    record?.dNgaySinh
                                        ? dayjs(record.dNgaySinh).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Giới tính',
                                align: 'center',
                                width: 100,
                                type: 'select',
                                dataIndex: 'gender',
                                options: [
                                    { label: 'Nam', value: 0 },
                                    { label: 'Nữ', value: 1 },
                                ],

                                render: (__, record) =>
                                    record?.iGioiTinh
                                        ? GENDER_MEAN_NEW[
                                              record?.iGioiTinh as keyof typeof GENDER_MEAN_NEW
                                          ]
                                        : '',
                            },
                            {
                                title: 'SĐT',
                                align: 'center',
                                width: 120,
                                type: 'input',
                                dataIndex: 'phoneNumber',
                                render: (__, record) =>
                                    record?.sSDTDiDong ? record?.sSDTDiDong : '',
                            },
                            {
                                title: 'Email',
                                align: 'center',
                                width: 150,
                                type: 'input',
                                dataIndex: 'email',
                                render: (__, record) => (record.sEmail ? record?.sEmail : ''),
                            },
                            {
                                title: 'Vị trí công việc',
                                align: 'center',
                                width: 150,
                                render: (__, record) =>
                                    record?.sDM_ViTriCongViecId
                                        ? USER_TYPE.find(
                                              (item) => item.value === record?.sDM_ViTriCongViecId
                                          )?.label
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
                                render: (_, { Id, sCCCD }) => (
                                    <Row className="justify-center gap-2">
                                        <PrinterIcon
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onOpenModalTomTatLyLich({ id: Id })
                                            }}
                                        />
                                        <EditIcon
                                            onClick={() => {
                                                router.push(`quan-ly-ho-so/${sCCCD}`)
                                            }}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
                                        <DeleteIcon
                                            popConfirm={{
                                                onConfirm: () => handleDelete(Id),
                                            }}
                                        />
                                    </Row>
                                ),
                            },
                        ]}
                        rowKey="Id"
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
