import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { PutPhanCongHangLoatCrossModalInput } from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/cross-review-assignment"

import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import {
  useFindManyEvaluationCouncilMember,
  useUpsertEvaluationCriterion,
} from "@workspace/db/hooks"
import { Col, Form, message, Tree } from "antd"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type CrossReviewAssignmentModalFormType = {
  reviewerId: string
  deadlineReview: Date
}

export default function PutPhanCongHangLoatCrossModal() {
  const [form] = Form.useForm<CrossReviewAssignmentModalFormType>()

  const { isOpen, onClose, input } = useDisclosure<PutPhanCongHangLoatCrossModalInput>({
    tag: "PutPhanCongHangLoatCrossModal",
  })

  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
  const { hideSpinner, showSpinner } = useSpinner()

  const { data: lecturers = [] } = useFindManyEvaluationCouncilMember(
    {
      where: {
        deletedAt: null,
        evaluationCouncil: {
          periodId: selectedEvaluationPeriodId || "",
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
    }
  )

  const treeData = useMemo(() => {
    if (!input?.tableData || !input?.selectedCriteriaIds) return []

    return input.tableData
      .filter((standard) => {
        const hasCriteria = standard.criteria?.some((criterion) =>
          input.selectedCriteriaIds?.includes(criterion.id)
        )
        return hasCriteria
      })
      .map((standard) => ({
        title: `Tiêu chuẩn ${standard.order}: ${standard.name}`,
        key: standard.id,
        children: standard.criteria
          ?.filter((criterion) => input.selectedCriteriaIds?.includes(criterion.id))
          .map((criterion) => ({
            title: `Tiêu chí ${standard.order}.${criterion.order}: ${criterion.name}`,
            key: criterion.id,
          })),
      }))
  }, [input?.tableData, input?.selectedCriteriaIds])

  const { mutateAsync: upsertEvaluationCriterion } = useUpsertEvaluationCriterion()

  const handleFinish = async (values: CrossReviewAssignmentModalFormType) => {
    try {
      if (!values) return
      showSpinner()
      if (input?.selectedCriteriaIds) {
        await Promise.all(
          input.selectedCriteriaIds.map((criterionId) =>
            upsertEvaluationCriterion({
              where: {
                criterionPeriodId: criterionId,
              },
              create: {
                criterionPeriodId: criterionId,
                reviewerId: values.reviewerId,
                deadlineReview: values.deadlineReview,
              },
              update: {
                reviewerId: values.reviewerId,
                deadlineReview: values.deadlineReview,
              },
            })
          )
        )

        message.success("Phân công đánh giá thành công")

        if (input.refetch) {
          input.refetch()
        }

        if (input.clearSelected) {
          input.clearSelected()
        }

        onClose()
      }
    } catch (error) {
      message.error("Đã có lỗi xảy ra, vui lòng thử lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal
      form={form}
      title="Phân công đánh giá chéo hàng loạt"
      open={isOpen}
      onCancel={onClose}
      onFinish={handleFinish}
      className="w-[40vw]"
    >
      <Col span={24}>
        <FormItem form={form} label="Chọn giảng viên phản biện" name="reviewerId" required>
          <Select
            placeholder="Chọn người phản biện"
            className="w-full"
            options={lecturers.map((i) => {
              const academicRank = i.lecturer.userProfile?.academicRankType?.sTen || ""
              const degreeRank = i.lecturer.userProfile?.academicDegreeType?.sTen || ""

              const fullName = i?.lecturer.userProfile?.fullname
                ? i?.lecturer.userProfile?.fullname
                : `${i?.lecturer.userProfile?.firstName} ${i?.lecturer.userProfile?.lastName}`

              const academicTitle = [academicRank, degreeRank].filter(Boolean).join(".")

              return {
                value: i?.id,
                label: `${academicTitle ? `${academicTitle} ` : ""}${fullName}`,
              }
            })}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} label="Hạn phản biện" name="deadlineReview">
          <DatePicker
            className="w-full"
            format="DD/MM/YYYY"
            disabledDate={(current) => current?.isBefore(dayjs(), "day")}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <h3>Các tiêu chí đã chọn</h3>
        <Tree treeData={treeData} selectable={false} />
      </Col>
    </PutFormModal>
  )
}
