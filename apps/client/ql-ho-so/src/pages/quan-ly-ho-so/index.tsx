import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import PrinterIcon from '@components/icons/print'
import { ModalTomTatLyLich, PutStudentModal } from '@components/modal'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { DEFAULT_PAGINATE_SIZE, GENDER_MEAN, USER_TYPE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { useCountUserProfile, useFindManyUserProfile, useUpdateStudent } from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row } from 'antd'
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
        gender: undefined,
        email: '',
        phoneNumber: '',
    })

    const [importModalVisible, setImportModalVisible] = useState(false)

    const router = useRouter()
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const { data: UserProfileData = [], refetch } = useFindManyUserProfile()

    // const { data: count } = useCountStudent({
    //     where: {
    //         trainingObjectType: {
    //             type: {
    //                 equals: $Enums.TrainingObjectTypes.CIVILIAN,
    //             },
    //         },
    //         userProfile: {
    //             OR: [
    //                 {
    //                     firstName: {
    //                         contains: filters.name,
    //                     },
    //                 },
    //                 {
    //                     lastName: {
    //                         contains: filters.name,
    //                     },
    //                 },
    //             ],
    //             ...(filters.gender
    //                 ? {
    //                       gender: {
    //                           in: filters.gender,
    //                       },
    //                   }
    //                 : {}),
    //             ...(filters.dateOfBirth?.length === 2
    //                 ? {
    //                       dateOfBirth: {
    //                           gte: dayjs(filters.dateOfBirth?.[0], 'DD/MM/YYYY').toDate(),
    //                           lte: dayjs(filters.dateOfBirth?.[1], 'DD/MM/YYYY').toDate(),
    //                       },
    //                   }
    //                 : {}),
    //         },
    //         ...(filters.code
    //             ? {
    //                   code: {
    //                       contains: filters.code,
    //                       mode: 'insensitive',
    //                   },
    //               }
    //             : {}),
    //         ...(filters.curriculumVersion
    //             ? {
    //                   curriculumVersionId: {
    //                       in: filters.curriculumVersion,
    //                   },
    //               }
    //             : {}),
    //         // ...(filters.fixedClass
    //         //     ? {
    //         //           fixedClassId: {
    //         //               in: filters.fixedClass,
    //         //           },
    //         //       }
    //         //     : {}),
    //         // ...(filters.trainingMajors || filters.trainingField
    //         //     ? {
    //         //           fixedClass: {
    //         //               curriculumVersion: {
    //         //                   curriculum: {
    //         //                       trainingMajor: {
    //         //                           ...(filters.trainingMajors
    //         //                               ? {
    //         //                                     id: {
    //         //                                         in: filters.trainingMajors,
    //         //                                     },
    //         //                                 }
    //         //                               : {}),
    //         //                           ...(filters.trainingField
    //         //                               ? {
    //         //                                     trainingFieldId: {
    //         //                                         in: filters.trainingField,
    //         //                                     },
    //         //                                 }
    //         //                               : {}),
    //         //                       },
    //         //                   },
    //         //               },
    //         //           },
    //         //       }
    //         //     : {}),
    //     },
    // })

    const { data: count } = useCountUserProfile()

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
                                options: [
                                    { label: 'Nam', value: 'Male' },
                                    { label: 'Nữ', value: 'Female' },
                                ],

                                render: (__, record) =>
                                    record?.gender
                                        ? GENDER_MEAN[record?.gender as keyof typeof GENDER_MEAN]
                                        : '',
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
                            // {
                            //     title: 'ĐTĐT',
                            //     align: 'center',
                            //     width: 150,
                            //     render: (__, record) =>
                            //         record.trainingObjectType ? record.trainingObjectType.name : '',
                            // },
                            // {
                            //     title: 'Lớp',
                            //     align: 'center',
                            //     width: 200,
                            //     dataIndex: 'fixedClass',
                            //     type: 'select',
                            //     options: fixedClassData.map((item: FixedClass) => ({
                            //         label: item.name,
                            //         value: item.id,
                            //     })),
                            //     render: (__, record) => {
                            //         if (!record.fixedClass) return ''
                            //         const fiexedClass = `${record.fixedClass?.code}-${record.fixedClass?.name}`
                            //         return fiexedClass || ''
                            //     },
                            // },
                            // {
                            //     title: 'Khóa',
                            //     align: 'center',
                            //     width: 100,
                            //     dataIndex: 'trainingCourse',
                            //     type: 'select',
                            //     options: TrainingCourseData.map((item: TrainingCourse) => ({
                            //         label: item.name,
                            //         value: item.id,
                            //     })),
                            //     render: (__, record) => {
                            //         const trainingCourse = record?.fixedClass?.trainingCourse
                            //         return trainingCourse ? trainingCourse?.name : ''
                            //     },
                            // },
                            // {
                            //     title: 'Ngành',
                            //     align: 'center',
                            //     width: 160,
                            //     dataIndex: 'trainingField',
                            //     type: 'select',
                            //     options: trainingFieldData.map((item: TrainingField) => ({
                            //         label: item.name,
                            //         value: item.id,
                            //     })),
                            //     render: (__, record) => {
                            //         return record?.fixedClass?.curriculumVersion?.curriculum
                            //             ?.trainingMajor?.trainingField?.name
                            //     },
                            // },
                            // {
                            //     title: 'Chuyên ngành',
                            //     align: 'center',
                            //     width: 180,
                            //     type: 'select',
                            //     dataIndex: 'trainingMajors',
                            //     options: trainingMajorData.map((item: TrainingMajor) => ({
                            //         label: item.name,
                            //         value: item.id,
                            //     })),
                            //     render: (__, record) => {
                            //         return record?.fixedClass?.curriculumVersion?.curriculum
                            //             ?.trainingMajor?.name
                            //     },
                            // },
                            // {
                            //     title: 'CTĐT',
                            //     align: 'center',
                            //     dataIndex: 'curriculumVersion',
                            //     width: 180,
                            //     options: TrainingCurriculumVersionData.map((item) => ({
                            //         label: item.name,
                            //         value: item.name,
                            //     })),
                            //     render: (__, record) => {
                            //         return record?.fixedClass?.curriculumVersion?.curriculum?.name
                            //     },
                            // },
                            // {
                            //     title: 'Trạng thái',
                            //     align: 'center',
                            //     width: 120,
                            //     render: (_, record) => {
                            //         const statusInfo =
                            //             FIXED_CLASS_STUDENT_STATUS[
                            //                 record.status as keyof typeof FIXED_CLASS_STUDENT_STATUS
                            //             ]
                            //         return statusInfo ? (
                            //             <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                            //         ) : (
                            //             <Tag color="default">Không xác định</Tag>
                            //         )
                            //     },
                            // },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <PrinterIcon
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onOpenModalTomTatLyLich({ id })
                                            }}
                                        />
                                        <EditIcon
                                            onClick={onOpenUpdate.bind(null, {
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
