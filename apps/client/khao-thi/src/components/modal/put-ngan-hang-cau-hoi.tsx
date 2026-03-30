import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import type { PutQuestionBankInput } from "@pages/thiet-lap-de-thi/ngan-hang-cau-hoi"
import type { QuestionBank, SubjectVersion } from "@workspace/db/client"
import {
  useCreateQuestionBank,
  useFindManySubjectVersion,
  useFindUniqueQuestionBank,
  useUpdateQuestionBank,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type PutQuestionBankType = QuestionBank

const PutQuestionBank = () => {
  const [form] = Form.useForm<PutQuestionBankType>()

  const { isOpen, onClose, input } = useDisclosure<PutQuestionBankInput>({
    tag: "PutQuestionBank",
    onClose: form.resetFields,
  })

  const id = input?.id
  const subjectVersionId = input?.subjectVersionId

  const { mutateAsync: createQuestionBank } = useCreateQuestionBank()
  const { mutateAsync: updateQuestionBank } = useUpdateQuestionBank()

  async function onOk(output?: PutQuestionBankType) {
    if (!output) return
    try {
      const data = {
        code: output.code,
        name: output.name,
        subjectVersionId: output.subjectVersionId,
      }
      if (id) {
        await updateQuestionBank({
          data,
          where: {
            id,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createQuestionBank({
          data,
        })
        message.success("Thêm mới thành công")
      }

      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    }
  }

  const { data: initialValue } = useFindUniqueQuestionBank(
    {
      where: { id },
    },
    {
      enabled: !!id,
    }
  )

  const { data: subjectVersionData = [] } = useFindManySubjectVersion({
    orderBy: { name: "asc" },
  })

  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({ ...initialValue })
    } else if (subjectVersionId && !id) {
      form.setFieldValue("subjectVersionId", subjectVersionId)
    }
  }, [initialValue, subjectVersionId, id, form])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa ngân hàng câu hỏi" : "Thêm mới ngân hàng câu hỏi"}
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="code" label="Mã ngân hàng câu hỏi">
          <Input placeholder="Nhập mã ngân hàng câu hỏi" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên ngân hàng câu hỏi" required>
          <Input placeholder="Nhập tên ngân hàng câu hỏi" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="subjectVersionId" label="Môn học" required>
          <Select
            maxTagCount={"responsive"}
            placeholder="Chọn môn học"
            options={subjectVersionData.map((i: SubjectVersion) => {
              const name = i.name || ""
              return {
                value: i.id,
                label: `${name}`,
              }
            })}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutQuestionBank
