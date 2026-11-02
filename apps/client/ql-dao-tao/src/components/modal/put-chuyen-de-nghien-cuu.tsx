import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import {
  useFindManyDM_DonVi,
  useFindManyExpert,
  useFindUniqueStudentResearchTopic,
  useUpdateStudentResearchTopic,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Row, Select } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import DatePicker from "@components/commons/date-picker"
import TreeSelect from "@components/commons/tree-select"
import type { StudentResearchTopic } from "@workspace/db/client"
import { FormItem } from "@workspace/ui"
import { useEffect, useMemo } from "react"
import { getSupervisorName } from "@pages/quan-ly-luan-van/dm-luan-van"
import { fuzzyMatch } from "@workspace/libs/utils"
import { flattenExpertForSelect } from "@/utils/expert-select"
import { buildOrgTree } from "@lib/utils"
import { whereActiveOrganization } from "@workspace/libs/org-tree"

dayjs.locale("vi")
const { TextArea } = Input
type PutResearchTopicForm = {
  score: string
  studentFullname?: string | null
  studentCode?: string | null
  studentDateOfBirth?: Date | null
  managementOrganizationId?: string | null
  /** Expert.id — save resolve → *VersionId */
  supervisorId?: string | null
  coSupervisorId?: string | null
} & Omit<StudentResearchTopic, "supervisorId" | "coSupervisorId">

const PutResearchTopicModal = () => {
  const [form] = Form.useForm<PutResearchTopicForm>()
  const { isOpen, onClose, input } = useDisclosure<{
    studentResearchTopicId: string
    role: "P7" | "KHOA_BO_MON"
  }>({
    tag: "PutResearchTopicModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { data: experts = [] } = useFindManyExpert({
    where: {
      deletedAt: null,
      active: true,
      OR: [{ lecturerId: null }, { lecturer: { active: true } }],
    },
    include: {
      currentVersion: {
        include: {
          academicDegreeType: true,
          academicRankType: true,
        },
      },
      lecturer: {
        select: {
          userProfile: {
            include: {
              academicRankType: true,
              academicDegreeType: true,
            },
          },
        },
      },
    },
  })

  const { data: organizationData = [] } = useFindManyDM_DonVi({
    where: whereActiveOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const treeOrgData = useMemo(() => buildOrgTree(organizationData ?? [], "0"), [organizationData])

  const expertFlat = useMemo(() => experts.map(flattenExpertForSelect), [experts])

  const { data: studentResearchTopic } = useFindUniqueStudentResearchTopic(
    {
      where: { id: input?.studentResearchTopicId },
      include: {
        supervisor: {
          include: {
            academicDegreeType: true,
            academicRankType: true,
            expert: {
              include: {
                lecturer: {
                  select: {
                    userProfile: true,
                  },
                },
              },
            },
          },
        },
        coSupervisor: {
          include: {
            academicDegreeType: true,
            academicRankType: true,
            expert: {
              include: {
                lecturer: {
                  select: {
                    userProfile: true,
                  },
                },
              },
            },
          },
        },
        studentSubjectScore: {
          include: {
            student: {
              select: {
                userProfile: true,
              },
            },
            subjectVersion: {
              include: {
                managementOrganization: true,
                subject: {
                  select: {
                    managementOrganizationId: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      enabled: !!input?.studentResearchTopicId,
    }
  )

  const { mutateAsync: updateStudentResearchTopic } = useUpdateStudentResearchTopic()

  const versionId = (expertId?: string | null) => {
    const found = experts.find((e) => e.id === expertId)
    return found?.currentVersionId ?? found?.currentVersion?.id ?? null
  }

  async function onOk(values: PutResearchTopicForm) {
    try {
      showSpinner()
      if (input?.studentResearchTopicId) {
        const score = values.score ? Number(values.score) : null
        const supervisorVersionId = versionId(values.supervisorId)
        const coSupervisorVersionId = versionId(values.coSupervisorId)

        await updateStudentResearchTopic({
          where: { id: input?.studentResearchTopicId },
          data: {
            name: values.name,
            mainContent: values.mainContent,
            ...(supervisorVersionId
              ? { supervisor: { connect: { id: supervisorVersionId } } }
              : { supervisor: { disconnect: true } }),
            ...(coSupervisorVersionId
              ? { coSupervisor: { connect: { id: coSupervisorVersionId } } }
              : { coSupervisor: { disconnect: true } }),
            reportDate: values.reportDate,
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
    if (input?.studentResearchTopicId) {
      const subjectVersion = studentResearchTopic?.studentSubjectScore?.subjectVersion
      form.setFieldsValue({
        name: studentResearchTopic?.name ?? "",
        mainContent: studentResearchTopic?.mainContent ?? "",
        supervisorId: studentResearchTopic?.supervisor?.expertId ?? undefined,
        coSupervisorId: studentResearchTopic?.coSupervisor?.expertId ?? undefined,
        reportDate: studentResearchTopic?.reportDate
          ? dayjs(studentResearchTopic?.reportDate)
          : undefined,
        deadline: studentResearchTopic?.deadline
          ? dayjs(studentResearchTopic?.deadline)
          : undefined,
        score: studentResearchTopic?.studentSubjectScore?.finalScore?.toString() ?? "",
        studentFullname: studentResearchTopic?.studentSubjectScore?.student?.userProfile?.fullname,
        studentCode: studentResearchTopic?.studentSubjectScore?.student?.userProfile?.code,
        studentDateOfBirth: studentResearchTopic?.studentSubjectScore?.student?.userProfile
          ?.dateOfBirth
          ? dayjs(
              studentResearchTopic?.studentSubjectScore?.student?.userProfile?.dateOfBirth
            ).format("DD/MM/YYYY")
          : undefined,
        managementOrganizationId:
          subjectVersion?.managementOrganizationId ||
          subjectVersion?.subject?.managementOrganizationId ||
          undefined,
      })
    }
  }, [input?.studentResearchTopicId, studentResearchTopic, form])

  const expertOptions = expertFlat.map((item) => ({
    label: getSupervisorName(item, true, true),
    value: item.id,
    searchString: getSupervisorName(item, false, true) as string,
  }))
  const filterExpertOption = (inputValue: string, option?: { searchString?: string }) =>
    fuzzyMatch(inputValue, String(option?.searchString ?? ""))

  return (
    <PutFormModal
      open={isOpen}
      onFinish={onOk}
      form={form}
      onCancel={onClose}
      maskClosable={true}
      title={
        input?.studentResearchTopicId
          ? "Chỉnh sửa chuyên đề nghiên cứu"
          : "Thêm mới chuyên đề nghiên cứu"
      }
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
          <FormItem form={form} name="name" label="Tên chuyên đề" required>
            <TextArea placeholder="Nhập tên chuyên đề" autoSize={{ minRows: 2, maxRows: 6 }} />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="mainContent" label="Nội dung chính của chuyên đề" required>
            <TextArea
              placeholder="Nhập nội dung chính của chuyên đề"
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          </FormItem>
        </Col>

        <Col span={12}>
          <FormItem form={form} name="supervisorId" label="Hướng dẫn 1" required>
            <Select
              placeholder="Chọn giảng viên hướng dẫn"
              options={expertOptions}
              showSearch
              filterOption={filterExpertOption}
              allowClear
            />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="coSupervisorId" label="Hướng dẫn 2">
            <Select
              placeholder="Chọn giảng viên hướng dẫn"
              options={expertOptions}
              showSearch
              filterOption={filterExpertOption}
              allowClear
            />
          </FormItem>
        </Col>
        <Col span={24}>
          <FormItem form={form} name="managementOrganizationId" label="Đơn vị quản lý">
            <TreeSelect
              placeholder="Chọn đơn vị quản lý"
              treeDefaultExpandAll
              treeData={treeOrgData}
              disabled
              className="w-full"
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
          <FormItem form={form} name="deadline" label="Hạn nhập chuyên đề">
            <DatePicker
              disabled={input?.role !== "P7"}
              format={{ format: "DD/MM/YYYY", type: "mask" }}
              className="w-full"
              placeholder="Chọn hạn nhập chuyên đề"
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

export default PutResearchTopicModal
