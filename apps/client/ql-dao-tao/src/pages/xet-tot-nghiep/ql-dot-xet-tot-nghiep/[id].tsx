import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import RejectIcon from '@components/icons/reject'
import { ModalLearningResult, PutGraduationApplication } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useAcademicRankingBaseTypeOptions } from '@hooks/academicRankingBaseType'
import { useApplicationStatusOptions } from '@hooks/applicationStatus'
import { useCriteriaFieldOptions } from '@hooks/criteriaField'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { ApplicationStatus, Gender } from '@workspace/db'
import {
    useCountStudentGraduationApplication,
    useFindManyStudentGraduationApplication,
    useUpdateManyStudentGraduationApplication,
    useUpdateStudentGraduationApplication,
    useUpsertGraduationDecision,
} from '@workspace/db/hooks'
import type { GraduationCheckResult } from '@workspace/libs/api/schemas/graduationCheckResult'
import { useGraduationCheck } from '@workspace/libs/api/training'
import { Button, Col, Flex, Modal, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import { BookPlus, X } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function StudentGraduationApplication() {
    const router = useRouter()
    const { getApplicationStatusLabel, getApplicationStatusColor } = useApplicationStatusOptions()
    const { getAcademicRankingBaseTypeLabel } = useAcademicRankingBaseTypeOptions()
    const { getCriteriaFieldLabel } = useCriteriaFieldOptions()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const [graduationCheckResults, setGraduationCheckResults] = useState<GraduationCheckResult[]>(
        []
    )

    const graduationSessionId = router.query.id as string

    const { data: studentGraduationApplicationData, refetch } =
        useFindManyStudentGraduationApplication({
            where: {
                sessionId: graduationSessionId,
            },
            include: {
                student: {
                    include: {
                        userProfile: {
                            include: {
                                ethnicity: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        })

    const data = useMemo(() => {
        return studentGraduationApplicationData?.map((item) => {
            const result = graduationCheckResults.find((r) => r.applicationId === item.id)
            if (result) {
                return {
                    ...item,
                    gpa: result.gpa,
                    graduation: result.graduation,
                    rank: result.rank,
                    reason: result.reason,
                }
            }
            return item
        })
    }, [studentGraduationApplicationData, graduationCheckResults])

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
    const { mutateAsync: updateManyStudentGraduationApplication } =
        useUpdateManyStudentGraduationApplication()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateStudentGraduationApplication({
                where: { id },
                data: { deletedAt: new Date() },
            })
            message.success('Xóa thành công')
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    async function handleReject(id: string) {
        try {
            showSpinner()
            await updateStudentGraduationApplication({
                where: { id },
                data: { status: ApplicationStatus.REJECTED },
            })
            message.success('Từ chối thành công')
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { mutateAsync: graduationCheck } = useGraduationCheck()
    const handleMutationGraduationCheck = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một sinh viên để xét tốt nghiệp')
            return
        }

        try {
            showSpinner()
            await updateManyStudentGraduationApplication({
                where: { id: { in: selectedRowKeys } },
                data: { status: ApplicationStatus.IN_REVIEW },
            })
            await refetch()

            const res = await graduationCheck({
                data: {
                    sessionId: graduationSessionId,
                    applicationIds: selectedRowKeys,
                },
            })

            if (res.status === 200) {
                setGraduationCheckResults(res.data.results)

                message.success('Xét tốt nghiệp thành công')
            }
        } catch (error) {
            message.error('Đã xảy ra lỗi khi xét tốt nghiệp')
            console.error(error)
        } finally {
            hideSpinner()
        }
    }

    const handleRejectAll = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một sinh viên để từ chối')
            return
        }

        Modal.confirm({
            title: 'Xác nhận từ chối',
            content: `Bạn có chắc chắn muốn từ chối ${selectedRowKeys.length} sinh viên đã chọn?`,
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    showSpinner()
                    await updateManyStudentGraduationApplication({
                        where: { id: { in: selectedRowKeys } },
                        data: { status: ApplicationStatus.REJECTED },
                    })
                    await refetch()
                    setSelectedRowKeys([])
                    message.success('Từ chối thành công')
                } catch (error) {
                    message.error('Đã xảy ra lỗi khi từ chối')
                    console.error(error)
                } finally {
                    hideSpinner()
                }
            },
        })
    }

    const isApproveButtonDisabled = useMemo(() => {
        if (selectedRowKeys.length === 0) return true

        // Kiểm tra tất cả các bản ghi được chọn có status là IN_REVIEW không
        const selectedRecords = data?.filter((record) => selectedRowKeys.includes(record.id)) || []

        return !selectedRecords.every(
            (record) => record.status === ApplicationStatus.IN_REVIEW && record.graduation === true
        )
    }, [selectedRowKeys, data])

    const { mutateAsync: upsertGraduationDecision } = useUpsertGraduationDecision()

    const handleApproved = async () => {
        Modal.confirm({
            title: 'Xác nhận chấp thuận',
            content: `Bạn có chắc chắn muốn chấp nhận ${selectedRowKeys.length} sinh viên đã chọn?`,
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    showSpinner()
                    await updateManyStudentGraduationApplication({
                        where: { id: { in: selectedRowKeys } },
                        data: { status: ApplicationStatus.APPROVED },
                    })
                    await refetch()
                    setSelectedRowKeys([])
                    message.success('Duyệt thành công')
                } catch (error) {
                    message.error('Đã xảy ra lỗi khi từ chối')
                    console.error(error)
                } finally {
                    hideSpinner()
                }
            },
        })
    }

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys as string[])
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
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
                                                    <Button
                                                        onClick={handleRejectAll}
                                                        type="primary"
                                                    >
                                                        <X />
                                                        Từ chối
                                                    </Button>
                                                    <Button onClick={handleModal} type="primary">
                                                        <BookPlus />
                                                        Thêm
                                                    </Button>
                                                    <Button
                                                        type="primary"
                                                        className="h-[32px] px-4"
                                                        onClick={handleMutationGraduationCheck}
                                                    >
                                                        <BookPlus />
                                                        Xét
                                                    </Button>
                                                    <Button
                                                        type="primary"
                                                        className="h-[32px] px-4"
                                                        onClick={handleApproved}
                                                        disabled={isApproveButtonDisabled}
                                                    >
                                                        <BookPlus />
                                                        Duyệt
                                                    </Button>
                                                </Flex>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <Table
                                            rowKey="id"
                                            id="student-graduation-application"
                                            rowSelection={{
                                                type: 'checkbox',
                                                ...rowSelection,
                                            }}
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
                                                    width: 120,
                                                    fixed: 'left',
                                                    render: (_, record) =>
                                                        record.student?.userProfile?.code || '',
                                                },
                                                {
                                                    title: 'Họ và tên',
                                                    width: 200,
                                                    render: (record) =>
                                                        record.student?.userProfile?.fullname,
                                                },
                                                {
                                                    title: 'Ngày sinh',
                                                    width: 150,
                                                    align: 'center',
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
                                                    align: 'center',
                                                    width: 90,
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
                                                    align: 'center',
                                                },
                                                {
                                                    title: 'Dân tộc',
                                                    dataIndex: '',
                                                    width: 100,
                                                    align: 'center',
                                                    render: (_, record) =>
                                                        record.student?.userProfile?.ethnicity
                                                            ?.sTen || '',
                                                },
                                                {
                                                    title: 'Ngày nộp đơn',
                                                    dataIndex: 'applicationDate',
                                                    align: 'center',
                                                    width: 150,
                                                    render: (record: string) =>
                                                        record
                                                            ? dayjs(record).format('DD/MM/YYYY')
                                                            : '',
                                                },
                                                {
                                                    title: 'GPA',
                                                    width: 100,
                                                    align: 'center',
                                                    render: (record) => {
                                                        if (record?.gpa) {
                                                            return <span>{record.gpa}</span>
                                                        }
                                                        return null
                                                    },
                                                },

                                                {
                                                    title: 'Hệ số xét',
                                                    width: 100,
                                                    align: 'center',
                                                    render: (record) => {
                                                        if (record?.rank?.baseScore) {
                                                            return (
                                                                <span>
                                                                    {getAcademicRankingBaseTypeLabel(
                                                                        record.rank.baseScore
                                                                    )}
                                                                </span>
                                                            )
                                                        }
                                                        return null
                                                    },
                                                },
                                                {
                                                    title: 'Xếp loại',
                                                    width: 100,
                                                    align: 'center',
                                                    render: (record) => {
                                                        if (record?.rank?.classification) {
                                                            return (
                                                                <span>
                                                                    {record.rank.classification}
                                                                </span>
                                                            )
                                                        }
                                                        return null
                                                    },
                                                },
                                                {
                                                    title: 'Kết quả xét',
                                                    width: 100,
                                                    align: 'center',
                                                    render: (record) => {
                                                        if (record?.graduation) {
                                                            return <Tag color="green">Đạt</Tag>
                                                        }
                                                        return null
                                                    },
                                                },
                                                {
                                                    title: 'Ghi chú',
                                                    width: 220,
                                                    align: 'center',
                                                    render: (record) => {
                                                        if (
                                                            record?.rank?.downgradeRules?.length > 0
                                                        ) {
                                                            return (
                                                                <span>
                                                                    Hạ bậc:{' '}
                                                                    {record.rank.downgradeRules
                                                                        .flatMap(
                                                                            (rule: any) =>
                                                                                rule.conditions?.map(
                                                                                    (
                                                                                        condition: any
                                                                                    ) =>
                                                                                        getCriteriaFieldLabel(
                                                                                            condition.field
                                                                                        )
                                                                                ) || []
                                                                        )
                                                                        .filter(Boolean)
                                                                        .join(', ')}
                                                                </span>
                                                            )
                                                        }
                                                        if (record?.reason) {
                                                            return <span>{record.reason}</span>
                                                        }
                                                        return null
                                                    },
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
                                                                    <RejectIcon
                                                                        popConfirm={{
                                                                            onConfirm: () =>
                                                                                handleReject(id),
                                                                        }}
                                                                    />
                                                                    <EditIcon
                                                                        onClick={() => {
                                                                            onOpen({
                                                                                id,
                                                                                graduationSessionId,
                                                                            })
                                                                        }}
                                                                        className="text-sm text-blue-700 cursor-pointer"
                                                                    />
                                                                    <DeleteIcon
                                                                        popConfirm={{
                                                                            onConfirm: () =>
                                                                                handleDelete(id),
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
                                            data={data}
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
