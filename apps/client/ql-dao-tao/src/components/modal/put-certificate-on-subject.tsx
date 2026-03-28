import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { Subject } from "@workspace/db"
import type { CertificateOnSubject } from "@workspace/db/client"
import {
  useCreateCertificateOnSubject,
  useFindManySubject,
  useFindUniqueCertificateOnSubject,
  useUpdateCertificateOnSubject,
} from "@workspace/db/hooks"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Form, InputNumber, message } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutCertificateOnSubject = CertificateOnSubject
dayjs.locale("vi")

const PutCertificateOnSubjectScoreModal = () => {
  const [form] = Form.useForm<PutCertificateOnSubject>()
  const [_targetDisabled, setTargetDisabled] = useState(true)
  const { isOpen, onClose, input } = useDisclosure<{ id: string; certificateId: string }>({
    tag: "PutCertificateOnSubjectScoreModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createCertificateOnSubject } = useCreateCertificateOnSubject()
  const { mutateAsync: updateCertificateOnSubject } = useUpdateCertificateOnSubject()
  async function onOk({ ...rest }: PutCertificateOnSubject) {
    try {
      showSpinner()
      if (input?.id) {
        await updateCertificateOnSubject({
          data: {
            subjectId: rest.subjectId,
            certificateId: rest.certificateId,
            finalScore: rest.finalScore,
          },
          where: { id: input?.id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createCertificateOnSubject({
          data: rest,
        })
        message.success("Thêm mới thành công")
      }
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["CertificateOnSubject"],
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

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { data: subjectData = [] } = useFindManySubject({
    where: {
      subjectVersion: {
        some: { trainingObjectTypeId },
      },
    },
  })
  const { data: level } = useFindUniqueCertificateOnSubject(
    {
      where: { id: input?.id },
    },
    { enabled: !!input?.id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    console.log("level", input?.certificateId)

    if (level) {
      setTargetDisabled(false)
      form.setFieldsValue({
        ...level,
        certificateId: input?.certificateId,
      })
    } else {
      form.setFieldsValue({
        active: true,
        certificateId: input?.certificateId,
      })
    }
  }, [level])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.id ? "Chỉnh sửa chứng chỉ theo môn học" : "Thêm mới chứng chỉ theo môn học"}
      className="w-[600px]"
    >
      <Col span={24} className="mb-0 hidden">
        <FormItem form={form} name="certificateId" label="" required />
      </Col>
      <Col span={24} className="mb-4">
        <FormItem form={form} name="finalScore" label="Điểm phiên cho môn học" required>
          <InputNumber
            min={1}
            max={10}
            className="w-full"
            placeholder="Nhập điểm phiên cho môn học"
          />
        </FormItem>
      </Col>
      <Col span={24} className="mb-4">
        <FormItem form={form} name="subjectId" label="Môn được quy đổi" required>
          <Select
            allowClear
            style={{ width: "100%" }}
            placeholder="Chọn môn học"
            options={subjectData.map((item: Subject) => ({
              label: [item.code, item.name].filter(Boolean).join(" - "),
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutCertificateOnSubjectScoreModal
