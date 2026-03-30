import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { type GraduationSession, GraduationSessionStatus } from "@workspace/db/client"
import {
  useCreateGraduationSession,
  useFindUniqueGraduationSession,
  useUpdateGraduationSession,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import DatePicker from "@components/commons/date-picker"
import Select from "@components/commons/select"
import { useGraduationSessionStatusOptions } from "@hooks/graduationSessionStatus"
import { useFindManyTrainingObjectTypePermission, useTrainingObjectTypeStore } from "@workspace/ui"
import { useEffect } from "react"
export type PutGraduationSession = GraduationSession
dayjs.locale("vi")

const PutGraduationSession = () => {
  const { graduationSessionStatusOptions } = useGraduationSessionStatusOptions()
  const { id: selectedTrainingObjectTypeId } = useTrainingObjectTypeStore()
  const [form] = Form.useForm<PutGraduationSession>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutGraduationSession",
    onClose: form.resetFields,
  })
  const sessionDate = Form.useWatch("sessionDate", form)
  const applicationStart = Form.useWatch("applicationStart", form)

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: graduationSession } = useFindUniqueGraduationSession(
    { where: { id } },
    { enabled: !!id }
  )

  useEffect(() => {
    if (graduationSession) {
      form.setFieldsValue({
        ...graduationSession,
        sessionDate: graduationSession.sessionDate
          ? dayjs(graduationSession.sessionDate)
          : undefined,
        applicationStart: graduationSession.applicationStart
          ? dayjs(graduationSession.applicationStart)
          : undefined,
        applicationEnd: graduationSession.applicationEnd
          ? dayjs(graduationSession.applicationEnd)
          : undefined,
      })
    } else {
      form.setFieldsValue({
        status: GraduationSessionStatus.IN_REVIEW,
        trainingObjectTypeId: selectedTrainingObjectTypeId,
      })
    }
  }, [graduationSession, form, selectedTrainingObjectTypeId])

  const { data: trainingObjectTypes = [] } = useFindManyTrainingObjectTypePermission()

  const { mutateAsync: createGraduationSession } = useCreateGraduationSession()
  const { mutateAsync: updateGraduationSession } = useUpdateGraduationSession()
  async function onOk(output?: PutGraduationSession) {
    if (!output) return

    try {
      showSpinner()
      const payload = {
        name: output.name.trim(),
        sessionDate: output.sessionDate,
        applicationStart: output.applicationStart,
        applicationEnd: output.applicationEnd,
        status: output.status,
        trainingObjectTypeId: output.trainingObjectTypeId,
      }

      if (id) {
        await updateGraduationSession({
          data: payload,
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createGraduationSession({
          data: payload,
        })
        message.success("Thêm mới thành công")
      }

      queryClient.invalidateQueries({
        queryKey: ["TrainingBlock"],
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

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa đợt xét tốt nghiệp" : "Thêm mới đợt xét tốt nghiệp"}
      className="w-[50vw]"
    >
      <Col span={12}>
        <FormItem form={form} name="name" label="Tên đợt xét tốt nghiệp" required>
          <Input placeholder="Nhập tên đợt xét tốt nghiệp" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="trainingObjectTypeId" label="Đối tượng đào tạo" required>
          <Select
            placeholder="Chọn đối tượng đào tạo"
            options={trainingObjectTypes.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
            disabled
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="sessionDate" label="Ngày họp hội đồng" required>
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
            disabledDate={(current) => {
              const startTime = dayjs().add(1, "day")
              if (!startTime) return false
              return current && current < dayjs(startTime).startOf("day")
            }}
            placeholder="Chọn ngày họp hội đồng"
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="applicationStart" label="Ngày bắt đầu nhận đơn" required>
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            disabled={!sessionDate}
            disabledDate={(current) => {
              if (!sessionDate) return false
              return current && sessionDate && current.isAfter(dayjs(sessionDate, "day"))
            }}
            className="w-full"
            placeholder="Chọn ngày bắt đầu nhận đơn"
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="applicationEnd" label="Ngày kết thúc nhận đơn" required>
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
            disabled={!sessionDate || !applicationStart}
            disabledDate={(current) => {
              if (!applicationStart) return false
              if (!sessionDate) return false
              return (
                current &&
                (current.isBefore(dayjs(applicationStart, "day")) ||
                  (sessionDate && current.isAfter(dayjs(sessionDate, "day"))))
              )
            }}
            placeholder="Chọn ngày kết thúc nhận đơn"
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="status" label="Trạng thái" required>
          <Select
            placeholder="Chọn trạng thái"
            options={graduationSessionStatusOptions?.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
            allowClear
            defaultValue={GraduationSessionStatus.PLANNING}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutGraduationSession
