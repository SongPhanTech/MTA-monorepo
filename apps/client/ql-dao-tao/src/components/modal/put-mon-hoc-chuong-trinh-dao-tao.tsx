import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { $Enums, Prisma, type TrainingBlockSubject } from "@workspace/db/client"
import {
  useCreateManyTrainingBlockSubject,
  useFindManyDM_DonVi,
  useFindManySubjectVersion,
  useFindUniqueTrainingBlockOnCurriculumVersion,
  useFindUniqueTrainingBlockSubject,
  useUpdateTrainingBlockSubject,
} from "@workspace/db/hooks"
import { Checkbox, Col, Form, InputNumber, message, Radio, Select } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { useSubjectRequirementTypeOptions } from "@hooks/subjectRequirementType"
import { buildOrgTree, limitTreeDepth } from "@lib/utils"
import { whereOrganization } from "@workspace/libs/constants"
import { normalizeVietnamese } from "@workspace/libs/utils"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import _ from "lodash"
import { useCallback, useEffect, useMemo, useState } from "react"
import TreeSelect from "@/components/commons/tree-select"
export type PutTrainingBlockSubject = TrainingBlockSubject & {
  conditional?: boolean
}
dayjs.locale("vi")

type SubjectVersion = Prisma.SubjectVersionGetPayload<{
  include: {
    managementOrganization: true
  }
}>

type TrainingBlockOnCurriculumVersionInput = {
  trainingBlockOnCurriculumVersionId: string
  trainingBlockSubjectId: string
}

interface FilterProps {
  managementOrganizationId: string | undefined
}

function getAllChildOrgIds(
  orgId: string,
  list: { Id: string; sParentId: string | null }[]
): string[] {
  const result = [orgId]

  list
    .filter((i) => i.sParentId === orgId)
    .forEach((child) => {
      result.push(...getAllChildOrgIds(child.Id, list))
    })

  return result
}
const PutTrainingBlockSubject = () => {
  const [form] = Form.useForm<PutTrainingBlockSubject>()
  const { options: subjectRequirementTypeOptions } = useSubjectRequirementTypeOptions()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { isOpen, onClose, input } = useDisclosure<TrainingBlockOnCurriculumVersionInput>({
    tag: "PutTrainingBlockSubject",
    onClose: form.resetFields,
  })

  const [filters, setFilters] = useState<FilterProps>({
    managementOrganizationId: "",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  // for update
  const { data: initialValue } = useFindUniqueTrainingBlockSubject(
    { where: { id: input?.trainingBlockSubjectId } },
    { enabled: !!input?.trainingBlockSubjectId }
  )
  const { data: trainingBlockOnCurriculum } = useFindUniqueTrainingBlockOnCurriculumVersion(
    {
      where: { id: input?.trainingBlockOnCurriculumVersionId },
      include: {
        trainingBlock: true,
        curriculumVersion: {
          select: {
            trainingBlocks: {
              select: {
                id: true,
                trainingBlock: true,
              },
            },
          },
        },
      },
    },
    {
      enabled: !!input?.trainingBlockOnCurriculumVersionId,
    }
  )
  const { data: manageOrgData = [] } = useFindManyDM_DonVi({
    where: whereOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })

  const treeData = useMemo(() => buildOrgTree(manageOrgData), [manageOrgData])
  const treeDataLimited = useMemo(() => limitTreeDepth(treeData, 2), [treeData])
  const orgIds = filters.managementOrganizationId
    ? getAllChildOrgIds(filters.managementOrganizationId, manageOrgData)
    : undefined

  const { data: subjectVersionData = [], refetch } = useFindManySubjectVersion({
    where: {
      ...(orgIds && orgIds.length > 0
        ? {
            managementOrganizationId: {
              in: orgIds,
            },
          }
        : {}),
      trainingObjectTypeId,
    },
    include: {
      managementOrganization: true,
    },
  })

  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({
        ...initialValue,
        useForFinalScore: initialValue.useForFinalScore,
        conditional: !initialValue.useForFinalScore,
        graduation: initialValue.graduation,
      })
    } else {
      form.setFieldsValue({
        useForFinalScore: true,
        conditional: false,
        graduation: false,
        active: true,
        type: $Enums.SubjectRequirementType.Mandatory,
      })
    }
  }, [initialValue, form])

  const { mutateAsync: createManyTrainingBlockSubject } = useCreateManyTrainingBlockSubject()
  const { mutateAsync: updateTrainingBlockSubject } = useUpdateTrainingBlockSubject()
  async function onOk(output?: PutTrainingBlockSubject) {
    if (!input || !output) return

    try {
      showSpinner()
      const payload = {
        subjectId: output.subjectId,
        trainingBlockOnCurriculumVersionId:
          output.trainingBlockOnCurriculumVersionId ?? input?.trainingBlockOnCurriculumVersionId,
        semester: output?.semester,
        type: output?.type,
        useForFinalScore: !output?.conditional,
        graduation: output?.graduation,
        // print: output?.print,
        active: output?.active,
      }

      if (input?.trainingBlockSubjectId) {
        await updateTrainingBlockSubject({
          data: payload,
          where: { id: input?.trainingBlockSubjectId },
        })
        message.success("Cập nhật thành công")
      } else {
        const ids = Array.isArray(payload.subjectId) ? payload.subjectId : [payload.subjectId]

        await createManyTrainingBlockSubject({
          data: ids.map((subjectId) => ({
            ...payload,
            subjectId,
          })),
        })

        message.success("Thêm mới thành công")
      }

      queryClient.invalidateQueries({
        queryKey: ["TrainingBlockSubject"],
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

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  const subjectVersionOptions = subjectVersionData.map((item: SubjectVersion) => ({
    label: [
      item?.code,
      item?.name,
      item?.credit + "TC",
      item?.period + "T",
      item?.managementOrganization?.sMa,
    ]
      .filter(Boolean)
      .join(" - "),
    value: item.id,
    searchText: `${item.code} ${item.name}`,
  }))
  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={
        input?.trainingBlockSubjectId
          ? "Chỉnh sửa môn học khối kiến thức"
          : "Thêm mới môn học khối kiến thức"
      }
      className="min-w-[400px] w-[500px]"
      formProps={{
        onValuesChange: (changedValues) => {
        },
      }}
    >
      {!input?.trainingBlockSubjectId && (
        <Col span={24}>
          <p className="mb-4 font-medium">KKT: {trainingBlockOnCurriculum?.trainingBlock.name}</p>
          <Form.Item name="managementOrganizationId" label="Đơn vị quản lý">
            <TreeSelect
              placeholder="Chọn đơn vị quản lý"
              allowClear
              showSearch
              treeDefaultExpandAll
              treeData={treeDataLimited}
              filterTreeNode={(input, node) =>
                normalizeVietnamese(node.searchText).includes(normalizeVietnamese(input))
              }
              onChange={(val) => handleFilterChange("managementOrganizationId", val)}
            />
          </Form.Item>
        </Col>
      )}
      <Col span={24}>
        <FormItem form={form} name="subjectId" label="Môn học" required>
          <Select
            mode={input?.trainingBlockSubjectId ? undefined : "multiple"}
            {...(input?.trainingBlockSubjectId
              ? {
                  showSearch: false,
                  allowClear: false,
                  showArrow: false,
                  open: false,
                }
              : {})}
            showSearch
            placeholder="Chọn phiên bản môn học"
            options={subjectVersionOptions}
            filterOption={(input, option) =>
              normalizeVietnamese(option?.searchText ?? "").includes(normalizeVietnamese(input))
            }
          />
        </FormItem>
      </Col>
      {input?.trainingBlockSubjectId && (
        <Col span={24}>
          <FormItem form={form} name="trainingBlockOnCurriculumVersionId" label="Khối kiến thức">
            <Select
              placeholder="Chọn khối kiến thức"
              showSearch
              onChange={(val) => handleFilterChange("managementOrganizationId", val)}
              options={trainingBlockOnCurriculum?.curriculumVersion?.trainingBlocks?.map((item) => {
                return {
                  label: item.trainingBlock.name,
                  value: item.id,
                }
              })}
            />
          </FormItem>
        </Col>
      )}
      <Col span={24}>
        <FormItem form={form} name="semester" label="Kỳ học dự kiến">
          <InputNumber min={0} type="number" placeholder="Chọn kỳ học dự kiến" className="w-full" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} label="Loại môn học" name="type">
          <Select placeholder="Chọn loại môn học" options={subjectRequirementTypeOptions} />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem
          form={form}
          name="conditional"
          label="Môn điều kiện"
          layout="horizontal"
          valuePropName="checked"
          className="mb-0"
        >
          <Checkbox />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem
          form={form}
          name="graduation"
          label="Môn học tốt nghiệp"
          layout="horizontal"
          valuePropName="checked"
          className="mb-0"
        >
          <Checkbox />
        </FormItem>
      </Col>
      {/* <Col span={24}>
                <div className="flex justify-between items-center mb-6">
                    <span>Có in trên bảng điểm hay không?</span>
                    <FormItem form={form} name="print" valuePropName="checked" className="mb-0">
                        <Checkbox />
                    </FormItem>
                </div>
            </Col> */}
      {input?.trainingBlockSubjectId && (
        <Col span={24}>
          <FormItem form={form} name={"active"} label="Trạng thái" required>
            <Radio.Group buttonStyle="solid">
              <Radio value={true}>Đang hoạt động</Radio>
              <Radio value={false}>Ngừng hoạt động</Radio>
            </Radio.Group>
          </FormItem>
        </Col>
      )}
    </PutFormModal>
  )
}

export default PutTrainingBlockSubject
