import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { Certificate } from "@workspace/db/client"
import {
  useCreateCertificate,
  useFindUniqueCertificate,
  useUpdateCertificate,
  useFindManySubjectVersion,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Radio } from "antd"
import Select from "@components/commons/select"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useTrainingObjectTypeStore } from "@workspace/ui"
export type PutCertificate = Certificate & { subjectVersions?: string[] }
dayjs.locale("vi")

const PutCertificateScoreModal = () => {
  const [form] = Form.useForm<PutCertificate>()
  const [_targetDisabled, setTargetDisabled] = useState(true)
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutCertificateScoreModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { mutateAsync: createCertificate } = useCreateCertificate()
  const { mutateAsync: updateCertificate } = useUpdateCertificate()
  async function onOk({ ...rest }: PutCertificate) {
    try {
      showSpinner()
      const subjectVersionsData = rest.subjectVersions
        ? {
            set: rest.subjectVersions.map((sv: string) => ({ id: sv })),
          }
        : { set: [] }

      if (id) {
        await updateCertificate({
          data: {
            name: rest.name,
            isUsingScore: rest.isUsingScore,
            scoreThreshold: rest.scoreThreshold,
            subjectVersions: subjectVersionsData,
          },
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createCertificate({
          data: {
            ...rest,
            subjectVersions: rest.subjectVersions
              ? {
                  connect: rest.subjectVersions.map((sv: string) => ({ id: sv })),
                }
              : undefined,
          },
        })
        message.success("Thêm mới thành công")
      }
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["Certificate"],
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

  const { data: certificate } = useFindUniqueCertificate(
    {
      where: { id },
      include: { subjectVersions: true },
    },
    { enabled: !!id }
  )

  const { data: subjectVersionData = [] } = useFindManySubjectVersion({
    where: { trainingObjectTypeId },
    orderBy: { name: "asc" },
    take: 5000,
  })

  useEffect(() => {
    if (certificate) {
      setTargetDisabled(false)
      form.setFieldsValue({
        ...certificate,
        subjectVersions: certificate.subjectVersions?.map((sv) => sv.id) || [],
      })
    } else {
      form.setFieldsValue({
        active: true,
        isUsingScore: true,
      })
    }
  }, [certificate])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa điểm chứng chỉ" : "Thêm mới điểm chứng chỉ"}
      className="w-[500px]"
    >
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên chứng chỉ" required>
          <Input placeholder="Nhập tên chứng chỉ" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="isUsingScore" label="Phương thức phiên điểm" required>
          <Radio.Group>
            <Radio value={true}>Điểm</Radio>
            <Radio value={false}>Đạt/Không đạt</Radio>
          </Radio.Group>
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem
          form={form}
          name="subjectVersions"
          label="Danh sách môn học để xét chứng chỉ thông qua điểm TBC"
        >
          <Select
            mode="multiple"
            allowClear
            placeholder="Chọn môn học"
            options={subjectVersionData.map((item) => ({
              value: item.id,
              label: `${item.code} - ${item.name} (${item.credit} TC)`,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="scoreThreshold" label="Ngưỡng điểm so sánh">
          <InputNumber min={0} max={10} precision={1} placeholder="Nhập ngưỡng điểm so sánh" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutCertificateScoreModal
