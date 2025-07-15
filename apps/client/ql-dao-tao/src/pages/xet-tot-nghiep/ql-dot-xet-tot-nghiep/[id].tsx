import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { ModalLearningResult, PutGraduationApplication } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useApplicationStatusOptions } from '@hooks/applicationStatus'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { Gender } from '@workspace/db'
import {
    useCountStudentGraduationApplication,
    useFindManyStudentGraduationApplication,
    useUpdateStudentGraduationApplication,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export default function StudentGraduationApplication() {
    const router = useRouter()
    const { getApplicationStatusLabel, getApplicationStatusColor } = useApplicationStatusOptions()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

    const graduationSessionId = router.query.id as string

    const { data: studentGraduationApplicationData, refetch } =
        useFindManyStudentGraduationApplication({
            where: {
                sessionId: graduationSessionId,
            },
            include: {
                student: {
                    include: {
                        userProfile: true,
                    },
                },
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        })

    const { data: count } = useCountStudentGraduationApplication({
        where: {
            sessionId: graduationSessionId,
        },
    })

    const { onOpen } = useDisclosure<{
        id: string | null
        graduationSessionId: string | undefined
    }>({
        tag: PutGraduationApplication.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen({ id: null, graduationSessionId })
    }

    const { onOpen: onOpenModalLearningResult } = useDisclosure<string>({
        tag: ModalLearningResult.name,
    })

    const handleOpenModalLearningResult = (record: any) => {
        onOpenModalLearningResult(record.student.id)
    }

    const { mutateAsync: updateStudentGraduationApplication } =
        useUpdateStudentGraduationApplication()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateStudentGraduationApplication({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa thành công')
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <Row gutter={[16, 0]} className="mt-2">
            <Col span={24} className="!p-0">
                <Flex vertical gap={16}>
                    <Col span={24}>
                        <div className="bg-white rounded-lg shadow-sm p-4">123</div>
                    </Col>
                    <Flex>
                        <Col span={24}>
                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <Row gutter={[16, 0]}>
                                    <Col span={24}>
                                        <Row gutter={[16, 16]} align="top" justify="space-between">
                                            <Col span={24}>
                                                <Flex justify="end" gap={4} className="ml-auto">
                                                    {/* <Button type="primary">
                                                        <FileUp />
                                                        Nhập đơn xét tốt nghiệp
                                                    </Button> */}
                                                    <Button onClick={handleModal} type="primary">
                                                        <BookPlus />
                                                        Thêm
                                                    </Button>
                                                    <Button
                                                        type="primary"
                                                        className="h-[32px] px-4"
                                                        // onClick={handleTransferData}
                                                        // disabled={transferDataDisabled}
                                                    >
                                                        <BookPlus />
                                                        Xét
                                                    </Button>
                                                </Flex>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <Table
                                            rowKey="id"
                                            id="student-graduation-application"
                                            onRowClick={(record) =>
                                                handleOpenModalLearningResult(record)
                                            }
                                            columns={[
                                                {
                                                    title: 'STT',
                                                    width: 60,
                                                    align: 'center',
                                                    fixed: 'left',
                                                    render: (_, __, index) =>
                                                        index +
                                                        1 +
                                                        (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                                                },
                                                {
                                                    title: 'Mã sinh viên',
                                                    align: 'center',
                                                    width: 100,
                                                    fixed: 'left',
                                                    render: (_, record) =>
                                                        record.student?.userProfile?.code || '',
                                                },
                                                {
                                                    title: 'Họ và tên',
                                                    width: 150,
                                                    render: (record) =>
                                                        record.student?.userProfile?.fullname,
                                                },
                                                {
                                                    title: 'Ngày sinh',
                                                    width: 150,
                                                    render: (record) =>
                                                        record?.student?.userProfile?.dateOfBirth
                                                            ? dayjs(
                                                                  record?.student?.userProfile
                                                                      ?.dateOfBirth
                                                              ).format('DD/MM/YYYY')
                                                            : '',
                                                },
                                                {
                                                    title: 'Giới tính',
                                                    dataIndex: ['student', 'userProfile', 'gender'],
                                                    width: 70,
                                                    render: (value: Gender) => {
                                                        switch (value) {
                                                            case Gender.Male:
                                                                return 'Nam'
                                                            case Gender.Female:
                                                                return 'Nữ'
                                                            default:
                                                                return ''
                                                        }
                                                    },
                                                },
                                                {
                                                    title: 'Nơi sinh',
                                                    dataIndex: [
                                                        'student',
                                                        'userProfile',
                                                        'placeOfBirth',
                                                    ],
                                                    width: 150,
                                                },
                                                {
                                                    title: 'Dân tộc',
                                                    dataIndex: '',
                                                    width: 100,
                                                },
                                                {
                                                    title: 'Ngày nộp đơn',
                                                    dataIndex: 'applicationDate',
                                                    width: 150,
                                                    render: (record: string) =>
                                                        record
                                                            ? dayjs(record).format('DD/MM/YYYY')
                                                            : '',
                                                },
                                                {
                                                    title: 'Trạng thái',
                                                    dataIndex: 'status',
                                                    align: 'center',
                                                    width: 140,
                                                    fixed: 'right',
                                                    render: (record) => {
                                                        const label =
                                                            getApplicationStatusLabel(record)
                                                        const color =
                                                            getApplicationStatusColor(record)
                                                        return <Tag color={color}>{label}</Tag>
                                                    },
                                                },
                                                {
                                                    title: 'Thao tác',
                                                    width: 100,
                                                    align: 'center',
                                                    fixed: 'right',
                                                    render: (_, { id }) => {
                                                        if (id) {
                                                            return (
                                                                <Row className="justify-center gap-2">
                                                                    <EditIcon
                                                                        onClick={(e) => {
                                                                            onOpen({
                                                                                id,
                                                                                graduationSessionId,
                                                                            })
                                                                            e.stopPropagation()
                                                                        }}
                                                                        className="text-sm text-blue-700 cursor-pointer"
                                                                    />
                                                                    <DeleteIcon
                                                                        popConfirm={{
                                                                            onConfirm: (e) => {
                                                                                handleDelete(id)
                                                                                e?.stopPropagation()
                                                                            },
                                                                        }}
                                                                    />
                                                                </Row>
                                                            )
                                                        }
                                                        return ''
                                                    },
                                                },
                                            ]}
                                            pagination={{
                                                current: currentPage,
                                                pageSize: numberOfPages,
                                                total: count,
                                                onChange: setCurrentPage,
                                                onShowSizeChange: setNumberOfPages,
                                            }}
                                            data={studentGraduationApplicationData}
                                        />
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                    </Flex>
                </Flex>
            </Col>
        </Row>
    )
}

StudentGraduationApplication.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
