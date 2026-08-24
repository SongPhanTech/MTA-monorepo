import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { thongBaoHanNhapDiemQuaTrinh, thongBaoHanNhapDiemThi } from "@lib/thong-bao-giang-vien"
import { useFindUniqueSubjectClass, useUpdateSubjectClass } from "@workspace/db/hooks"
import { toVnDayjs, toVnEndOfDay, toVnStartOfDay } from "@workspace/libs/timezone"
import { DatePicker as AntdDatePicker, Col, Form, message } from "antd"
import locale from "antd/es/date-picker/locale/vi_VN"
import type { Dayjs } from "dayjs"
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
          scoreDeadLineStart: output?.time?.[0] ? toVnStartOfDay(output.time[0]) : null,
          scoreDeadline: output?.time?.[1] ? toVnEndOfDay(output.time[1]) : null,
          examScoreDeadline: output?.examScoreDeadline
            ? toVnEndOfDay(output.examScoreDeadline)
            : null,
        },
        select: { id: true },
      })

      if (output?.time?.[1] || output?.time?.[0]) {
        await thongBaoHanNhapDiemQuaTrinh([id])
      }
      if (output?.examScoreDeadline) {
        await thongBaoHanNhapDiemThi([id])
      }

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
          toVnDayjs(data.scoreDeadLineStart) ?? undefined,
          toVnDayjs(data.scoreDeadline) ?? undefined,
        ],
        examScoreDeadline: toVnDayjs(data.examScoreDeadline) ?? undefined,
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
      title={"Đặt hạn nhập điểm"}
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem form={form} name={"time"} label="Thời gian nhập điểm TX,ĐK">
          <AntdDatePicker.RangePicker
            locale={locale}
            format={"DD/MM/YYYY"}
            placeholder={["Bắt đầu", "Kết thúc"]}
            className="w-full"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name={"examScoreDeadline"} label="Hạn nhập điểm thi">
          <DatePicker format={"DD/MM/YYYY"} placeholder={"Hạn nhập điểm thi"} className="w-full" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutDeadlineScoreModal
