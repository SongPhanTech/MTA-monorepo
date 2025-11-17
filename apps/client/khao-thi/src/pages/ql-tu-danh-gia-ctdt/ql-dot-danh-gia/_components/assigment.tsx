import DatePicker from '@components/commons/date-picker'
import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import EditIcon from '@components/icons/edit'
import UserPlusIcon from '@components/icons/phan-cong-giang-vien'
import useSpinner from '@hooks/spinner'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import type { Prisma } from '@workspace/db/client'
import { useFindManyLecturer, useFindUniqueEvaluationPeriod } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { Button, Col, Flex, Form, message, Row } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type EvaluationAssignmentFormType = {
    list: Record<string, { lecturerId: string; deadline: Date }>
}

type StandardData = Prisma.StandardPeriodGetPayload<{
    include: {
        criteria: {
            include: {
                analysisCriterions: true
            }
        }
    }
}> & {
    key: string
    displayName: string
}

export type PutPhanCongHangLoatModalProps = {
    selectedCriteriaIds?: string[]
    tableData?: StandardData[]
    refetch?: () => void
}

export default function AssigmentOfAssessmentTab() {
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
    const [form] = Form.useForm<EvaluationAssignmentFormType>()

    const { onOpen } = useDisclosure<{
        criterionPeriodId?: string
        refetch?: () => void
    }>({
        tag: 'CriteriaAssignmentModal',
    })

    const { onOpen: openPhanCongHangLoat } = useDisclosure<PutPhanCongHangLoatModalProps>({
        tag: 'PutPhanCongHangLoatModal',
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

    const { data, isLoading, refetch } = useFindUniqueEvaluationPeriod(
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

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        const allKeys = new Set<string>(newSelectedRowKeys as string[])
        const previousKeys = new Set<string>(selectedRowKeys)

        const criteriaByStandard = new Map<string, string[]>()
        const standardIds = new Set<string>()

        tableData.forEach((standard) => {
            standardIds.add(standard.id)
            const criteriaIds = standard.criteria?.map((c) => c.id) || []
            criteriaByStandard.set(standard.id, criteriaIds)
        })

        const addedKeys = Array.from(allKeys).filter((k) => !previousKeys.has(k))
        const removedKeys = Array.from(previousKeys).filter((k) => !allKeys.has(k))

        addedKeys.forEach((key) => {
            const keyStr = String(key)

            if (standardIds.has(keyStr)) {
                const childrenIds = criteriaByStandard.get(keyStr) || []
                childrenIds.forEach((childId) => {
                    allKeys.add(childId)
                })
            }
        })

        removedKeys.forEach((key) => {
            const keyStr = String(key)

            if (standardIds.has(keyStr)) {
                const childrenIds = criteriaByStandard.get(keyStr) || []
                childrenIds.forEach((childId) => {
                    allKeys.delete(childId)
                })
            } else {
                for (const [standardId, criteriaIds] of criteriaByStandard.entries()) {
                    if (criteriaIds.includes(keyStr)) {
                        allKeys.delete(standardId)
                        break
                    }
                }
            }
        })

        criteriaByStandard.forEach((criteriaIds, standardId) => {
            const allChildrenSelected =
                criteriaIds.length > 0 && criteriaIds.every((childId) => allKeys.has(childId))

            if (allChildrenSelected) {
                allKeys.add(standardId)
            } else {
                allKeys.delete(standardId)
            }
        })

        setSelectedRowKeys(Array.from(allKeys))
    }

    const getSelectedCriteria = () => {
        const standardIds = new Set(tableData.map((s) => s.id))
        return selectedRowKeys.filter((key) => !standardIds.has(key))
    }

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
    }, [data, form])

    const handleSave = async () => {
        try {
            await form.validateFields()

            showSpinner()

            const formData = form.getFieldsValue()
            const listData = Object.entries(formData.list || {})
                .filter(([_, value]) => value?.lecturerId && value?.deadline)
                .map(([key, value]) => {
                    return {
                        id: key,
                        lecturerId: value.lecturerId,
                        deadline: value.deadline ? dayjs(value.deadline).toISOString() : undefined,
                    }
                })

            const operations: any[] = listData.flatMap((item) => [
                {
                    model: 'AnalysisCriterion',
                    operation: 'upsert',
                    data: {
                        where: {
                            criterionPeriodId: item.id,
                        },
                        create: {
                            criterionPeriodId: item.id,
                            lecturerId: item.lecturerId,
                            deadline: item.deadline,
                        },
                        update: {
                            lecturerId: item.lecturerId,
                            deadline: item.deadline,
                        },
                    },
                },
                {
                    model: 'EvaluationCriterion',
                    operation: 'upsert',
                    data: {
                        where: {
                            criterionPeriodId: item.id,
                        },
                        create: {
                            criterionPeriodId: item.id,
                            lecturerId: item.lecturerId,
                            deadline: item.deadline,
                        },
                        update: {
                            lecturerId: item.lecturerId,
                            deadline: item.deadline,
                        },
                    },
                },
            ])

            const res = await sqlTransaction(operations)

            if (res.status !== 200) {
                message.error('Đã có lỗi xảy ra, vui lòng thử lại')
                return
            }

            message.success('Lưu phân công giảng viên đánh giá thành công')
        } catch (error: any) {
            console.error('Error saving assignment:', error)
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
                <Flex justify="flex-end" gap={8} className="pb-2">
                    <Button
                        type="primary"
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-0 shadow-sm disabled:from-purple-200 disabled:to-purple-300 disabled:cursor-not-allowed disabled:text-purple-700 h-8 px-4"
                        disabled={getSelectedCriteria().length === 0}
                        onClick={() => {
                            openPhanCongHangLoat({
                                selectedCriteriaIds: getSelectedCriteria(),
                                tableData: tableData,
                                refetch: refetch,
                            })
                        }}
                    >
                        Phân công hàng loạt
                    </Button>
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
                        rowSelection={{
                            type: 'checkbox',
                            selectedRowKeys,
                            onChange: onSelectChange,
                        }}
                        onRow={(record) => ({
                            onClick: (e) => {
                                const target = e.target as HTMLElement
                                if (
                                    target.closest('.ant-picker') ||
                                    target.closest('.ant-picker-dropdown') ||
                                    target.closest('.ant-picker-panel')
                                ) {
                                    return
                                }

                                const currentKeys = [...selectedRowKeys]
                                const recordKey = record.id

                                const isParent = tableData.some(
                                    (standard) => standard.id === recordKey
                                )

                                if (isParent) {
                                    const standard = tableData.find((s) => s.id === recordKey)
                                    const childrenIds = standard?.criteria?.map((c) => c.id) || []
                                    const allChildrenSelected = childrenIds.every((id) =>
                                        currentKeys.includes(id)
                                    )

                                    if (allChildrenSelected) {
                                        const newKeys = currentKeys.filter(
                                            (key) => key !== recordKey && !childrenIds.includes(key)
                                        )
                                        onSelectChange(newKeys)
                                    } else {
                                        const newKeys = [
                                            ...currentKeys.filter((key) => key !== recordKey),
                                            recordKey,
                                            ...childrenIds,
                                        ]
                                        onSelectChange([...new Set(newKeys)])
                                    }
                                } else {
                                    if (currentKeys.includes(recordKey)) {
                                        onSelectChange(
                                            currentKeys.filter((key) => key !== recordKey)
                                        )
                                    } else {
                                        onSelectChange([...currentKeys, recordKey])
                                    }
                                }
                            },
                        })}
                        loading={isLoading}
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
                                                onClick={(e) => e.stopPropagation()}
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
                                                onClick={(e) => e.stopPropagation()}
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
                                                        refetch: refetch,
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
                                                        refetch: refetch,
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
