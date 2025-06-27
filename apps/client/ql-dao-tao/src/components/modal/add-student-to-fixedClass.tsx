import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import {
    DEFAULT_PAGINATE_SIZE,
    FIXED_CLASS_STUDENT_STATUS,
    GENDER_MEAN,
} from '@constants/constants'
import useSpinner from '@hooks/spinner'
import type { Student } from '@workspace/db'
import { useCountStudent, useFindManyStudent, useUpdateManyStudent } from '@workspace/db/hooks'
import { Col, Divider, Flex, Form, Input, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import Table from '@components/commons/table'
import _ from 'lodash'
import { Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')

interface FilterProps {
    searchText: string | undefined
    trainingObjectTypeId: string | undefined
}
const AddStudentToFixedClassModal = () => {
    const router = useRouter()
    const fixedClassId = router.query.id as string
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPagesNotClass, setNumberOfPagesNotClass] = useState(DEFAULT_PAGINATE_SIZE)
    const [currentPageNotClass, setCurrentPageNotClass] = useState(1)
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const [form] = Form.useForm<{ list: Student[] }>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: AddStudentToFixedClassModal.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectTypeId: undefined,
    })
    // const { mutateAsync: createSubjectVersion } = useCreateSubjectVersion()
    const { mutateAsync: updateManyUserProfile } = useUpdateManyStudent()
    const { data: dataStudentNotClass = [], refetch } = useFindManyStudent({
        where: {
            fixedClassId: null,
            userProfile: {
                OR: [
                    {
                        firstName: {
                            contains: filters.searchText,
                            mode: 'insensitive',
                        },
                    },
                    {
                        code: {
                            contains: filters.searchText,
                            mode: 'insensitive',
                        },
                    },
                ],
            },
        },
        include: {
            userProfile: true,
            trainingObjectType: {
                include: {
                    trainingFields: {
                        include: {
                            trainingField: true,
                        },
                    },
                    trainingMajors: {
                        include: {
                            trainingMajor: true,
                        },
                    },
                },
            },
            fixedClass: {
                include: {
                    trainingCourse: true,
                    curriculumVersion: {
                        include: {
                            curriculum: {
                                include: {
                                    trainingMajor: {
                                        include: {
                                            trainingField: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            curriculumVersion: {
                include: {
                    curriculum: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPagesNotClass,
        skip: (currentPageNotClass - 1) * numberOfPagesNotClass,
    })

    const { data: countNotClass } = useCountStudent({
        where: {
            fixedClassId: null,
            userProfile: {
                OR: [
                    {
                        firstName: {
                            contains: filters.searchText,
                            mode: 'insensitive',
                        },
                    },
                    {
                        code: {
                            contains: filters.searchText,
                            mode: 'insensitive',
                        },
                    },
                ],
            },
        },
    })

    const { data = [], refetch: refetchStudent } = useFindManyStudent({
        where: {
            fixedClassId,
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
        include: {
            userProfile: true,
            trainingObjectType: {
                include: {
                    trainingFields: {
                        include: {
                            trainingField: true,
                        },
                    },
                    trainingMajors: {
                        include: {
                            trainingMajor: true,
                        },
                    },
                },
            },
            fixedClass: {
                include: {
                    trainingCourse: true,
                    curriculumVersion: {
                        include: {
                            curriculum: {
                                include: {
                                    trainingMajor: {
                                        include: {
                                            trainingField: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            curriculumVersion: {
                include: {
                    curriculum: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountStudent({
        where: {
            fixedClassId,
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
    })

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
    async function onOk() {
        try {
            showSpinner()
            if (selectedRowKeys?.length > 0) {
                await updateManyUserProfile({
                    where: {
                        id: {
                            in: selectedRowKeys,
                        },
                    },
                    data: {
                        fixedClassId: fixedClassId,
                    },
                })
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Subject'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Thêm sinh viên vào lớp'}
            className="w-[80vw]"
        >
            <Col span={24} className="my-4">
                <Flex>
                    <Input
                        id="search"
                        onChange={(e) => handleFilterChange('searchText', e.target.value)}
                        placeholder="Tìm kiếm"
                        style={{
                            width: 300,
                            marginRight: 8,
                            height: 32,
                        }}
                        prefix={
                            <Search
                                size={16}
                                style={{
                                    color: 'rgba(0, 0, 0, 0.25)',
                                }}
                            />
                        }
                        allowClear
                    />
                </Flex>
            </Col>
            <Col span={12}>
                <Row>
                    <Col span={24}>
                        <Divider orientation="left" orientationMargin={0}>
                            Danh sách sinh viên trong lớp
                        </Divider>
                    </Col>
                </Row>
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
                            title: 'Mã sinh viên',
                            dataIndex: 'code',
                            width: 120,
                            align: 'center',
                        },
                        {
                            title: 'Họ và tên',
                            width: 150,
                            render: (record) =>
                                record.userProfile
                                    ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                                    : '',
                        },
                        {
                            title: 'Ngày sinh',
                            align: 'center',
                            width: 100,
                            render: (record) =>
                                record.userProfile?.dateOfBirth
                                    ? dayjs(record.userProfile.dateOfBirth).format('DD/MM/YYYY')
                                    : '',
                        },
                        {
                            title: 'Giới tính',
                            align: 'center',
                            width: 80,
                            render: (record) =>
                                record.userProfile?.gender
                                    ? GENDER_MEAN[
                                          record.userProfile.gender as keyof typeof GENDER_MEAN
                                      ]
                                    : '',
                        },
                        {
                            title: 'Ngành',
                            width: 150,
                            render: (record) => {
                                return (
                                    record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                                        ?.trainingField?.name || ''
                                )
                            },
                        },
                        {
                            title: 'Chuyên ngành',
                            width: 180,
                            render: (record) => {
                                return (
                                    record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                                        ?.name || ''
                                )
                            },
                        },
                        {
                            title: 'Chương trình đào tạo',
                            width: 250,
                            render: (record) => {
                                const curriculum = record.curriculumVersion
                                return curriculum ? curriculum.name : ''
                            },
                        },
                        {
                            title: 'Trạng thái',
                            align: 'center',
                            width: 120,
                            render: (_, record) => {
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
                        // {
                        //     title: 'Thao tác',
                        //     width: 100,
                        //     align: 'center',
                        //     fixed: 'right',
                        //     render: (_, { id }) => (
                        //         <Row className="justify-center gap-2">
                        //             <Tooltip title="Kết quả học tập">
                        //                 <BookCheckIcon
                        //                     onClick={(e) => {
                        //                         e.stopPropagation()
                        //                         router.push(
                        //                             ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_KET_QUA_HOC_TAP_ID.replace(
                        //                                 '[id]',
                        //                                 id
                        //                             )
                        //                         )
                        //                     }}
                        //                     size={16}
                        //                 />
                        //             </Tooltip>
                        //             <EditIcon
                        //                 onClick={onOpenUpdate.bind(null, {
                        //                     id: id,
                        //                 })}
                        //                 className="text-sm text-blue-700 cursor-pointer"
                        //             />
                        //             <DeleteIcon
                        //                 popConfirm={{
                        //                     onConfirm: () =>
                        //                         handleDelete(id),
                        //                 }}
                        //             />
                        //         </Row>
                        //     ),
                        // },
                    ]}
                    data={data}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: count,
                        onChange: setCurrentPage,
                        onShowSizeChange: setNumberOfPages,
                        showTotal: (total, range) =>
                            `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                    }}
                />
            </Col>
            <Col span={12}>
                <Row>
                    <Col span={24}>
                        <Divider orientation="left" orientationMargin={0}>
                            Danh sách sinh viên chưa có lớp
                        </Divider>
                    </Col>
                </Row>
                <Table
                    rowKey="id"
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (selectedKeys: any) => setSelectedRowKeys(selectedKeys),
                    }}
                    columns={[
                        {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) =>
                                index + 1 + (currentPageNotClass - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                            title: 'Mã sinh viên',
                            dataIndex: 'code',
                            width: 120,
                            align: 'center',
                        },
                        {
                            title: 'Họ và tên',
                            width: 150,
                            render: (record) =>
                                record.userProfile
                                    ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                                    : '',
                        },
                        {
                            title: 'Ngày sinh',
                            align: 'center',
                            width: 100,
                            render: (record) =>
                                record.userProfile?.dateOfBirth
                                    ? dayjs(record.userProfile.dateOfBirth).format('DD/MM/YYYY')
                                    : '',
                        },
                        {
                            title: 'Giới tính',
                            align: 'center',
                            width: 80,
                            render: (record) =>
                                record.userProfile?.gender
                                    ? GENDER_MEAN[
                                          record.userProfile.gender as keyof typeof GENDER_MEAN
                                      ]
                                    : '',
                        },
                        {
                            title: 'Ngành',
                            width: 150,
                            render: (record) => {
                                return record?.fixedClass?.curriculumVersion?.curriculum
                                    ?.trainingMajor?.trainingField?.name
                            },
                        },
                        {
                            title: 'Chuyên ngành',
                            width: 180,
                            render: (record) => {
                                return record?.fixedClass?.curriculumVersion?.curriculum
                                    ?.trainingMajor?.name
                            },
                        },
                        {
                            title: 'Chương trình đào tạo',
                            width: 250,
                            render: (record) => {
                                const curriculum = record.curriculumVersion
                                return curriculum ? curriculum.name : ''
                            },
                        },
                        {
                            title: 'Trạng thái',
                            align: 'center',
                            width: 120,
                            render: (_, record) => {
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
                        // {
                        //     title: 'Thao tác',
                        //     width: 100,
                        //     align: 'center',
                        //     fixed: 'right',
                        //     render: (_, { id }) => (
                        //         <Row className="justify-center gap-2">
                        //             <Tooltip title="Kết quả học tập">
                        //                 <BookCheckIcon
                        //                     onClick={(e) => {
                        //                         e.stopPropagation()
                        //                         router.push(
                        //                             ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_KET_QUA_HOC_TAP_ID.replace(
                        //                                 '[id]',
                        //                                 id
                        //                             )
                        //                         )
                        //                     }}
                        //                     size={16}
                        //                 />
                        //             </Tooltip>
                        //             <EditIcon
                        //                 onClick={onOpenUpdate.bind(null, {
                        //                     id: id,
                        //                 })}
                        //                 className="text-sm text-blue-700 cursor-pointer"
                        //             />
                        //             <DeleteIcon
                        //                 popConfirm={{
                        //                     onConfirm: () =>
                        //                         handleDelete(id),
                        //                 }}
                        //             />
                        //         </Row>
                        //     ),
                        // },
                    ]}
                    data={dataStudentNotClass}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: currentPageNotClass,
                        pageSize: numberOfPagesNotClass,
                        total: countNotClass,
                        onChange: setCurrentPageNotClass,
                        onShowSizeChange: setNumberOfPagesNotClass,
                        showTotal: (total, range) =>
                            `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                    }}
                />
            </Col>
        </PutFormModal>
    )
}

export default AddStudentToFixedClassModal
