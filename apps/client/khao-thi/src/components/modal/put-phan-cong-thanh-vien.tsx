import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import type { PutPhanCongThanhVienModalProps } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/nocouncil-member"
import { useStore } from "@tanstack/react-store"
import { $Enums } from "@workspace/db/client"
import {
  useFindManyEvaluationCouncilMember,
  useUpsertEvaluationCriterion,
} from "@workspace/db/hooks"
import { Col, Form, message, Tree } from "antd"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type CriteriaAssignmentModalFormType = {
  lecturerId: string
  deadline: Date
}

export default function PutPhanCongThanhVienModal() {
  const [form] = Form.useForm<CriteriaAssignmentModalFormType>()
  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
  const { showSpinner, hideSpinner } = useSpinner()

  const { isOpen, onClose, input } = useDisclosure<PutPhanCongThanhVienModalProps>({
    tag: "PutPhanCongThanhVienModal",
    onClose: form.resetFields,
  })

  const { data: lecturers = [] } = useFindManyEvaluationCouncilMember({
    where: {
      evaluationCouncil: {
        periodId: selectedEvaluationPeriodId,
      },
      role: {
        in: [$Enums.EvaluationMemberRole.NONCOUNCIL_MEMBERS],
      },
    },
    include: {
      lecturer: {
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
          organization: true,
        },
      },
    },
  })

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

  const handleFinish = async (values: CriteriaAssignmentModalFormType) => {
    try {
      if (!values) return
      showSpinner()
      if (input?.selectedCriteriaIds) {
        const deadline = values.deadline ? dayjs(values.deadline).toISOString() : undefined

        await Promise.all(
          input.selectedCriteriaIds.map((criterionId) =>
            upsertEvaluationCriterion({
              where: {
                criterionPeriodId: criterionId,
              },
              create: {
                criterionPeriodId: criterionId,
                deadlineReviewExternal: deadline,
                lecturerReview: { connect: [{ id: values.lecturerId }] },
              },
              update: {
                deadlineReviewExternal: deadline,
                lecturerReview: { set: [{ id: values.lecturerId }] },
              },
            })
          )
        )

        message.success("Phân công thành viên phản biện hàng loạt thành công")
        if (input?.refetch) {
          input.refetch()
        }
        if (input?.clearSelected) {
          input.clearSelected()
        }
        onClose()
      }
    } catch (error) {
      message.error("Phân công thành viên phản biện hàng loạt thất bại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal
      title="Phân công thành viên phản biện hàng loạt"
      form={form}
      open={isOpen}
      onCancel={onClose}
      onFinish={handleFinish}
      className="w-[40vw]"
    >
      <Col span={24}>
        <FormItem label="Chọn thành viên" form={form} name="lecturerId" required>
          <Select
            placeholder="Chọn thành viên"
            options={lecturers.map((i) => {
              const academicRank = i.lecturer?.userProfile?.academicRankType?.sTen || ""
              const degreeRank = i.lecturer?.userProfile?.academicDegreeType?.sTen || ""
              const fullName = i?.lecturer?.userProfile?.fullname
                ? i?.lecturer?.userProfile?.fullname
                : `${i?.lecturer?.userProfile?.firstName} ${i?.lecturer?.userProfile?.lastName}`
              const academicTitle = [academicRank, degreeRank].filter(Boolean).join(".")

              return {
                value: i?.lecturerId,
                label: `${academicTitle ? `${academicTitle} ` : ""}${fullName}-${i?.lecturer?.organization?.sTen}`,
              }
            })}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Hạn hoàn thành" form={form} name="deadline" required>
          <DatePicker
            className="w-full"
            format={"DD/MM/YYYY"}
            disabledDate={(current) => current?.isBefore(dayjs(), "day")}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <h3>Các tiêu chí đã chọn:</h3>
        <Tree treeData={treeData} selectable={false} />
      </Col>
    </PutFormModal>
  )
}
