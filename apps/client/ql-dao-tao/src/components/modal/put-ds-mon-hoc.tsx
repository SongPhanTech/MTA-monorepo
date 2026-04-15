import DeleteIcon from "@components/icons/delete"
import Select from "@components/commons/select"
import TreeSelect from "@components/commons/tree-select"
import { SUBJECT_CLASS_SCHEDULE_TYPE } from "@constants/constants"
import { useExamTypeOptions } from "@hooks/examType"
import useSpinner from "@hooks/spinner"
import {
  useCreateSubjectClass,
  useFindManyBuilding,
  useFindManySemester,
  useFindManySubjectVersion,
  useFindManyTrainingLocation,
  useFindUniqueSubjectClass,
  useUpdateSubjectClass,
  useDeleteSubjectClass,
  useFindManyLecturer,
  useFindManyDM_DonVi,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Typography,
  message,
} from "antd"
import dayjs, { type Dayjs } from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Text } = Typography

type DisclosurePayload = {
  id?: string
  thesisExpert?: boolean
  mode?: "create" | "edit"
  trainingObjectTypeId?: string
  semesterId?: string
}

type EditFormValues = {
  semesterId?: string
  subjectId?: string
  schedule?: string
  trainingLocationId?: string
  roomId?: string
  maxStudent?: number
  code: string
  name: string
  examType?: string
  examDate?: Dayjs
  mainLecturerId: string
  extraLecturerId?: string
  enterGradeLecturerId: string
  managementOrganizationId?: string
}

export default function PutSubjectClassModal() {
  const { can } = useAbility()
  const { options: examTypeOptions } = useExamTypeOptions()
  const { showSpinner, hideSpinner } = useSpinner()
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [form] = Form.useForm<EditFormValues>()

  const { isOpen, onClose, input } = useDisclosure<DisclosurePayload>({
    tag: "PutSubjectClassModal",
  })
  const isCreateMode = input?.mode === "create"
  const trainingLocationId = Form.useWatch("trainingLocationId", form)

  useEffect(() => {
    if (isOpen && input?.id && !isCreateMode) {
      setCurrentId(input.id)
    } else {
      setCurrentId(null)
      form.resetFields()

      if (isOpen && isCreateMode) {
        form.setFieldsValue({
          semesterId: input?.semesterId,
          maxStudent: 60,
        })
      }
    }
  }, [isOpen, input, isCreateMode, form])

  const { data: record, refetch } = useFindUniqueSubjectClass(
    {
      where: { id: currentId! },
      include: {
        room: {
          include: {
            building: {
              include: {
                trainingLocation: true,
              },
            },
          },
        },
        subject: {
          include: { managementOrganization: true },
        },
        semester: true,
        mainLecturer: {
          include: { userProfile: { select: { fullname: true, code: true } } },
        },
        extraLecturer: {
          include: { userProfile: { select: { fullname: true, code: true } } },
        },
        enterGradeLecturer: {
          include: { userProfile: { select: { fullname: true, code: true } } },
        },
      },
    },
    { enabled: !!currentId && !isCreateMode }
  )

  const { data: semesters = [] } = useFindManySemester({
    include: { schoolYear: { select: { name: true } } },
    orderBy: { startDate: "desc" },
  })

  const { data: subjectVersions = [] } = useFindManySubjectVersion(
    {
      where: {
        active: true,
        ...(input?.trainingObjectTypeId
          ? { trainingObjectTypeId: input.trainingObjectTypeId }
          : {}),
      },
      orderBy: { name: "asc" },
    },
    {
      enabled: !isCreateMode || !!input?.trainingObjectTypeId,
    }
  )

  const { data: trainingLocations = [] } = useFindManyTrainingLocation({
    where: { active: true },
  })

  const { data: buildings = [] } = useFindManyBuilding({
    orderBy: { name: "asc" },
    where: { deletedAt: null, active: true, trainingLocationId },
    include: {
      rooms: {
        where: {
          deletedAt: null,
          active: true,
        },
      },
    },
  })

  const { data: lecturers = [] } = useFindManyLecturer({
    include: { userProfile: { select: { fullname: true, code: true } } },
    orderBy: { userProfile: { fullname: "asc" } },
  })

  const { data: donVis = [] } = useFindManyDM_DonVi({
    orderBy: { sTen: "asc" },
  })

  const { mutateAsync: createSubjectClass } = useCreateSubjectClass()
  const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
  const { mutateAsync: deleteSubjectClass } = useDeleteSubjectClass()

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        semesterId: record.semesterId ?? undefined,
        subjectId: record.subjectId ?? undefined,
        schedule: record.schedule ?? undefined,
        trainingLocationId: record.room?.building?.trainingLocation?.id ?? undefined,
        roomId: record.roomId ?? undefined,
        maxStudent: record.maxStudent ?? undefined,
        code: record.code ?? "",
        name: record.name ?? "",
        examType: record.examType ?? undefined,
        examDate: record.examDate ? dayjs(record.examDate) : undefined,
        mainLecturerId: record.lecturerId ?? record.mainLecturer?.id ?? undefined,
        extraLecturerId: record.extraLecturerId ?? record.extraLecturer?.id ?? undefined,
        enterGradeLecturerId:
          record.enterGradeLecturerId ?? record.enterGradeLecturer?.id ?? undefined,
        managementOrganizationId: record.subject?.managementOrganization?.Id ?? undefined,
      })
    }
  }, [record, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      showSpinner()

      if (isCreateMode) {
        if (!input?.trainingObjectTypeId) {
          message.warning("Không tìm thấy đối tượng đào tạo để tạo lớp môn học")
          return
        }

        await createSubjectClass({
          data: {
            code: values.code,
            name: values.name,
            maxStudent: values.maxStudent ?? 60,
            type: "NORMAL",
            status: "OFFICIAL",
            subjectId: values.subjectId ?? "",
            semesterId: values.semesterId ?? "",
            trainingObjectTypeId: input.trainingObjectTypeId,
            schedule: (values.schedule as any) ?? null,
            roomId: values.roomId ?? null,
            trainingLocationId: values.trainingLocationId ?? null,
            lecturerId: values.mainLecturerId ?? null,
            extraLecturerId: values.extraLecturerId ?? null,
            enterGradeLecturerId: values.enterGradeLecturerId ?? null,
            examType: (values.examType as any) ?? "OfflineWritten",
            examDate: values.examDate ? values.examDate.toDate() : null,
          },
        })
        message.success("Tạo lớp môn học thành công")
      } else {
        await updateSubjectClass({
          where: { id: currentId! },
          data: {
            code: values.code,
            name: values.name,
            maxStudent: values.maxStudent ?? undefined,
            schedule: (values.schedule as any) ?? undefined,
            roomId: values.roomId ?? undefined,
            trainingLocationId: values.trainingLocationId ?? undefined,
            lecturerId: values.mainLecturerId ?? null,
            extraLecturerId: values.extraLecturerId ?? null,
            enterGradeLecturerId: values.enterGradeLecturerId ?? null,
            examType: (values.examType as any) ?? undefined,
            examDate: values.examDate ? values.examDate.toDate() : null,
            semesterId: values.semesterId ?? undefined,
            subjectId: values.subjectId ?? undefined,
          },
        })
        message.success("Cập nhật lớp môn học thành công")
      }

      refetch()
      onClose()
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message
      if (msg) message.error(`Cập nhật thất bại: ${msg}`)
    } finally {
      hideSpinner()
    }
  }

  const handleDelete = async () => {
    try {
      showSpinner()
      await deleteSubjectClass({ where: { id: currentId! } })
      message.success("Xoá lớp môn học thành công")
      onClose()
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message
      message.error(msg ? `Xoá thất bại: ${msg}` : "Xoá thất bại")
    } finally {
      hideSpinner()
    }
  }

  const lecturerOptions = lecturers.map((l) => ({
    value: l.id,
    label: `${l.userProfile?.code} - ${l.userProfile?.fullname}`,
  }))

  const semesterOptions = semesters.map((s) => ({
    value: s.id,
    label: [s.name].filter(Boolean).join(" - "),
  }))

  const subjectOptions = subjectVersions.map((s) => ({
    value: s.id,
    label: [s.code, s.name].filter(Boolean).join(" - "),
  }))

  const trainingLocationOptions = trainingLocations.map((item) => ({
    label: item.name,
    value: item.id,
  }))

  const organizationOptions = donVis.map((o) => ({
    value: o.Id,
    label: o.sTen ?? o.sMa ?? o.Id,
  }))

  const canDelete = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC, "XOA")

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={<Text strong>{isCreateMode ? "Thêm mới lớp môn học" : "Chỉnh sửa lớp môn học"}</Text>}
      footer={
        <Row justify="space-between" align="middle">
          <Col>
            {!isCreateMode && canDelete && (
              <DeleteIcon
                popConfirm={{
                  title: "Xác nhận xoá lớp môn học này?",
                  onConfirm: handleDelete,
                }}
              />
            )}
          </Col>
          <Col>
            <Space>
              <Button onClick={onClose}>Huỷ</Button>
              <Button type="primary" onClick={handleSave}>
                Lưu
              </Button>
            </Space>
          </Col>
        </Row>
      }
      width={1600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="Học kỳ"
              name="semesterId"
              rules={[{ required: true, message: "Vui lòng chọn học kỳ" }]}
            >
              <Select options={semesterOptions} placeholder="Chọn học kỳ" showSearch allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Môn học"
              name="subjectId"
              rules={[{ required: true, message: "Vui lòng chọn môn học" }]}
            >
              <Select options={subjectOptions} placeholder="Chọn môn học" showSearch allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Kíp học" name="schedule">
              <Select
                placeholder="Chọn kíp học"
                options={Object.entries(SUBJECT_CLASS_SCHEDULE_TYPE).map(([key, value_]) => ({
                  label: value_,
                  value: key,
                }))}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Số SV tối đa" name="maxStudent">
              <InputNumber min={1} step={1} className="w-full" placeholder="Nhập số SV tối đa" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Mã lớp"
              name="code"
              rules={[{ required: true, message: "Vui lòng nhập mã lớp" }]}
            >
              <Input placeholder="Nhập mã lớp" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Tên lớp"
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập tên lớp" }]}
            >
              <Input placeholder="Nhập tên lớp" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Địa điểm" name="trainingLocationId">
              <Select
                options={trainingLocationOptions}
                placeholder="Chọn địa điểm"
                onChange={() => {
                  form.setFieldsValue({ roomId: undefined })
                }}
                showSearch
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Phòng học" name="roomId">
              <TreeSelect
                treeData={buildings.map((e) => ({
                  label: e.name,
                  value: e.id,
                  selectable: false,
                  children: e.rooms.map((room) => ({
                    label: room.name,
                    value: room.id,
                    selectable: true,
                  })),
                }))}
                showSearch
                allowClear
                treeNodeFilterProp="title"
                multiple={false}
                showCheckedStrategy="SHOW_CHILD"
                dropdownStyle={{
                  width: 400,
                  maxHeight: 400,
                }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Giảng viên 1"
              name="mainLecturerId"
              rules={[{ required: true, message: "Vui lòng chọn giảng viên" }]}
            >
              <Select
                options={lecturerOptions}
                placeholder="Chọn giảng viên 1"
                showSearch
                allowClear
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Giảng viên 2" name="extraLecturerId">
              <Select
                options={lecturerOptions}
                placeholder="Chọn giảng viên 2"
                showSearch
                allowClear
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Giảng viên nhập điểm" name="enterGradeLecturerId">
              <Select
                options={lecturerOptions}
                placeholder="Chọn giảng viên nhập điểm"
                showSearch
                allowClear
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Ngày thi" name="examDate">
              <DatePicker className="w-full" placeholder="DD/MM/YYYY" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Hình thức thi" name="examType">
              <Select options={examTypeOptions} placeholder="Chọn hình thức thi" allowClear />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Đơn vị phụ trách"
              name="managementOrganizationId"
              rules={
                isCreateMode ? [] : [{ required: true, message: "Vui lòng chọn đơn vị phụ trách" }]
              }
            >
              <Select
                options={organizationOptions}
                placeholder="Chọn đơn vị phụ trách"
                showSearch
                allowClear
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}
