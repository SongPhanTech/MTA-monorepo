import DatePicker from "@components/commons/date-picker"
import Select from "@components/commons/select"
import TableIndexCollapse from "@components/commons/table-collapse-index"
import useSpinner from "@hooks/spinner"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import { $Enums, type Prisma } from "@workspace/db/client"
import {
  useFindManyEvaluationCouncilMember,
  useFindUniqueEvaluationPeriod,
  useUpsertEvaluationCriterion,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, Form, message, Row } from "antd"
import dayjs from "dayjs"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type CrossReviewFormType = {
  list: Record<string, { reviewerId: string; deadlineReview: Date }>
}

type StandardData = Prisma.StandardPeriodGetPayload<{
  include: {
    criteria: {
      include: {
        evaluationCriterion: {
          include: {
            lecturer: {
              include: {
                userProfile: true
              }
            }
          }
        }
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

export type PutPhanCongHangLoatCrossModalInput = {
  selectedCriteriaIds?: string[]
  tableData?: StandardData[]
  refetch?: () => void
  clearSelected?: () => void
}

export default function CrossReviewAssignment() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
  const [form] = Form.useForm<CrossReviewFormType>()
  const listForm = Form.useWatch("list", form) || {}
  const { showSpinner, hideSpinner } = useSpinner()
  const { can } = useAbility()

  const canApprove = can(
    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
    "DUYET"
  )

  const { onOpen } = useDisclosure<PutPhanCongHangLoatCrossModalInput>({
    tag: "PutPhanCongHangLoatCrossModal",
  })

  const { data: lecturers = [] } = useFindManyEvaluationCouncilMember(
    {
      where: {
        deletedAt: null,
        evaluationCouncil: {
          periodId: selectedEvaluationPeriodId,
        },
      },
      include: {
        lecturer: {
          include: {
            userProfile: {
              select: {
                fullname: true,
                firstName: true,
                lastName: true,
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
        },
      },
    },
    {
      enabled: !!selectedEvaluationPeriodId,
      refetchOnWindowFocus: false,
    }
  )

  const { data, isLoading, refetch } = useFindUniqueEvaluationPeriod(
    {
      where: { id: selectedEvaluationPeriodId },
      include: {
        standards: {
          include: {
            criteria: {
              include: {
                evaluationCriterion: {
                  include: {
                    lecturer: {
                      include: {
                        userProfile: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                order: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
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
        const filteredCriteria = standard.criteria.filter(
          (criterion) => criterion.evaluationCriterion?.status !== $Enums.EvaluationStatus.LOCK
        )

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

    const formData: Record<string, { reviewerId: string; deadlineReview: any }> = {}

    data.standards.forEach((standard) => {
      standard.criteria.forEach((criterion) => {
        if (
          criterion.evaluationCriterion &&
          criterion.evaluationCriterion.status !== $Enums.EvaluationStatus.LOCK
        ) {
          const { reviewerId, deadlineReview } = criterion.evaluationCriterion
          if (reviewerId || deadlineReview) {
            formData[criterion.id] = {
              reviewerId: reviewerId || "",
              deadlineReview: deadlineReview ? dayjs(deadlineReview) : undefined,
            }
          }
        }
      })
    })

    form.setFieldsValue({ list: formData })
  }, [data, form])

  const { mutateAsync: upsertEvaluationCriterion } = useUpsertEvaluationCriterion()

  const handleSave = async () => {
    try {
      await form.validateFields()

      showSpinner()

      const submitData = Object.entries(listForm)
        .map(([criterionId, value]) => ({
          criterionPeriodId: criterionId,
          reviewerId: value.reviewerId,
          deadlineReview: value.deadlineReview
            ? dayjs(value.deadlineReview).toISOString()
            : undefined,
        }))
        .filter((item) => item.reviewerId || item.deadlineReview)

      if (submitData.length === 0) {
        message.error("Vui lòng nhập ít nhất một phân công phản biện")
        hideSpinner()
        return
      }

      await Promise.all(
        submitData.map((item) =>
          upsertEvaluationCriterion({
            where: {
              criterionPeriodId: item.criterionPeriodId,
            },
            create: {
              criterionPeriodId: item.criterionPeriodId,
              reviewerId: item.reviewerId,
              deadlineReview: item.deadlineReview,
            },
            update: {
              reviewerId: item.reviewerId,
              deadlineReview: item.deadlineReview,
            },
          })
        )
      )

      message.success("Lưu phân công phản biện chéo thành công")
      refetch()
    } catch (error: any) {
      message.error(error.message || "Đã có lỗi xảy ra")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Row gutter={0}>
      <Col span={24}>
        {canApprove && (
          <Flex justify="flex-end" gap={8} className="pb-2">
            <Button
              type="primary"
              size="small"
              disabled={getSelectedCriteria().length === 0}
              onClick={() =>
                onOpen({
                  refetch: refetch,
                  selectedCriteriaIds: getSelectedCriteria(),
                  tableData: tableData,
                  clearSelected: () => setSelectedRowKeys([]),
                })
              }
            >
              Phân công hàng loạt
            </Button>
            <Button type="primary" size="small" onClick={handleSave}>
              Lưu phản biện
            </Button>
          </Flex>
        )}
      </Col>

      <Col span={24}>
        <Form form={form}>
          <TableIndexCollapse
            rowKey="id"
            id="cross-review-assignment"
            defaultExpandAll
            headerTitleKey="displayName"
            childrenFieldName="criteria"
            isTitle={true}
            rowSelection={
              canApprove
                ? {
                    type: "checkbox",
                    selectedRowKeys,
                    onChange: onSelectChange,
                  }
                : undefined
            }
            expandable={{
              expandRowByClick: false,
            }}
            onRow={(record) => ({
              onClick: (e) => {
                const target = e.target as HTMLElement
                if (
                  target.closest(".ant-picker") ||
                  target.closest(".ant-picker-dropdown") ||
                  target.closest(".ant-picker-panel")
                ) {
                  return
                }

                const currentKeys = [...selectedRowKeys]
                const recordKey = record.id

                const isParent = tableData.some((standard) => standard.id === recordKey)

                if (isParent) {
                  const standard = tableData.find((s) => s.id === recordKey)
                  const childrenIds = standard?.criteria?.map((c) => c.id) || []
                  const allChildrenSelected = childrenIds.every((id) => currentKeys.includes(id))

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
                    onSelectChange(currentKeys.filter((key) => key !== recordKey))
                  } else {
                    onSelectChange([...currentKeys, recordKey])
                  }
                }
              },
            })}
            loading={isLoading}
            data={tableData}
            pagination={false}
            scroll={{ y: "calc(100vh - 240px)", x: "max-content" }}
            className="w-full"
            columns={[
              {
                title: "Tiêu chí",
                width: 200,
                render: (_, record) => {
                  return `Tiêu chí ${record.order}: ${record.name}`
                },
              },
              {
                title: "Người viết phiếu đánh giá",
                width: 130,
                render: (_, record) => {
                  return record.evaluationCriterion?.lecturer?.userProfile.fullname
                },
              },
              {
                title: "Người phản biện",
                width: 220,
                render: (_, record) => {
                  return (
                    <Form.Item name={["list", record.id, "reviewerId"]} className="mb-0">
                      <Select
                        placeholder="Chọn người phản biện"
                        className="w-full"
                        onClick={(e) => e.stopPropagation()}
                        disabled={!canApprove}
                        options={lecturers
                          .filter((i) => {
                            const writerLecturerId = record.evaluationCriterion?.lecturer?.id
                            return i.lecturer.id !== writerLecturerId
                          })
                          .map((i) => {
                            const academicRank =
                              i.lecturer.userProfile?.academicRankType?.sTen || ""
                            const degreeRank =
                              i.lecturer.userProfile?.academicDegreeType?.sTen || ""

                            const fullName = i?.lecturer.userProfile?.fullname
                              ? i?.lecturer.userProfile?.fullname
                              : `${i?.lecturer.userProfile?.firstName} ${i?.lecturer.userProfile?.lastName}`

                            const academicTitle = [academicRank, degreeRank]
                              .filter(Boolean)
                              .join(".")

                            return {
                              value: i?.id,
                              label: `${academicTitle ? `${academicTitle} ` : ""}${fullName}`,
                            }
                          })}
                      />
                    </Form.Item>
                  )
                },
              },
              {
                title: "Hạn phản biện",
                width: 90,
                render: (_, record) => {
                  return (
                    <Form.Item name={["list", record.id, "deadlineReview"]} className="mb-0">
                      <DatePicker
                        className="w-full"
                        format={"DD/MM/YYYY"}
                        onClick={(e) => e.stopPropagation()}
                        disabled={!canApprove}
                        disabledDate={(current) => current?.isBefore(dayjs(), "day")}
                      />
                    </Form.Item>
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
