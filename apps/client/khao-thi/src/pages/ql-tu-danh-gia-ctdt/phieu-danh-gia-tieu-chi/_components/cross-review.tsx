import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import EditIcon from '@components/icons/edit'
import UserPlusIcon from '@components/icons/phan-cong-giang-vien'
import useSpinner from '@hooks/spinner'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import type { Prisma } from '@workspace/db/client'
import { useFindManyLecturer, useFindUniqueEvaluationPeriod } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Button, Col, Flex, Form, message, Row } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

type CrossReviewFormType = {
    list: Record<string, { reviewerId: string; deadline: Date }>
}

type StandardData = Prisma.StandardPeriodGetPayload<{
    include: {
        criteria: {
            include: {
                evaluationCriterion: true
            }
        }
    }
}> & {
    key: string
    displayName: string
    criteria?: Array<
        Prisma.CriterionPeriodGetPayload<{
            include: {
                evaluationCriterion: true
            }
        }>
    >
}

export default function CrossReview() {
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
    const [form] = Form.useForm<CrossReviewFormType>()
    const { can } = useAbility()
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
                                evaluationCriterion: true,
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

        return data.standards
            .map((standard) => {
                // Lọc chỉ các tiêu chí có evaluationCriterion.status === SUBMITTED
                const filteredCriteria = standard.criteria.filter(
                    (criterion) => criterion.evaluationCriterion?.status === 'SUBMITTED'
                )

                // Chỉ trả về tiêu chuẩn nếu có ít nhất 1 tiêu chí SUBMITTED
                if (filteredCriteria.length === 0) return null

                return {
                    ...standard,
                    criteria: filteredCriteria,
                    key: standard.id,
                    displayName: `Tiêu chuẩn ${standard.order}: ${standard.name}`,
                }
            })
            .filter((item): item is StandardData => item !== null)
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

        const formData: Record<string, { reviewerId: string; deadline: any }> = {}

        data.standards.forEach((standard) => {
            standard.criteria.forEach((criterion) => {
                if (
                    criterion.evaluationCriterion &&
                    criterion.evaluationCriterion.status === 'SUBMITTED'
                ) {
                    const { reviewerId, deadline } = criterion.evaluationCriterion
                    if (reviewerId || deadline) {
                        formData[criterion.id] = {
                            reviewerId: reviewerId || '',
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
            // TODO: Implement save logic here

            message.success('Lưu phân công phản biện chéo thành công')
            refetch()
        } catch (error: any) {
            console.error('Error saving cross review:', error)
            message.error(error.message || 'Đã có lỗi xảy ra')
        } finally {
            hideSpinner()
        }
    }

    return (
        <Row gutter={0}>
            <Col span={24}>
                <h1 className="text-xl font-bold text-gray-800 mb-2">Phân công phản biện chéo</h1>
                <p className="text-gray-600 text-base">Đợt đánh giá: {data?.name}</p>
                <Flex justify="flex-end" gap={8} className="pb-2">
                    <Button
                        type="primary"
                        className="bg-blue-500"
                        disabled={getSelectedCriteria().length === 0}
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
                        id="cross-review-assignment"
                        defaultExpandAll
                        headerTitleKey="displayName"
                        childrenFieldName="criteria"
                        rowSelection={{
                            type: 'checkbox',
                            selectedRowKeys,
                            onChange: onSelectChange,
                        }}
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
                                title: 'Người phản biện',
                                width: 200,
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            name={['list', record.id, 'reviewerId']}
                                            className="mb-0"
                                        >
                                            <Select
                                                placeholder="Chọn người phản biện"
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
                                title: 'Thao tác',
                                width: 80,
                                render: (_, record) => {
                                    return (
                                        <Flex justify="center" align="center" gap={8}>
                                            {can(
                                                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                                                'DUYET'
                                            ) && (
                                                <UserPlusIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                        // TODO: Open modal
                                                    }}
                                                />
                                            )}

                                            {can(
                                                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                                                'SUA'
                                            ) && (
                                                <EditIcon
                                                    className="text-blue-700 cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                        // TODO: Open modal
                                                    }}
                                                />
                                            )}
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
