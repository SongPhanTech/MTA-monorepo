import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import TreeSelect from "@components/commons/tree-select"
import { EVALUATION_MEMBER_ROLE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import type { EvaluationCouncilMember } from "@workspace/db"
import { $Enums } from "@workspace/db"
import {
  useCreateEvaluationCouncilMember,
  useFindManyDM_DonVi,
  useFindManyEvaluationCouncilMember,
  useFindUniqueEvaluationCouncilMember,
  useUpdateEvaluationCouncilMember,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect, useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { buildOrgProfileTree } from "@/utils/buildOrgProfileTree"
import { whereActiveOrganization } from "@workspace/libs/org-tree"
export type PutEvaluationCouncilMemberType = EvaluationCouncilMember
const PutEvaluationCouncilMember = () => {
  const [form] = Form.useForm<PutEvaluationCouncilMemberType>()

  const { isOpen, onClose, input } = useDisclosure<{
    evaluationCouncilId: string
    evaluationCouncilMemberId?: string
  }>({
    tag: "PutEvaluationCouncilMember",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const roleWatch = Form.useWatch("role", form)

  const isSpecializedRole =
    roleWatch === $Enums.EvaluationMemberRole.HEAD_SPECIALIZED ||
    roleWatch === $Enums.EvaluationMemberRole.SPECIALIZED

  const isHeadSpecialized = roleWatch === $Enums.EvaluationMemberRole.HEAD_SPECIALIZED

  const { data: headSpecializedMembers = [] } = useFindManyEvaluationCouncilMember(
    {
      where: {
        evaluationCouncilId: input?.evaluationCouncilId,
        role: $Enums.EvaluationMemberRole.HEAD_SPECIALIZED,
        deletedAt: null,
      },
      select: { groupName: true },
    },
    { enabled: !!input?.evaluationCouncilId }
  )

  const groupOptions = useMemo(
    () =>
      [...new Set(headSpecializedMembers.map((m) => m.groupName).filter(Boolean))].map((name) => ({
        label: name,
        value: name,
      })),
    [headSpecializedMembers]
  )

  const { mutateAsync: createEvaluationCouncilMember } = useCreateEvaluationCouncilMember()
  const { mutateAsync: updateEvaluationCouncilMember } = useUpdateEvaluationCouncilMember()

  async function onOk(output?: PutEvaluationCouncilMemberType) {
    if (!output || !input) return

    try {
      showSpinner()
      const data = {
        evaluationCouncilId: input.evaluationCouncilId,
        lecturerId: output.lecturerId,
        role: output.role,
        groupName: output.groupName,
      }
      if (input.evaluationCouncilMemberId) {
        await updateEvaluationCouncilMember({
          data,
          where: {
            id: input.evaluationCouncilMemberId,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createEvaluationCouncilMember({
          data: {
            ...data,
          },
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["EvaluationCouncilMember"],
      })
      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const { data: organizations = [] } = useFindManyDM_DonVi({
    where: whereActiveOrganization,
    include: {
      userProfiles: {
        where: {
          lecturer: { is: { active: true, deletedAt: null } },
        },
        select: {
          id: true,
          code: true,
          fullname: true,
          firstName: true,
          lastName: true,
          avatar: true,
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
          lecturer: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })

  const orgLecturerTree = useMemo(
    () => buildOrgProfileTree(organizations, null, true),
    [organizations]
  )

  const { data: initialValue } = useFindUniqueEvaluationCouncilMember(
    {
      where: { id: input?.evaluationCouncilMemberId },
    },
    {
      enabled: !!input?.evaluationCouncilMemberId,
    }
  )

  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({
        ...initialValue,
      })
    }
  }, [initialValue, form.setFieldsValue])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={
        input?.evaluationCouncilMemberId
          ? "Chỉnh sửa hội đồng đánh giá"
          : "Thêm mới hội đồng đánh giá"
      }
      className="w-[600px]"
    >
      <Col span={24}>
        <FormItem form={form} name="role" label="Chức vụ trong hội đồng" required>
          <Select placeholder="Chọn chức vụ trong hội đồng" options={EVALUATION_MEMBER_ROLE} />
        </FormItem>
      </Col>
      {isSpecializedRole && (
        <Col span={24}>
          <FormItem
            form={form}
            name="groupName"
            label="Tên nhóm"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tên nhóm",
              },
            ]}
          >
            {isHeadSpecialized ? (
              <Input placeholder="Nhập tên nhóm chuyên trách" />
            ) : (
              <Select placeholder="Chọn nhóm chuyên trách" options={groupOptions} />
            )}
          </FormItem>
        </Col>
      )}
      <Col span={24}>
        <FormItem
          form={form}
          name="lecturerId"
          label="Giảng viên"
          rules={[
            {
              required: true,
              message: "Vui lòng chọn giáo viên",
            },
          ]}
        >
          <TreeSelect
            treeData={orgLecturerTree}
            showSearch
            placeholder="Chọn giảng viên"
            className="w-full"
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutEvaluationCouncilMember
