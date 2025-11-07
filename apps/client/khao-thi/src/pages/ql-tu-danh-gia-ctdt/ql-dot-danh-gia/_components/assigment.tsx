import DatePicker from '@components/commons/date-picker'
import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import EditIcon from '@components/icons/edit'
import UserPlusIcon from '@components/icons/phan-cong-giang-vien'
import useSpinner from '@hooks/spinner'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { useFindManyLecturer, useFindUniqueEvaluationPeriod } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { Button, Col, Flex, Form, message, Row } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type EvaluationAssignmentFormType = {
    list: Record<string, { lecturerId: string; deadline: Date }>
}

export default function AssigmentOfAssessmentTab() {
    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
    const [form] = Form.useForm<EvaluationAssignmentFormType>()

    const { onOpen } = useDisclosure<{
        criterionPeriodId?: string
    }>({
        tag: 'CriteriaAssignmentModal',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: lecturers = [] } = useFindManyLecturer({
        where: {
            deletedAt: null,
        },
        include: {
            userProfile: {
                include: {
                    academicDegreeType: {
                        select: {
                            sTen: true,
                        },
                    },
                    academicRankType: {
                        select: {
                            sTen: true,
                        },
                    },
                },
            },
        },
    })

    const { data } = useFindUniqueEvaluationPeriod(
        {
            where: { id: selectedEvaluationPeriodId },
            include: {
                standards: {
                    include: {
                        criteria: {
                            include: {
                                analysisCriterions: true,
                            },
                            orderBy: {
                                order: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        },
        {
            enabled: !!selectedEvaluationPeriodId,
        }
    )

    const tableData = useMemo(() => {
        if (!data?.standards) return []

        return data.standards.map((standard) => ({
            ...standard,
            key: standard.id,
            displayName: `Tiêu chuẩn ${standard.order}: ${standard.name}`,
        }))
    }, [data])

    useEffect(() => {
        if (!data?.standards) return

        const formData: Record<string, { lecturerId: string; deadline: any }> = {}

        data.standards.forEach((standard) => {
            standard.criteria.forEach((criterion) => {
                if (criterion.analysisCriterions) {
                    const { lecturerId, deadline } = criterion.analysisCriterions
                    if (lecturerId || deadline) {
                        formData[criterion.id] = {
                            lecturerId: lecturerId || '',
                            deadline: deadline ? dayjs(deadline) : undefined,
                        }
                    }
                }
            })
        })

        form.setFieldsValue({ list: formData })
    }, [data?.standards, form])

    const handleSave = async () => {
        try {
            showSpinner()

            const formData = form.getFieldsValue()
            const listData = Object.entries(formData.list)
                .filter(([_, value]) => value.lecturerId || value.deadline)
                .map(([key, value]) => {
                    return {
                        id: key,
                        ...value,
                    }
                })

            const criterionPeriodIds = listData.map((i) => i.id)

            const res = await sqlTransaction([
                {
                    model: 'AnalysisCriterion',
                    operation: 'deleteMany',
                    data: {
                        where: {
                            criterionPeriodId: {
                                in: criterionPeriodIds,
                            },
                        },
                    },
                },
                {
                    model: 'EvaluationCriterion',
                    operation: 'deleteMany',
                    data: {
                        where: {
                            criterionPeriodId: {
                                in: criterionPeriodIds,
                            },
                        },
                    },
                },
                {
                    model: 'AnalysisCriterion',
                    operation: 'createMany',
                    data: {
                        data: listData.map((i) => ({
                            criterionPeriodId: i.id,
                            lecturerId: i.lecturerId,
                            deadline: i.deadline,
                        })),
                    },
                },
                {
                    model: 'EvaluationCriterion',
                    operation: 'createMany',
                    data: {
                        data: listData.map((i) => ({
                            criterionPeriodId: i.id,
                            lecturerId: i.lecturerId,
                            deadline: i.deadline,
                        })),
                    },
                },
            ])

            if (res.status !== 200) {
                message.error('Đã có lỗi xảy ra, vui lòng thử lại')
                return
            }

            message.success('Lưu phân công giảng viên đánh giá thành công')

            console.log(listData)
        } catch (error: any) {
            message.error(error.message || 'Đã có lỗi xảy ra')
        } finally {
            hideSpinner()
        }
    }

    return (
        <Row gutter={0}>
            <Col span={24}>
                <h1 className="text-xl font-bold text-gray-800 mb-2">
                    Phân công giảng viên đánh giá
                </h1>
                <p className="text-gray-600 text-base">Đợt đánh giá: {data?.name}</p>
                <Flex justify="flex-end" className="pb-2">
                    <Button type="primary" onClick={handleSave}>
                        Lưu
                    </Button>
                </Flex>
            </Col>

            <Col span={24}>
                <Form form={form}>
                    <TableCollapse
                        rowKey="id"
                        id="evaluation-asignment"
                        defaultExpandAll
                        headerTitleKey="displayName"
                        childrenFieldName="criteria"
                        data={tableData}
                        pagination={false}
                        scroll={{ y: 'calc(100vh - 320px)', x: 'max-content' }}
                        className="w-full"
                        columns={[
                            {
                                title: 'Tiêu chí',
                                width: 700,
                                render: (_, record) => {
                                    return `Tiêu chí ${record.order}: ${record.name}`
                                },
                            },
                            {
                                title: 'Giảng viên phân công',
                                width: 200,
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            name={['list', record.id, 'lecturerId']}
                                            className="mb-0"
                                        >
                                            <Select
                                                placeholder="Chọn giáo viên"
                                                options={lecturers.map((i) => {
                                                    const academicRank =
                                                        i.userProfile?.academicRankType?.sTen || ''
                                                    const degreeRank =
                                                        i.userProfile?.academicDegreeType?.sTen ||
                                                        ''

                                                    const fullName = i?.userProfile?.fullname
                                                        ? i?.userProfile?.fullname
                                                        : `${i?.userProfile?.firstName} ${i?.userProfile?.lastName}`

                                                    const academicTitle = [academicRank, degreeRank]
                                                        .filter(Boolean)
                                                        .join('.')

                                                    return {
                                                        value: i?.id,
                                                        label: `${i.code} - ${academicTitle ? `${academicTitle} ` : ''}${fullName}`,
                                                    }
                                                })}
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Hạn hoàn thành',
                                width: 170,
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            name={['list', record.id, 'deadline']}
                                            className="mb-0"
                                        >
                                            <DatePicker
                                                className="w-full"
                                                format={'DD/MM/YYYY'}
                                                disabledDate={(current) =>
                                                    current?.isBefore(dayjs(), 'day')
                                                }
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 80,
                                render: (_, record) => {
                                    return (
                                        <Flex justify="center" align="center" gap={8}>
                                            <UserPlusIcon
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    e.preventDefault()
                                                    onOpen({
                                                        criterionPeriodId: record.id,
                                                    })
                                                }}
                                            />
                                            <EditIcon
                                                className="text-blue-700 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    e.preventDefault()
                                                    onOpen({
                                                        criterionPeriodId: record.id,
                                                    })
                                                }}
                                            />
                                        </Flex>
                                    )
                                },
                            },
                        ]}
                    />
                </Form>
            </Col>
        </Row>
    )
}
