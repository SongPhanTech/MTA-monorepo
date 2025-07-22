import Table from '@components/commons/table'
import TableCollapse from '@components/commons/tableCollapse'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutThesisProject } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useFindManyCouncil,
    useFindManyDecision,
    useFindManyStudentThesisRegistration,
    useUpdateThesisProject,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row } from 'antd'
import dayjs from 'dayjs'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function ThesisProjectDetail() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const thesisProjectId = router.query.id as string

    const { data: studentThesisRegistration } = useFindManyStudentThesisRegistration({
        where: {
            thesisProjectId: thesisProjectId,
        },
        include: {
            student: { include: { userProfile: true } },
            reviewedBy: { include: { userProfile: true } },
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: council } = useFindManyCouncil({
        where: {
            thesisId: thesisProjectId,
        },
        include: {
            members: {
                include: { expert: { include: { lecturer: { include: { userProfile: true } } } } },
            },
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: decision } = useFindManyDecision({
        where: {
            thesisProjectId: thesisProjectId,
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { onOpen: openDecision } = useDisclosure<string>({
        tag: PutThesisProject.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateThesisProject } = useUpdateThesisProject()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateThesisProject({
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
        <div>
            <Col span={24}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, margin: 12 }}>
                    SINH VIÊN, HỌC VIÊN ĐĂNG KÝ ĐỒ ÁN
                </div>
                <Row gutter={[0, 16]} align="top" justify="space-between" className="w-full mb-2">
                    <Col span={12}>{/*  */}</Col>
                    <Col span={4}>
                        <Flex justify="end" gap={4}>
                            <Button type="primary">
                                <BookPlus />
                                Thêm mới
                            </Button>
                        </Flex>
                    </Col>
                </Row>
                <Table
                    rowKey="key"
                    id="student-thesis-registration"
                    dataSource={studentThesisRegistration}
                    columns={[
                        {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) => index + 1,
                        },
                        {
                            title: 'Họ và tên',
                            width: 200,
                            fixed: 'left',
                            render: (record) => record.student.userProfile.fullname,
                        },
                        {
                            title: 'Thời gian đăng ký',
                            dataIndex: 'registeredAt',
                            align: 'center',
                            width: 100,
                            render: (record) =>
                                record ? dayjs(record.issueDate).format('DD/MM/YYYY') : '',
                        },
                        {
                            title: 'Người phê duyệt',
                            dataIndex: 'reviewedBy',
                            width: 150,
                            render: (record) => record?.userProfile.fullname,
                        },
                        {
                            title: 'Thời gian phê duyệt',
                            dataIndex: 'reviewedAt',
                            align: 'center',
                            width: 150,
                            render: (record) =>
                                record ? dayjs(record.issueDate).format('DD/MM/YYYY') : '',
                        },
                        {
                            title: 'Ghi chú',
                            dataIndex: 'reviewNote',
                            width: 150,
                        },
                        {
                            title: 'Trạng thái',
                            dataIndex: 'status',
                            align: 'center',
                            width: 150,
                            fixed: 'right',
                        },
                        {
                            title: 'Thao tác',
                            width: 100,
                            align: 'center',
                            fixed: 'right',
                            render: (_, record) => {
                                if (record?.id) {
                                    return (
                                        <Row className="justify-center gap-2">
                                            <EditIcon
                                                // onClick={() =>
                                                //     openRankingCondition({
                                                //         rankingId: id,
                                                //         rankingConditionId: record?.id,
                                                //     })
                                                // }
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                            <DeleteIcon
                                            // popConfirm={{
                                            //     onConfirm: () =>
                                            //         handleDeleteRankingCondition(record?.id),
                                            // }}
                                            />
                                        </Row>
                                    )
                                }
                                return ''
                            },
                        },
                    ]}
                />
            </Col>
            <Col span={24}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, margin: 12 }}>
                    QUYẾT ĐỊNH LIÊN QUAN
                </div>
                <Row gutter={[0, 16]} align="top" justify="space-between" className="w-full mb-2">
                    <Col span={12}>{/*  */}</Col>
                    <Col span={4}>
                        <Flex justify="end" gap={4}>
                            <Button type="primary" onClick={() => openDecision()}>
                                <BookPlus />
                                Thêm mới
                            </Button>
                        </Flex>
                    </Col>
                </Row>
                <Table
                    rowKey="key"
                    id="decision"
                    dataSource={decision}
                    columns={[
                        {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) => index + 1,
                        },
                        {
                            title: 'Ngày ban hành',
                            width: 200,
                            align: 'center',
                            fixed: 'left',
                            render: (record) =>
                                record ? dayjs(record.issueDate).format('DD/MM/YYYY') : '',
                        },
                        {
                            title: 'Loại quyết định',
                            dataIndex: 'type',
                            align: 'center',
                            width: 150,
                        },
                        {
                            title: 'Thao tác',
                            width: 100,
                            align: 'center',
                            fixed: 'right',
                            render: (_, record) => {
                                if (record?.id) {
                                    return (
                                        <Row className="justify-center gap-2">
                                            <EditIcon
                                                // onClick={() =>
                                                //     openRankingCondition({
                                                //         rankingId: id,
                                                //         rankingConditionId: record?.id,
                                                //     })
                                                // }
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                            <DeleteIcon
                                            // popConfirm={{
                                            //     onConfirm: () =>
                                            //         handleDeleteRankingCondition(record?.id),
                                            // }}
                                            />
                                        </Row>
                                    )
                                }
                                return ''
                            },
                        },
                    ]}
                />
            </Col>
            <Col span={24}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, margin: 12 }}>
                    HỘI ĐỒNG ĐÁNH GIÁ
                </div>
                <Row gutter={[0, 16]} align="top" justify="space-between" className="w-full">
                    <Col span={12}>{/*  */}</Col>
                    <Col span={4}>
                        <Flex justify="end" gap={4}>
                            <Button type="primary">
                                <BookPlus />
                                Thêm mới
                            </Button>
                        </Flex>
                    </Col>
                </Row>
                <TableCollapse
                    rowKey="key"
                    id="graduation-criteria"
                    headerTitleKey="thesisId"
                    defaultExpandAll
                    data={council}
                    childrenFieldName="members"
                    columns={[
                        {
                            title: 'Tên chuyên gia',
                            width: 200,
                            fixed: 'left',
                            render: (record) => record.expert?.lecturer?.userProfile.fullname,
                        },
                        {
                            title: 'Vai trò',
                            dataIndex: 'role',
                            align: 'center',
                            width: 150,
                        },
                        {
                            title: 'Thao tác',
                            width: 100,
                            align: 'center',
                            fixed: 'right',
                            render: (_, record) => {
                                if (record?.id) {
                                    return (
                                        <Row className="justify-center gap-2">
                                            <EditIcon
                                                // onClick={() =>
                                                //     openRankDowngradeCondition({
                                                //         downgradeRuleId: id || '',
                                                //         downgradeConditionId: record?.id,
                                                //     })
                                                // }
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                            <DeleteIcon
                                            // popConfirm={{
                                            //     onConfirm: () =>
                                            //         handleDeleteRankDowngradeCondition(
                                            //             record?.id
                                            //         ),
                                            // }}
                                            />
                                        </Row>
                                    )
                                }
                                return ''
                            },
                        },
                    ]}
                    headerRight={({ id }) => (
                        <div className="flex gap-2.5 w-[85px] items-center">
                            <CreateIcon
                                // onClick={() => {
                                //     openRankDowngradeCondition({
                                //         downgradeRuleId: id,
                                //         downgradeConditionId: '',
                                //     })
                                // }}
                                title="Thêm mới thành viên"
                            />
                            <DeleteIcon
                            // popConfirm={{
                            //     onConfirm: () => handleDeleteGraduationRankDowngradeRule(id),
                            // }}
                            />
                        </div>
                    )}
                />
            </Col>
        </div>
    )
}

ThesisProjectDetail.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
