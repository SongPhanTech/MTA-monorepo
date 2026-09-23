import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { ThesisSession } from "@workspace/db/client"
import {
  useCreateThesisSession,
  useFindManyConfigPaymentSession,
  useFindManyTrainingCourse,
  useFindUniqueThesisSession,
  useUpdateThesisSession,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import DatePicker from "@components/commons/date-picker"
import Select from "@components/commons/select"
import { useFindManyTrainingObjectTypePermission } from "@workspace/ui"
import { useEffect, useState } from "react"
export type PutThesisSession = ThesisSession
type PutThesisSessionForm = PutThesisSession & {
  trainingCourseIds?: string[]
  decisionMakerRole?: "PGĐ" | "GĐ"
  decisionMakerName?: string
  defenseDecisionMakerRole?: "PGĐ" | "GĐ"
  defenseDecisionMakerName?: string
  graduationDecisionMakerRole?: "PGĐ" | "GĐ"
  graduationDecisionMakerName?: string
}
dayjs.locale("vi")

function parseSignedRole(value: string) {
  const raw = value.trim().replace(/\s+/g, " ")
  const deputy = raw.match(/^(PGĐ|Phó\s+Giám\s+Đốc)\s+([\s\S]+)$/i)
  if (deputy?.[2]) return { role: "PGĐ" as const, name: deputy[2].trim() }
  const chief = raw.match(/^(GĐ|Giám\s+Đốc)\s+([\s\S]+)$/i)
  if (chief?.[2]) return { role: "GĐ" as const, name: chief[2].trim() }
  return { role: undefined, name: raw }
}

const PutThesisSession = () => {
  const [form] = Form.useForm<PutThesisSessionForm>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutThesisSession",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: thesisSession } = useFindUniqueThesisSession(
    { where: { id }, include: { trainingCourses: { select: { id: true } } } },
    { enabled: !!id }
  )

  useEffect(() => {
    if (thesisSession) {
      const {
        decisionMaker: _decisionMaker,
        defenseDecisionMaker: _defenseDecisionMaker,
        ...sessionRest
      } = thesisSession
      const decisionMaker = parseSignedRole(thesisSession.decisionMaker?.trim() ?? "")
      const decisionMakerRole = decisionMaker.role
      const decisionMakerName = decisionMaker.name
      const defenseDecisionMaker = parseSignedRole(thesisSession.defenseDecisionMaker?.trim() ?? "")
      const defenseDecisionMakerRole = defenseDecisionMaker.role
      const defenseDecisionMakerName = defenseDecisionMaker.name
      form.setFieldsValue({
        ...sessionRest,
        trainingCourseIds: thesisSession.trainingCourses?.map((c) => c.id) ?? [],
        trainingObjectTypeId: thesisSession.trainingObjectTypeId,
        decisionNumber: thesisSession.decisionNumber,
        decisionMakerRole,
        decisionMakerName,
        defenseDecisionNumber: thesisSession.defenseDecisionNumber,
        defenseDecisionMakerRole,
        defenseDecisionMakerName,
        chief: thesisSession.chief,
        deputy: thesisSession.deputy,
        startDate: thesisSession.startDate ? dayjs(thesisSession.startDate) : undefined,
        endDate: thesisSession.endDate ? dayjs(thesisSession.endDate) : undefined,
        decisionDate: thesisSession.decisionDate ? dayjs(thesisSession.decisionDate) : undefined,
        defenseDecisionDate: thesisSession.defenseDecisionDate
          ? dayjs(thesisSession.defenseDecisionDate)
          : undefined,
      })
      setTrainingObjectId(thesisSession.trainingObjectTypeId)
    } else {
      form.setFieldsValue({
        decisionMakerRole: undefined,
        decisionMakerName: undefined,
        defenseDecisionMakerRole: undefined,
        defenseDecisionMakerName: undefined,
      })
    }
  }, [thesisSession, form])

  const { data: trainingObjectTypes = [] } = useFindManyTrainingObjectTypePermission()
  const [trainingObjectId, setTrainingObjectId] = useState<string | null>(null)
  const { data: paymentConfigs = [] } = useFindManyConfigPaymentSession({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  })
  const { data: trainingCourses = [] } = useFindManyTrainingCourse(
    {
      where: { trainingObjectTypeId: trainingObjectId ?? ("" as string) },
      orderBy: {
        semesterStart: {
          startDate: "desc",
        },
      },
    },

    { enabled: !!trainingObjectId }
  )
  const { mutateAsync: createThesisSession } = useCreateThesisSession()
  const { mutateAsync: updateThesisSession } = useUpdateThesisSession()
  async function onOk(output?: PutThesisSessionForm) {
    if (!output) return

    try {
      showSpinner()
      const decisionMaker = [output.decisionMakerRole, output.decisionMakerName]
        .filter(Boolean)
        .join(" ")
        .trim()
      const defenseDecisionMaker = [
        output.defenseDecisionMakerRole,
        output.defenseDecisionMakerName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim()
      const courseIds = output.trainingCourseIds ?? []
      const payload = {
        name: output.name.trim(),
        startDate: output.startDate ? dayjs(output.startDate).toDate() : new Date(),
        trainingObjectTypeId: output.trainingObjectTypeId,
        proposalReport: output.proposalReport?.trim() || undefined,
        councilReport: output.councilReport?.trim() || undefined,
        decisionNumber: output.decisionNumber,
        decisionMaker,
        decisionDate: output.decisionDate ? dayjs(output.decisionDate).toDate() : new Date(),
        defenseDecisionNumber: output.defenseDecisionNumber,
        defenseDecisionMaker: defenseDecisionMaker || undefined,
        defenseDecisionDate: output.defenseDecisionDate
          ? dayjs(output.defenseDecisionDate).toDate()
          : new Date(),
        chief: output.chief,
        deputy: output.deputy?.trim() || undefined,
        endDate: output.endDate ? dayjs(output.endDate).toDate() : new Date(),
        configPaymentSessionId: output.configPaymentSessionId ?? null,
      }

      if (id) {
        await updateThesisSession({
          data: {
            ...payload,
            trainingCourses: { set: courseIds.map((courseId) => ({ id: courseId })) },
          },
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createThesisSession({
          data: {
            ...payload,
            trainingCourses: { connect: courseIds.map((courseId) => ({ id: courseId })) },
          },
        })
        message.success("Thêm mới thành công")
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ThesisSession"] }),
        queryClient.invalidateQueries({ queryKey: ["ConfigPaymentSession"] }),
      ])
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
      title={id ? "Chỉnh sửa đợt xét luận văn" : "Thêm mới đợt xét luận văn"}
      className="w-[80vw]"
    >
      <Col span={8}>
        <FormItem form={form} name="name" label="Tên đợt xét luận văn" required>
          <Input placeholder="Nhập tên đợt xét luận văn" />
        </FormItem>
      </Col>
      <Col span={8}>
        <FormItem form={form} name="trainingObjectTypeId" label="Đối tượng đào tạo" required>
          <Select
            placeholder="Chọn đối tượng đào tạo"
            options={trainingObjectTypes.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
            onChange={(value) => setTrainingObjectId(value)}
          />
        </FormItem>
      </Col>
      <Col span={8}>
        <FormItem form={form} name="trainingCourseIds" label="Khóa học" required>
          <Select
            mode="multiple"
            placeholder="Chọn khóa học"
            options={trainingCourses?.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>

      {/* <Col span={12}></Col> */}
      <Col span={12}>
        <FormItem form={form} name="startDate" label="Ngày bắt đầu" required>
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
            placeholder="Chọn ngày bắt đầu"
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="endDate" label="Ngày kết thúc" required>
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
            disabledDate={(current) => {
              const startTime = form.getFieldValue("startDate")
              if (!startTime) return false
              return current && current < dayjs(startTime).startOf("day")
            }}
            placeholder="Chọn ngày kết thúc"
          />
        </FormItem>
      </Col>

      <Col span={24}>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] gap-6">
          <div>
            <Form.Item label="Người ký quyết định giao đề tài" className="mb-0">
              <div className="flex gap-2">
                <Form.Item name="decisionMakerRole" noStyle>
                  <Select
                    className="w-24"
                    placeholder="PGĐ/GĐ"
                    options={[
                      { label: "PGĐ", value: "PGĐ" },
                      { label: "GĐ", value: "GĐ" },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="decisionMakerName" noStyle>
                  <Input placeholder="Nhập tên người ký quyết định giao đề tài" />
                </Form.Item>
              </div>
            </Form.Item>
            <FormItem form={form} name="decisionNumber" label="Số quyết định giao đề tài">
              <Input placeholder="5663/QĐ-HV" />
            </FormItem>
            <FormItem form={form} name="decisionDate" label="Ngày quyết định giao đề tài">
              <DatePicker
                format={{
                  format: "DD/MM/YYYY",
                  type: "mask",
                }}
                className="w-full"
                placeholder="Chọn ngày quyết định giao đề tài"
              />
            </FormItem>
            <FormItem form={form} name="proposalReport" label="Tờ trình đề tài">
              <Input placeholder="số 906/TTr-SĐH ngày 07/10/2024" />
            </FormItem>
          </div>

          <div className="hidden xl:block w-px bg-gray-200 min-h-full self-stretch" />

          <div>
            <Form.Item
              label="Người ký quyết định thành lập hội đồng bảo vệ luận văn đề án"
              className="mb-0"
            >
              <div className="flex gap-2">
                <Form.Item name="defenseDecisionMakerRole" noStyle>
                  <Select
                    className="w-24"
                    placeholder="PGĐ/GĐ"
                    options={[
                      { label: "PGĐ", value: "PGĐ" },
                      { label: "GĐ", value: "GĐ" },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="defenseDecisionMakerName" noStyle>
                  <Input placeholder="Nhập tên người ký quyết định thành lập hội đồng bảo vệ luận văn đề án" />
                </Form.Item>
              </div>
            </Form.Item>
            <FormItem
              form={form}
              name="defenseDecisionNumber"
              label="Số quyết định thành lập hội đồng bảo vệ luận văn đề án"
            >
              <Input placeholder="2954/QĐ-HV" />
            </FormItem>
            <FormItem
              form={form}
              name="defenseDecisionDate"
              label="Ngày quyết định thành lập hội đồng bảo vệ luận văn đề án"
            >
              <DatePicker
                format={{
                  format: "DD/MM/YYYY",
                  type: "mask",
                }}
                className="w-full"
                placeholder="Chọn ngày quyết định thành lập hội đồng bảo vệ luận văn đề án"
              />
            </FormItem>
            <FormItem form={form} name="councilReport" label="Tờ trình hội đồng">
              <Input placeholder="số 406/TTr-SĐH ngày 30/5/2025" />
            </FormItem>
          </div>
        </div>
      </Col>
      <Col span={8}>
        <FormItem form={form} name="chief" label="Trưởng phòng sau đại học">
          <Input placeholder="Nhập trưởng phòng sau đại học" />
        </FormItem>
      </Col>
      <Col span={8}>
        <FormItem form={form} name="deputy" label="Phó trưởng phòng sau đại học">
          <Input placeholder="Nhập phó trưởng phòng sau đại học" />
        </FormItem>
      </Col>

      <Col span={8}>
        <FormItem form={form} name="configPaymentSessionId" label="Định mức thanh toán">
          <Select
            allowClear
            placeholder="Chọn định mức thanh toán"
            options={paymentConfigs.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutThesisSession
