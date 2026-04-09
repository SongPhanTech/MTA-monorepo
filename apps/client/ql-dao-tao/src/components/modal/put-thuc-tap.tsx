import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import {
  useFindManyExpertProfile,
  useFindUniqueStudentInternship,
  useUpdateStudentInternship,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Row, Select } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import DatePicker from "@components/commons/date-picker"
import type { StudentInternship } from "@workspace/db/client"
import { FormItem } from "@workspace/ui"
import { useEffect } from "react"

dayjs.locale("vi")
const { TextArea } = Input
type PutInternshipForm = {
  score: string
  studentFullname?: string | null
  studentCode?: string | null
  studentDateOfBirth?: Date | null
} & StudentInternship

const PutInternshipModal = () => {
  const [form] = Form.useForm<PutInternshipForm>()
  const { isOpen, onClose, input } = useDisclosure<{
    studentInternshipId: string
    role: "P7" | "KHOA_BO_MON"
  }>({
    tag: "PutInternshipModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { data: expertProfile = [] } = useFindManyExpertProfile({
    include: {
      lecturer: {
        select: {
          code: true,
          userProfile: {
            include: {
              academicRankType: true,
              academicDegreeType: true,
            },
          },
        },
      },
      academicDegreeType: true,
      academicRankType: true,
    },
  })

  const { data: studentInternship } = useFindUniqueStudentInternship(
    {
      where: { id: input?.studentInternshipId },
      include: {
        supervisor: {
          include: {
            lecturer: {
              select: {
                userProfile: true,
              },
            },
          },
        },
        coSupervisor: {
          include: {
            lecturer: {
              select: {
                userProfile: true,
              },
            },
          },
        },
        studentSubjectScore: {
          include: {
            student: {
              select: {
                code: true,
                userProfile: true,
              },
            },
          },
        },
      },
    },
    {
      enabled: !!input?.studentInternshipId,
    }
  )

  const { mutateAsync: updateStudentInternship } = useUpdateStudentInternship()
  async function onOk(values: PutInternshipForm) {
    try {
      showSpinner()
      if (input?.studentInternshipId) {
        const score = values.score ? Number(values.score) : null

        await updateStudentInternship({
          where: { id: input?.studentInternshipId },
          data: {
            unit: values.unit,
            institution: values.institution,
            internshipContent: values.internshipContent,
            supervisor: {
              connect: { id: values.supervisorId ?? "" },
            },
            ...(values.coSupervisorId
              ? {
                  coSupervisor: { connect: { id: values.coSupervisorId } },
                }
              : {}),
            reportDate: values.reportDate,
            startDate: values.startDate,
            endDate: values.endDate,
            address: values.address,
            deadline: values.deadline,
            studentSubjectScore: {
              update: {
                attendanceScore: score,
                midtermScore: score,
                examScore: score,
                finalScore: score,
              },
            },
          },
        })
      }
      message.success("Cập nhật thành công")
      onClose()
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }
  useEffect(() => {
    if (input?.studentInternshipId) {
      form.setFieldsValue({
        unit: studentInternship?.unit ?? "",
        institution: studentInternship?.institution ?? "",
        internshipContent: studentInternship?.internshipContent ?? "",
        supervisorId: studentInternship?.supervisorId ?? undefined,
        coSupervisorId: studentInternship?.coSupervisorId ?? undefined,
        reportDate: studentInternship?.reportDate
          ? dayjs(studentInternship?.reportDate)
          : undefined,
        deadline: studentInternship?.deadline ? dayjs(studentInternship?.deadline) : undefined,
        startDate: studentInternship?.startDate ? dayjs(studentInternship?.startDate) : undefined,
        endDate: studentInternship?.endDate ? dayjs(studentInternship?.endDate) : undefined,
        address: studentInternship?.address ?? "",
        score: studentInternship?.studentSubjectScore?.finalScore?.toString() ?? "",
        studentFullname: studentInternship?.studentSubjectScore?.student?.userProfile?.fullname,
        studentCode: studentInternship?.studentSubjectScore?.student?.code,
        studentDateOfBirth: studentInternship?.studentSubjectScore?.student?.userProfile
          ?.dateOfBirth
          ? dayjs(studentInternship?.studentSubjectScore?.student?.userProfile?.dateOfBirth).format(
              "DD/MM/YYYY"
            )
          : undefined,
      })
    }
  }, [input?.studentInternshipId, studentInternship, form])
  return (
    <PutFormModal
      open={isOpen}
      onFinish={onOk}
      form={form}
      onCancel={onClose}
      maskClosable={true}
      title={input?.studentInternshipId ? "Chỉnh sửa môn thực tập" : "Thêm mới môn thực tập"}
      className="w-[60vw]"
    >
      <Row gutter={[8, 8]}>
        <Col span={8}>
          <FormItem form={form} name="studentCode" label="Mã HV/SV">
            <Input variant="outlined" disabled />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="studentFullname" label="Họ và tên">
            <Input variant="outlined" disabled />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="studentDateOfBirth" label="Ngày sinh">
            <Input variant="outlined" disabled />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="institution" label="Tên cơ sở">
            <TextArea placeholder="Nhập tên cơ sở" autoSize={{ minRows: 2, maxRows: 6 }} />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="unit" label="Tên đơn vị" required>
            <TextArea placeholder="Nhập tên đơn vị" autoSize={{ minRows: 2, maxRows: 6 }} />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="address" label="Địa chỉ thực tập" required>
            <TextArea placeholder="Nhập địa chỉ thực tập" autoSize={{ minRows: 2, maxRows: 6 }} />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem
            form={form}
            name="internshipContent"
            label="Nội dung chính của môn thực tập"
            required
          >
            <TextArea
              placeholder="Nhập nội dung chính của môn thực tập"
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          </FormItem>
        </Col>

        <Col span={12}>
          <FormItem form={form} name="supervisorId" label="Hướng dẫn 1" required>
            <Select
              placeholder="Chọn giảng viên hướng dẫn"
              options={expertProfile.map((item) => ({
                label: item.lecturer
                  ? [
                      item.lecturer?.userProfile.academicRankType?.sMa,
                      item.lecturer?.userProfile.academicDegreeType?.sMa,
                      item.lecturer?.userProfile.fullname,
                    ]
                      .filter(Boolean)
                      .join(". ")
                  : [item.academicRankType?.sMa, item.academicDegreeType?.sMa, item.name]
                      .filter(Boolean)
                      .join(". "),
                value: item.id,
              }))}
              showSearch
              filterOption={false}
              allowClear
            />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="coSupervisorId" label="Hướng dẫn 2">
            <Select
              placeholder="Chọn giảng viên hướng dẫn"
              options={expertProfile.map((item) => ({
                label: item.lecturer
                  ? [
                      item.lecturer?.userProfile.academicRankType?.sMa,
                      item.lecturer?.userProfile.academicDegreeType?.sMa,
                      item.lecturer?.userProfile.fullname,
                    ]
                      .filter(Boolean)
                      .join(". ")
                  : [item.academicRankType?.sMa, item.academicDegreeType?.sMa, item.name]
                      .filter(Boolean)
                      .join(". "),
                value: item.id,
              }))}
              showSearch
              filterOption={false}
              allowClear
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="startDate" label="Thời gian bắt đầu thực tập">
            <DatePicker
              format={{ format: "DD/MM/YYYY", type: "mask" }}
              className="w-full"
              placeholder="Chọn ngày bắt đầu thực tập`"
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="endDate" label="Thời gian kết thúc thực tập">
            <DatePicker
              format={{ format: "DD/MM/YYYY", type: "mask" }}
              className="w-full"
              placeholder="Chọn ngày kết thúc thực tập"
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="reportDate" label="Thời gian báo cáo">
            <DatePicker
              format={{ format: "DD/MM/YYYY", type: "mask" }}
              className="w-full"
              placeholder="Chọn ngày báo cáo"
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="deadline" label="Hạn nhập thực tập">
            <DatePicker
              disabled={input?.role !== "P7"}
              format={{ format: "DD/MM/YYYY", type: "mask" }}
              className="w-full"
              placeholder="Chọn hạn nhập thực tập"
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="score" label="Điểm số">
            <InputNumber disabled min={0} max={10} step={0.1} className="w-full" />
          </FormItem>
        </Col>
      </Row>
    </PutFormModal>
  )
}

export default PutInternshipModal
