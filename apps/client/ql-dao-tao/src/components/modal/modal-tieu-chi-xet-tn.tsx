import PutFormModal from '@components/commons/put-modal'
import type { RankingCondition } from '@workspace/db/client'
import {
    useCreateGraduationRankDowngradeRule,
    useDeleteGraduationRankDowngradeCondition,
    useDeleteGraduationRankDowngradeRule,
    useDeleteManyGraduationRankDowngradeCondition,
    useDeleteRankingCondition,
    useFindManyGraduationRankDowngradeRule,
    useFindManyRankingCondition,
} from '@workspace/db/hooks'
import { Button, Checkbox, Col, Flex, Form, message, Row, Table, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import TableCollapse from '@components/commons/tableCollapse'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { useCriteriaFieldOptions } from '@hooks/criteriaField'
import { useCriteriaOperatorOptions } from '@hooks/criteriaOperator'
import useSpinner from '@hooks/spinner'
import { BookPlus } from 'lucide-react'

export type GraduationCriteria = RankingCondition
dayjs.locale('vi')

const ModalGraduationCriteria = () => {
    const [form] = Form.useForm<GraduationCriteria>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'ModalGraduationCriteria',
        onClose: form.resetFields,
    })
    const { getCriteriaFieldLabel } = useCriteriaFieldOptions()
    const { getCriteriaOperatorLabel } = useCriteriaOperatorOptions()
    const { showSpinner, hideSpinner } = useSpinner()
    const { mutateAsync: deleteRankingCondition } = useDeleteRankingCondition()
    const { mutateAsync: createRankDowngradeRule } = useCreateGraduationRankDowngradeRule()
    const { mutateAsync: deleteGraduationRankDowngradeRule } =
        useDeleteGraduationRankDowngradeRule()
    const { mutateAsync: deleteRankDowngradeCondition } =
        useDeleteGraduationRankDowngradeCondition()
    const { mutateAsync: deleteManyRankDowngradeCondition } =
        useDeleteManyGraduationRankDowngradeCondition()

    const { data: rankingCondition } = useFindManyRankingCondition({
        where: { rankingId: id },
    })

    const { data: graduationRankDowngrade } = useFindManyGraduationRankDowngradeRule({
        where: { initialRankId: id },
        include: {
            conditions: true,
        },
    })

    const graduationRankDowngradeWithIndex = graduationRankDowngrade?.map((item, index) => ({
        ...item,
        name: `Bộ ${index + 1}`,
    }))

    const { onOpen: openRankingCondition } = useDisclosure<{
        rankingId?: string
        rankingConditionId: string
    }>({
        tag: 'PutRankingCondition',
    })

    const { onOpen: openRankDowngradeCondition } = useDisclosure<{
        downgradeRuleId: string
        downgradeConditionId: string
    }>({
        tag: 'PutRankDowngradeCondition',
    })

    async function handleDeleteRankingCondition(id: string) {
        try {
            showSpinner()
            await deleteRankingCondition({
                where: { id },
            })
            message.success('Xóa bản ghi thành công')
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    async function handleDeleteGraduationRankDowngradeRule(id: string) {
        try {
            showSpinner()
            await deleteManyRankDowngradeCondition({
                where: { downgradeRuleId: id },
            })
            await deleteGraduationRankDowngradeRule({
                where: { id },
            })
            message.success('Xóa bản ghi thành công')
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    async function handleDeleteRankDowngradeCondition(id: string) {
        try {
            showSpinner()
            await deleteRankDowngradeCondition({
                where: { id },
            })
            message.success('Xóa bản ghi thành công')
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleOpenRankingCondition = (rankingId: string | undefined) => {
        openRankingCondition({ rankingId, rankingConditionId: '' })
    }

    const handleCreateRankDowngradeRule = async () => {
        try {
            showSpinner()
            await createRankDowngradeRule({
                data: { initialRankId: id || '' },
            })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onClose}
            onCancel={onClose}
            maskClosable={true}
            title="Tiêu chí xét tốt nghiệp"
            className="w-[80vw]"
        >
            <Col span={24}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, margin: 12 }}>
                    ĐIỀU KIỆN ĐẠT XẾP LOẠI
                </div>
                <Row gutter={[0, 16]} align="top" justify="space-between" className="w-full mb-2">
                    <Col span={12}>{/*  */}</Col>
                    <Col span={4}>
                        <Flex justify="end" gap={4}>
                            <Button type="primary" onClick={() => handleOpenRankingCondition(id)}>
                                <BookPlus />
                                Thêm mới
                            </Button>
                        </Flex>
                    </Col>

                    <Table
                        rowKey="key"
                        id="ranking-condition"
                        // scroll={{ y: 500 }}
                        className="w-full"
                        dataSource={rankingCondition}
                        columns={[
                            {
                                title: 'STT',
                                width: 100,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Trường được đánh giá',
                                dataIndex: 'field',
                                width: 200,
                                align: 'center',
                                fixed: 'left',
                                render: (record) => getCriteriaFieldLabel(record),
                            },
                            /* {
                                title: 'Đảo ngược so sánh',
                                dataIndex: 'invert',
                                align: 'center',
                                width: 200,
                                render: (record) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={record} disabled />
                                        </div>
                                    )
                                },
                            }, */
                            {
                                title: 'So sánh',
                                dataIndex: 'operator',
                                align: 'center',
                                width: 150,
                                render: (record) => getCriteriaOperatorLabel(record),
                            },
                            {
                                title: 'Mốc điểm',
                                dataIndex: 'value',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Mô tả',
                                width: 150,
                                align: 'center',
                                dataIndex: 'description',
                                render: (record: string) => {
                                    return (
                                        <Tooltip title={record}>
                                            <div className="line-clamp-2">{record}</div>
                                        </Tooltip>
                                    )
                                },
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
                                                    onClick={() =>
                                                        openRankingCondition({
                                                            rankingId: id,
                                                            rankingConditionId: record?.id,
                                                        })
                                                    }
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteRankingCondition(
                                                                record?.id
                                                            ),
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
                            hideOnSinglePage: true,
                        }}
                    />
                </Row>
            </Col>
            <Col span={24}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, margin: 12 }}>
                    BỘ QUY TẮC HẠ BẬC
                </div>
                <Row gutter={[0, 16]} align="top" justify="space-between" className="w-full">
                    <Col span={12}>{/*  */}</Col>
                    <Col span={4}>
                        <Flex justify="end" gap={4}>
                            <Button type="primary" onClick={() => handleCreateRankDowngradeRule()}>
                                <BookPlus />
                                Thêm mới
                            </Button>
                        </Flex>
                    </Col>
                </Row>
                <TableCollapse
                    rowKey="key"
                    id="graduation-criteria"
                    headerTitleKey="name"
                    defaultExpandAll
                    data={graduationRankDowngradeWithIndex}
                    scroll={{ y: 500 }}
                    childrenFieldName="conditions"
                    columns={[
                        {
                            title: 'Trường được đánh giá',
                            dataIndex: 'field',
                            width: 200,
                            align: 'center',
                            fixed: 'left',
                            render: (record) => getCriteriaFieldLabel(record),
                        },
                        /* {
                            title: 'Đảo ngược so sánh',
                            dataIndex: 'invert',
                            align: 'center',
                            width: 80,
                            render: (record) => {
                                return (
                                    <div className="flex items-center justify-center">
                                        <Checkbox checked={record} disabled />
                                    </div>
                                )
                            },
                        }, */
                        {
                            title: 'So sánh',
                            dataIndex: 'operator',
                            align: 'center',
                            width: 150,
                            render: (record) => getCriteriaOperatorLabel(record),
                        },
                        {
                            title: 'Mốc điểm',
                            dataIndex: 'value',
                            align: 'center',
                            width: 150,
                        },
                        {
                            title: 'Mô tả',
                            width: 150,
                            align: 'center',
                            dataIndex: 'description',
                            render: (record: string) => {
                                return (
                                    <Tooltip title={record}>
                                        <div className="line-clamp-2">{record}</div>
                                    </Tooltip>
                                )
                            },
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
                                                onClick={() =>
                                                    openRankDowngradeCondition({
                                                        downgradeRuleId: id || '',
                                                        downgradeConditionId: record?.id,
                                                    })
                                                }
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () =>
                                                        handleDeleteRankDowngradeCondition(
                                                            record?.id
                                                        ),
                                                }}
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
                                onClick={() => {
                                    openRankDowngradeCondition({
                                        downgradeRuleId: id,
                                        downgradeConditionId: '',
                                    })
                                }}
                                title="Thêm mới tiêu chí"
                            />
                            <DeleteIcon
                                popConfirm={{
                                    onConfirm: () => handleDeleteGraduationRankDowngradeRule(id),
                                }}
                            />
                        </div>
                    )}
                    pagination={{
                        hideOnSinglePage: true,
                    }}
                />
            </Col>
        </PutFormModal>
    )
}

export default ModalGraduationCriteria
