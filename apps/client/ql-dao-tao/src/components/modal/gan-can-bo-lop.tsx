import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import {
  useFindManyStudent,
  useFindUniqueFixedClass,
  useUpdateFixedClass,
} from "@workspace/db/hooks"
import { Col, Form, message, Select } from "antd"
import { useEffect, useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type CanBoLopForm = {
  classMonitorId?: string | null
  unionSecretaryId?: string | null
  unionLeaderId?: string | null
  deputyUnionSecretaryId?: string | null
}

const GanCanBoLopModal = () => {
  const [form] = Form.useForm<CanBoLopForm>()
  const { isOpen, onClose, input } = useDisclosure<{ id: string }>({
    tag: "GanCanBoLopModal",
    onClose: form.resetFields,
  })
  const fixedClassId = input?.id

  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateFixedClass } = useUpdateFixedClass()

  const { data: initialValue } = useFindUniqueFixedClass(
    {
      where: { id: fixedClassId },
      select: {
        classMonitorId: true,
        unionSecretaryId: true,
        unionLeaderId: true,
        deputyUnionSecretaryId: true,
      },
    },
    { enabled: !!fixedClassId }
  )

  const { data: students = [] } = useFindManyStudent(
    {
      where: { fixedClassId, active: true },
      include: { userProfile: true },
      orderBy: { userProfile: { firstName: "asc" } },
    },
    { enabled: !!fixedClassId }
  )

  const studentOptions = useMemo(
    () =>
      students.map((sv) => ({
        value: sv.id,
        label: `${sv.code} - ${sv.userProfile?.fullname ?? ""}`,
      })),
    [students]
  )

  useEffect(() => {
    if (isOpen && initialValue) {
      form.setFieldsValue({
        classMonitorId: initialValue.classMonitorId,
        unionSecretaryId: initialValue.unionSecretaryId,
        unionLeaderId: initialValue.unionLeaderId,
        deputyUnionSecretaryId: initialValue.deputyUnionSecretaryId,
      })
    }
  }, [isOpen, initialValue])

  async function onOk(data?: CanBoLopForm) {
    if (!data || !fixedClassId) return

    try {
      showSpinner()
      await updateFixedClass({
        where: { id: fixedClassId },
        data: {
          classMonitorId: data.classMonitorId ?? null,
          unionSecretaryId: data.unionSecretaryId ?? null,
          unionLeaderId: data.unionLeaderId ?? null,
          deputyUnionSecretaryId: data.deputyUnionSecretaryId ?? null,
        },
      })
      message.success("Cập nhật cán bộ lớp thành công")
      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error.info.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      title="Gán cán bộ lớp"
      layout="horizontal"
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
      formProps={{ labelAlign: "left" }}
    >
      <Col span={24}>
        <FormItem form={form} name="classMonitorId" label="Lớp trưởng">
          <Select
            showSearch
            allowClear
            getPopupContainer={(triggerNode) => triggerNode.parentElement}
            optionFilterProp="label"
            placeholder="Chọn sinh viên"
            options={studentOptions}
          />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem form={form} name="unionSecretaryId" label="Bí thư">
          <Select
            showSearch
            allowClear
            getPopupContainer={(triggerNode) => triggerNode.parentElement}
            optionFilterProp="label"
            placeholder="Chọn sinh viên"
            options={studentOptions}
          />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem form={form} name="unionLeaderId" label="Bí thư liên chi đoàn">
          <Select
            showSearch
            allowClear
            getPopupContainer={(triggerNode) => triggerNode.parentElement}
            optionFilterProp="label"
            placeholder="Chọn sinh viên"
            options={studentOptions}
          />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem form={form} name="deputyUnionSecretaryId" label="Phó bí thư liên chi đoàn">
          <Select
            showSearch
            allowClear
            getPopupContainer={(triggerNode) => triggerNode.parentElement}
            optionFilterProp="label"
            placeholder="Chọn sinh viên"
            options={studentOptions}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default GanCanBoLopModal
