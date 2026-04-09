import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import {
  useCreateOutputStandard,
  useFindManyCertificate,
  useFindUniqueOutputStandard,
  useUpdateOutputStandard,
} from "@workspace/db/hooks"
import { Col, Form, Input, message, Radio, Select } from "antd"
import { useEffect, useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type OutputStandardFormValues = {
  name: string
  certificateIds: string[]
  active?: boolean
}

const PutAddChuanDauRa = () => {
  const [form] = Form.useForm<OutputStandardFormValues>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutAddChuanDauRa",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createOutputStandard } = useCreateOutputStandard()
  const { mutateAsync: updateOutputStandard } = useUpdateOutputStandard()

  const { data: certificates = [] } = useFindManyCertificate({
    where: {
      deletedAt: null,
    },
    orderBy: {
      name: "asc",
    },
  })

  const certificateOptions = useMemo(
    () =>
      certificates.map((certificate) => ({
        value: certificate.id,
        label: [certificate.name, certificate.englishName].filter(Boolean).join(" - "),
      })),
    [certificates]
  )

  async function onOk(values?: OutputStandardFormValues) {
    if (!values) return

    try {
      showSpinner()
      const certificateIds = values.certificateIds ?? []

      if (id) {
        await updateOutputStandard({
          where: { id },
          data: {
            name: values.name,
            active: values.active ?? true,
            certificates: {
              set: certificateIds.map((certificateId) => ({ id: certificateId })),
            },
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createOutputStandard({
          data: {
            name: values.name,
            active: values.active ?? true,
            certificates: {
              connect: certificateIds.map((certificateId) => ({ id: certificateId })),
            },
          },
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["OutputStandard"],
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

  const { data: detail } = useFindUniqueOutputStandard(
    {
      where: { id },
      include: {
        certificates: {
          select: {
            id: true,
          },
        },
      },
    },
    { enabled: !!id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (detail) {
      form.setFieldsValue({
        name: detail.name,
        active: detail.active,
        certificateIds: detail.certificates?.map((certificate) => certificate.id) ?? [],
      })
    } else {
      form.setFieldsValue({
        active: true,
        certificateIds: [],
      })
    }
  }, [detail])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa chuẩn đầu ra" : "Thêm mới chuẩn đầu ra"}
      className="w-[60vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên chuẩn đầu ra" required>
          <Input placeholder="Nhập tên chuẩn đầu ra" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="certificateIds" label="Chứng chỉ áp dụng">
          <Select
            mode="multiple"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Chọn một hoặc nhiều chứng chỉ"
            options={certificateOptions}
          />
        </FormItem>
      </Col>
      {id && (
        <Col span={24}>
          <FormItem form={form} name="active" label="Trạng thái">
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

export default PutAddChuanDauRa
