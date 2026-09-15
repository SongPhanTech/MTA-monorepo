import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { type GraduationSession, GraduationSessionStatus } from "@workspace/db/client"
import {
  useCreateGraduationSession,
  useFindManyOutputStandard,
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
export type PutGraduationSession = GraduationSession & {
  outputStandardIds?: string[]
  graduationDecisionMakerRole?: "PGĐ" | "GĐ"
  graduationDecisionMakerName?: string
}
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
    {
      where: { id },
      include: {
        outputStandard: true,
      },
    },
    { enabled: !!id }
  )

  const { data: outputStandards = [] } = useFindManyOutputStandard({
    where: {
      deletedAt: null,
      active: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  useEffect(() => {
    if (graduationSession) {
      const graduationDecisionMakerRaw = graduationSession.graduationDecisionSigner?.trim() ?? ""
      const [gradFirst, ...gradRest] = graduationDecisionMakerRaw.split(" ")
      const graduationDecisionMakerRole =
        gradFirst === "PGĐ" || gradFirst === "GĐ" ? gradFirst : undefined
      const graduationDecisionMakerName = graduationDecisionMakerRole
        ? gradRest.join(" ").trim()
        : graduationDecisionMakerRaw

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
        graduationDecisionDate: graduationSession.graduationDecisionDate
          ? dayjs(graduationSession.graduationDecisionDate)
          : undefined,
        graduationDecisionMakerRole,
        graduationDecisionMakerName,
        outputStandardIds: graduationSession.outputStandard?.map((item) => item.id) || [],
      })
    } else {
      form.setFieldsValue({
        status: GraduationSessionStatus.IN_REVIEW,
        trainingObjectTypeId: selectedTrainingObjectTypeId,
        outputStandardIds: [],
        graduationDecisionMakerRole: undefined,
        graduationDecisionMakerName: undefined,
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
      const outputStandardIds = output.outputStandardIds ?? []
      const graduationDecisionMakerRole = output.graduationDecisionMakerRole
      const graduationDecisionMakerName = output.graduationDecisionMakerName?.trim() ?? ""
      const graduationDecisionSigner = graduationDecisionMakerRole
        ? `${graduationDecisionMakerRole} ${graduationDecisionMakerName}`.trim()
        : graduationDecisionMakerName

      const payload = {
        name: output.name.trim(),
        sessionDate: output.sessionDate,
        applicationStart: output.applicationStart,
        applicationEnd: output.applicationEnd,
        status: output.status,
        trainingObjectTypeId: output.trainingObjectTypeId,
        graduationDecisionSigner: graduationDecisionSigner || undefined,
        graduationDecisionNumber: output.graduationDecisionNumber?.trim() || undefined,
        graduationDecisionDate: output.graduationDecisionDate
          ? dayjs(output.graduationDecisionDate).toDate()
          : undefined,
        proposalGraduation: output.proposalGraduation?.trim() || undefined,
      }

      if (id) {
        await updateGraduationSession({
          data: {
            ...payload,
            outputStandard: {
              set: outputStandardIds.map((outputStandardId) => ({
                id: outputStandardId,
              })),
            },
          },
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createGraduationSession({
          data: {
            ...payload,
            outputStandard: {
              connect: outputStandardIds.map((outputStandardId) => ({
                id: outputStandardId,
              })),
            },
          },
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
      <Col span={12}>
        <FormItem form={form} name="outputStandardIds" label="Chuẩn đầu ra">
          <Select
            placeholder="Chọn chuẩn đầu ra để xét (không bắt buộc)"
            options={outputStandards.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
            mode="multiple"
            allowClear
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <Form.Item label="Người ký quyết định tốt nghiệp" className="mb-0">
          <div className="flex gap-2">
            <Form.Item name="graduationDecisionMakerRole" noStyle>
              <Select
                className="w-24"
                placeholder="PGĐ/GĐ"
                options={[
                  { label: "PGĐ", value: "PGĐ" },
                  { label: "GĐ", value: "GĐ" },
                ]}
              />
            </Form.Item>
            <Form.Item name="graduationDecisionMakerName" noStyle>
              <Input placeholder="Nhập tên người ký quyết định tốt nghiệp" />
            </Form.Item>
          </div>
        </Form.Item>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="graduationDecisionNumber" label="Số quyết định tốt nghiệp">
          <Input placeholder="Nhập số quyết định tốt nghiệp" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="graduationDecisionDate" label="Ngày quyết định tốt nghiệp">
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
            placeholder="Chọn ngày quyết định tốt nghiệp"
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="proposalGraduation" label="Tờ trình tốt nghiệp">
          <Input placeholder="số 581/TTr-SĐH ngày 27/6/2025" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutGraduationSession
