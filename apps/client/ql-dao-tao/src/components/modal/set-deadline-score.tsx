import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { useFindUniqueSubjectClass, useUpdateSubjectClass } from "@workspace/db/hooks"
import { DatePicker as AntdDatePicker, Col, Form, message } from "antd"
import locale from "antd/es/date-picker/locale/vi_VN"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type PutUpdateTime = {
  time: (Dayjs | null | undefined)[]
  examScoreDeadline?: Dayjs | null
}
const PutDeadlineScoreModal = () => {
  const [form] = Form.useForm<PutUpdateTime>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<any>({
    tag: "PutDeadlineScoreModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const { data } = useFindUniqueSubjectClass({
    where: { id },
    select: {
      scoreDeadLineStart: true,
      scoreDeadline: true,
      examScoreDeadline: true,
    },
  })
  const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()

  async function onOk(output?: PutUpdateTime) {
    try {
      showSpinner()
      await updateSubjectClass({
        where: { id },
        data: {
          scoreDeadLineStart: output?.time ? output?.time[0]?.toISOString() : null,
          scoreDeadline: output?.time ? output?.time[1]?.toISOString() : null,
          examScoreDeadline: output?.examScoreDeadline
            ? output?.examScoreDeadline?.toISOString()
            : null,
        },
        select: { id: true },
      })

      message.success("Đặt hạn nhập điểm thành công")
      onClose()
    } catch (error: unknown) {
      console.error(error)
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        time: [
          data.scoreDeadLineStart ? dayjs(data.scoreDeadLineStart) : undefined,
          data.scoreDeadline ? dayjs(data.scoreDeadline) : undefined,
        ],
        examScoreDeadline: data.examScoreDeadline ? dayjs(data.examScoreDeadline) : undefined,
      })
    }
  }, [data, form.setFieldsValue])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={"Đặt hạn sửa điểm"}
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem form={form} name={"time"} label="Thời gian sửa điểm">
          <AntdDatePicker.RangePicker
            locale={locale}
            format={"DD/MM/YYYY"}
            placeholder={["Bắt đầu", "Kết thúc"]}
            className="w-full"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name={"examScoreDeadline"} label="Hạn sửa điểm ">
          <DatePicker format={"DD/MM/YYYY"} placeholder={"Hạn sửa điểm "} className="w-full" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutDeadlineScoreModal
