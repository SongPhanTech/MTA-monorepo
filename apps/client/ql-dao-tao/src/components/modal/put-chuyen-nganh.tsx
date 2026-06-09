import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import { buildOrgTree } from "@lib/utils"
import type { TrainingField, TrainingMajor, TrainingObjectType } from "@workspace/db/client"
import {
  useCreateTrainingMajor,
  useFindManyCurriculum,
  useFindManyDM_DonVi,
  useFindManyTrainingField,
  useFindUniqueTrainingMajor,
  useUpdateTrainingMajor,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Radio } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { whereOrganization } from "@workspace/libs/constants"
import { useFindManyTrainingObjectTypePermission } from "@workspace/ui"
import TreeSelect from "@/components/commons/tree-select"
export type PutTrainingMajor = TrainingMajor & {
  trainingObjectTypeIds: string[]
}
dayjs.locale("vi")
const PutTrainingMajorModal = () => {
  const [form] = Form.useForm<PutTrainingMajor>()
  const [targetDisabled, setTargetDisabled] = useState(true)
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutTrainingMajorModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const { data: trainingFieldData = [], refetch: refetchManyTrainingField } =
    useFindManyTrainingField()

  const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
    useFindManyTrainingObjectTypePermission({
      where: {
        trainingFields: {
          some: {
            trainingFieldId: form.getFieldValue("trainingFieldId"),
          },
        },
      },
    })

  const { data: curriculumsByMajor = [] } = useFindManyCurriculum(
    {
      where: { trainingMajorId: id },
      select: { trainingObjectTypeId: true },
    },
    { enabled: !!id }
  )
  const lockedTrainingObjectTypeIds = new Set(
    curriculumsByMajor.map((i: { trainingObjectTypeId: string }) => i.trainingObjectTypeId)
  )

  const { data: organizations = [] } = useFindManyDM_DonVi({
    where: whereOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const treeData = buildOrgTree(organizations)

  const { mutateAsync: createTrainingMajor } = useCreateTrainingMajor()
  const { mutateAsync: updateTrainingMajor } = useUpdateTrainingMajor()
  async function onOk({ trainingObjectTypeIds, ...rest }: PutTrainingMajor) {
    try {
      showSpinner()
      if (id) {
        await updateTrainingMajor({
          data: {
            ...rest,
            trainingObjectTypes: {
              createMany: {
                data: trainingObjectTypeIds.map((trainingObjectTypeId) => ({
                  trainingObjectTypeId,
                })),
                skipDuplicates: true,
              },
              deleteMany: {
                trainingMajorId: id,
                trainingObjectTypeId: {
                  notIn: trainingObjectTypeIds,
                },
              },
            },
          },
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createTrainingMajor({
          data: {
            ...rest,
            trainingObjectTypes: {
              createMany: {
                data: trainingObjectTypeIds.map((trainingObjectTypeId) => ({
                  trainingObjectTypeId,
                })),
              },
            },
          },
        })
        message.success("Thêm mới thành công")
      }
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["TrainingMajor"],
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

  const { data: level } = useFindUniqueTrainingMajor(
    {
      where: { id },
      include: {
        organization: true,
        trainingObjectTypes: true,
      },
    },
    { enabled: !!id }
  )

  const handleMajorChange = async (val: string) => {
    try {
      form.setFieldsValue({
        trainingObjectTypeIds: [],
      })
      setTargetDisabled(true)
      await refetchObjectType()
      if (form.getFieldValue("trainingFieldId")) {
        setTargetDisabled(false)
      } else {
        setTargetDisabled(true)
      }
    } catch (_err) {
      message.error("Lỗi khi tải đối tượng đào tạo")
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (level) {
      setTargetDisabled(false)
      form.setFieldsValue({
        ...level,
        trainingObjectTypeIds: level.trainingObjectTypes.map(
          (i: { trainingObjectTypeId: string }) => i?.trainingObjectTypeId
        ),
      })
    } else {
      form.setFieldsValue({
        active: true,
      })
    }
  }, [level])

  const handleCreditsChange = () => {
    form.validateFields(["numberCreditsMajor", "numberCreditsRequired", "numberCreditsElective"])
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa chuyên ngành" : "Thêm mới chuyên ngành"}
      className="w-[900px]"
    >
      <Col span={12}>
        <FormItem form={form} name="trainingFieldId" label="Ngành" required>
          <Select
            placeholder="Chọn ngành"
            options={trainingFieldData.map((i: TrainingField) => {
              return {
                value: i.id,
                label: [i.code, i.name].filter(Boolean).join(" - "),
              }
            })}
            onChange={(val) => handleMajorChange(val)}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="trainingObjectTypeIds" label="Đối tượng đào tạo" required>
          <Select
            mode="multiple"
            maxTagCount={"responsive"}
            placeholder="Chọn đối tượng đào tạo"
            options={trainingObjectTypeData.map((i: TrainingObjectType) => {
              const isLocked = lockedTrainingObjectTypeIds.has(i.id)
              return {
                value: i.id,
                label: isLocked ? `${i.name} (đã có trong CTĐT)` : i.name,
                disabled: isLocked,
              }
            })}
            disabled={targetDisabled}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem
          form={form}
          required
          name="organizationId"
          label="Đơn vị quản lý"
          className="mb-2"
        >
          <TreeSelect
            allowClear
            showSearch
            placeholder="Chọn đơn vị quản lý"
            treeDefaultExpandAll
            treeData={treeData}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="secondOrganizationId" label="Đơn vị quản lý 2" className="mb-2">
          <TreeSelect
            allowClear
            showSearch
            placeholder="Chọn đơn vị quản lý 2"
            treeDefaultExpandAll
            treeData={treeData}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="thirdOrganizationId" label="Đơn vị quản lý 3" className="mb-2">
          <TreeSelect
            allowClear
            showSearch
            placeholder="Chọn đơn vị quản lý 3"
            treeDefaultExpandAll
            treeData={treeData}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="code" label="Mã chuyên ngành" required>
          <Input placeholder="Nhập mã chuyên ngành" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="shortName" label="Viết tắt" required>
          <Input placeholder="Nhập viết tắt" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="name" label="Tên chuyên ngành" required>
          <Input placeholder="Nhập tên chuyên ngành" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="englishName" label="Tên tiếng anh">
          <Input placeholder="Nhập tên tiếng anh" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem
          form={form}
          name="numberCreditsMajor"
          label="Số TC Chuyên Ngành"
          rules={[
            {
              validator: async (_, value) => {
                const required = form.getFieldValue("numberCreditsRequired") ?? 0
                const elective = form.getFieldValue("numberCreditsElective") ?? 0
                const total = required + elective

                if (typeof value === "number" && total > value) {
                  return Promise.reject(
                    new Error(
                      "Tổng số tín chỉ bắt buộc và lựa chọn không được lớn hơn số tín chỉ chuyên ngành."
                    )
                  )
                }

                return Promise.resolve()
              },
            },
          ]}
        >
          <InputNumber
            type="number"
            style={{ width: "100%" }}
            min={0}
            step={1}
            onChange={handleCreditsChange}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem
          form={form}
          name="numberCreditsRequired"
          label="Số TC Bắt Buộc"
          rules={[
            {
              validator: async (_, value) => {
                const major = form.getFieldValue("numberCreditsMajor") || 0
                const elective = form.getFieldValue("numberCreditsElective") || 0
                const total = (value || 0) + elective
                if (major && total > major) {
                  return Promise.reject(
                    new Error(
                      "Tổng số tín chỉ bắt buộc và lựa chọn không được lớn hơn số tín chỉ chuyên ngành."
                    )
                  )
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <InputNumber
            type="number"
            style={{ width: "100%" }}
            min={0}
            step={1}
            onChange={handleCreditsChange}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem
          form={form}
          name="numberCreditsElective"
          label="Số TC Lựa Chọn"
          rules={[
            {
              validator: async (_, value) => {
                const major = form.getFieldValue("numberCreditsMajor") || 0
                const required = form.getFieldValue("numberCreditsRequired") || 0
                const total = required + (value || 0)
                if (major && total > major) {
                  return Promise.reject(
                    new Error(
                      "Tổng số tín chỉ bắt buộc và lựa chọn không được lớn hơn số tín chỉ chuyên ngành."
                    )
                  )
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <InputNumber
            type="number"
            style={{ width: "100%" }}
            min={0}
            step={1}
            onChange={handleCreditsChange}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="summary" label="Tóm tắt" required>
          <Input.TextArea placeholder="Nhập tóm tắt" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name={"active"} label="Trạng thái" required>
          <Radio.Group buttonStyle="solid">
            <Radio value={true}>Đang hoạt động</Radio>
            <Radio value={false}>Ngừng hoạt động</Radio>
          </Radio.Group>
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutTrainingMajorModal
