import DatePicker from "@components/commons/date-picker"
import Select from "@components/commons/select"
import TableIndexCollapse from "@components/commons/table-collapse-index"
import useSpinner from "@hooks/spinner"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import { useSession } from "@workspace/auth/react"
import { $Enums, type Prisma } from "@workspace/db/client"
import {
  useFindFirstEvaluationCouncilMember,
  useFindManyEvaluationCouncilMember,
  useFindUniqueEvaluationPeriod,
  useFindUniqueLecturer,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Button, Col, Flex, Form, message, Row } from "antd"
import dayjs from "dayjs"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

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

export type PutPhanCongThanhVienModalProps = {
  selectedCriteriaIds?: string[]
  tableData?: StandardData[]
  refetch?: () => void
  clearSelected?: () => void
}

export default function NoCounCilMemberTab() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
  const [form] = Form.useForm<EvaluationAssignmentFormType>()

  const { data: me } = useSession()
  const idProfile = me?.sDM_NhanVienId || "fa330b1b-4326-4018-b3d9-3cd79344f660"

  const { onOpen: openPhanCongHangLoat } = useDisclosure<PutPhanCongThanhVienModalProps>({
    tag: "PutPhanCongThanhVienModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: lecturers = [] } = useFindManyEvaluationCouncilMember({
    where: {
      evaluationCouncil: {
        periodId: selectedEvaluationPeriodId,
      },
      role: {
        in: [
          $Enums.EvaluationMemberRole.SPECIALIZED,
          $Enums.EvaluationMemberRole.NONCOUNCIL_MEMBERS,
        ],
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
          organization: true,
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

  const { data: lecturer } = useFindUniqueLecturer(
    {
      where: {
        userProfileId: idProfile,
      },
    },
    {
      enabled: !!idProfile,
    }
  )

  const { data: councilMember } = useFindFirstEvaluationCouncilMember(
    {
      where: {
        lecturerId: lecturer?.id || "",
        evaluationCouncil: {
          periodId: selectedEvaluationPeriodId || "",
        },
      },
      include: {
        evaluationCouncil: true,
      },
    },
    {
      enabled: !!lecturer?.id && !!selectedEvaluationPeriodId,
    }
  )

  const isHeadSecretary = councilMember?.role?.includes($Enums.EvaluationMemberRole.HEAD_SECRETARY)

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
              lecturerId: lecturerId || "",
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
      const formData = form.getFieldsValue()
      const listData = formData.list || {}

      const validAssignments = Object.entries(listData).filter(
        ([_, value]) => value?.lecturerId && value?.deadline
      )

      if (validAssignments.length === 0) {
        message.error("Vui lòng phân công ít nhất một tiêu chí")
        return
      }

      showSpinner()

      const dataSubmit = Object.entries(formData.list || {})
        .filter(([_, value]) => value?.lecturerId && value?.deadline)
        .map(([key, value]) => {
          return {
            id: key,
            lecturerId: value.lecturerId,
            deadline: value.deadline ? dayjs(value.deadline).toISOString() : undefined,
          }
        })

      const operations: any[] = dataSubmit.flatMap((item) => [
        {
          model: "AnalysisCriterion",
          operation: "upsert",
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
          model: "EvaluationCriterion",
          operation: "upsert",
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
          model: "EvaluationPeriod",
          operation: "update",
          data: {
            where: {
              id: selectedEvaluationPeriodId,
            },
            data: {
              status: $Enums.EvaluationPeriodStatus.ANALYSIS_WRITING,
            },
          },
        },
      ])

      const res = await sqlTransaction(operations)

      if (res.status !== 200) {
        message.error("Đã có lỗi xảy ra, vui lòng thử lại")
        return
      }

      message.success("Lưu phân công giảng viên đánh giá thành công")
    } catch (error: any) {
      console.error("Error saving assignment:", error)
      message.error(error.message || "Đã có lỗi xảy ra")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Row gutter={0}>
      {isHeadSecretary && (
        <Col span={24}>
          <Flex justify="flex-end" align="center" gap={8} className="pb-2">
            <Button
              type="primary"
              size="small"
              disabled={getSelectedCriteria().length === 0}
              onClick={() => {
                openPhanCongHangLoat({
                  selectedCriteriaIds: getSelectedCriteria(),
                  tableData: tableData,
                  refetch: refetch,
                  clearSelected: () => setSelectedRowKeys([]),
                })
              }}
            >
              Phân công hàng loạt
            </Button>
            <Button type="primary" onClick={handleSave} size="small">
              Lưu phân công
            </Button>
          </Flex>
        </Col>
      )}

      <Col span={24}>
        <Form form={form}>
          <TableIndexCollapse
            rowKey="id"
            id="evaluation-asignment"
            defaultExpandAll
            isTitle={true}
            headerTitleKey="displayName"
            childrenFieldName="criteria"
            rowSelection={
              isHeadSecretary
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
                width: 300,
                render: (_, record) => record?.name,
              },
              {
                title: "Thành viên ngoài hội đồng",
                width: 150,
                render: (_, record) => {
                  return (
                    <Form.Item name={["list", record.id, "lecturerId"]} className="mb-0">
                      <Select
                        placeholder="Chọn thành viên"
                        disabled={!isHeadSecretary}
                        onClick={(e) => e.stopPropagation()}
                        options={lecturers.map((i) => {
                          const academicRank = i.lecturer?.userProfile?.academicRankType?.sTen || ""
                          const degreeRank = i.lecturer?.userProfile?.academicDegreeType?.sTen || ""
                          const fullName = i?.lecturer?.userProfile?.fullname
                            ? i?.lecturer?.userProfile?.fullname
                            : `${i?.lecturer?.userProfile?.firstName} ${i?.lecturer?.userProfile?.lastName}`

                          const academicTitle = [academicRank, degreeRank].filter(Boolean).join(".")

                          return {
                            value: i?.lecturerId,
                            label: `${academicTitle ? `${academicTitle} ` : ""}${fullName}`,
                          }
                        })}
                      />
                    </Form.Item>
                  )
                },
              },
              {
                title: "Hạn hoàn thành",
                width: 120,
                render: (_, record) => {
                  return (
                    <Form.Item name={["list", record.id, "deadline"]} className="mb-0">
                      <DatePicker
                        className="w-full"
                        format={"DD/MM/YYYY"}
                        disabled={!isHeadSecretary}
                        onClick={(e) => e.stopPropagation()}
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
