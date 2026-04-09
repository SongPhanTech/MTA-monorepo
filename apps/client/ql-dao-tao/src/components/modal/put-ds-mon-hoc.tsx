import DeleteIcon from "@components/icons/delete"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import {
  useFindUniqueSubjectClass,
  useUpdateSubjectClass,
  useDeleteSubjectClass,
  useFindManyLecturer,
  useFindManyDM_DonVi,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Form, Input, Modal, Row, Space, Typography, message } from "antd"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Text } = Typography

type DisclosurePayload = {
  id: string
  thesisExpert: boolean
}

type EditFormValues = {
  code: string
  name: string
  mainLecturerId: string
  enterGradeLecturerId: string
  managementOrganizationId: string
}

export default function PutSubjectClassModal() {
  const { can } = useAbility()
  const { showSpinner, hideSpinner } = useSpinner()
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [form] = Form.useForm<EditFormValues>()

  const { isOpen, onClose, input } = useDisclosure<DisclosurePayload>({
    tag: "PutSubjectClassModal",
  })

  useEffect(() => {
    if (isOpen && input?.id) {
      setCurrentId(input.id)
    } else {
      setCurrentId(null)
      form.resetFields()
    }
  }, [isOpen, input])

  const { data: record, refetch } = useFindUniqueSubjectClass(
    {
      where: { id: currentId! },
      include: {
        subject: {
          include: { managementOrganization: true },
        },
        mainLecturer: {
          include: { userProfile: { select: { fullname: true, code: true } } },
        },
        enterGradeLecturer: {
          include: { userProfile: { select: { fullname: true, code: true } } },
        },
      },
    },
    { enabled: !!currentId }
  )

  const { data: lecturers = [] } = useFindManyLecturer({
    include: { userProfile: { select: { fullname: true, code: true } } },
    orderBy: { userProfile: { fullname: "asc" } },
  })

  const { data: donVis = [] } = useFindManyDM_DonVi({
    orderBy: { sTen: "asc" },
  })

  const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
  const { mutateAsync: deleteSubjectClass } = useDeleteSubjectClass()

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        code: record.code ?? "",
        name: record.name ?? "",
        mainLecturerId: record.mainLecturer?.id ?? undefined,
        enterGradeLecturerId: record.enterGradeLecturer?.id ?? undefined,
        managementOrganizationId: record.subject?.managementOrganization?.Id ?? undefined,
      })
    }
  }, [record, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      showSpinner()
      await updateSubjectClass({
        where: { id: currentId! },
        data: {
          code: values.code,
          name: values.name,
          mainLecturer: { connect: { id: values.mainLecturerId } },
          enterGradeLecturer: values.enterGradeLecturerId
            ? { connect: { id: values.enterGradeLecturerId } }
            : undefined,
          subject: {
            update: {
              managementOrganization: {
                connect: { Id: values.managementOrganizationId },
              },
            },
          },
        },
      })
      message.success("Cập nhật lớp môn học thành công")
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

  const organizationOptions = donVis.map((o) => ({
    value: o.Id,
    label: o.sTen ?? o.sMa ?? o.Id,
  }))

  const canDelete = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC, "XOA")

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={<Text strong>Chỉnh sửa lớp môn học</Text>}
      footer={
        <Row justify="space-between" align="middle">
          <Col>
            {canDelete && (
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
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Mã lớp"
              name="code"
              rules={[{ required: true, message: "Vui lòng nhập mã lớp" }]}
            >
              <Input placeholder="Nhập mã lớp" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Tên lớp"
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập tên lớp" }]}
            >
              <Input placeholder="Nhập tên lớp" />
            </Form.Item>
          </Col>
          <Col span={12}>
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
          <Col span={12}>
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
          <Col span={24}>
            <Form.Item
              label="Đơn vị phụ trách"
              name="managementOrganizationId"
              rules={[{ required: true, message: "Vui lòng chọn đơn vị phụ trách" }]}
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
