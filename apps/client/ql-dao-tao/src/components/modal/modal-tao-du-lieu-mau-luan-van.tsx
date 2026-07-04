import useSpinner from "@hooks/spinner"
import { ThesisType } from "@workspace/db/client"
import { createSampleThesisData } from "@workspace/libs/api/thesis"
import { Button, Flex, Modal, Table, Typography, message } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Text } = Typography

export type TaoDuLieuMauStudentRow = {
  id: string
  code?: string | null
  userProfile?: { fullname?: string | null; dateOfBirth?: string | Date | null } | null
  fixedClass?: { name?: string | null } | null
  thesisRegistrations?: Array<{
    deletedAt?: Date | string | null
    thesisProject?: {
      deletedAt?: Date | string | null
      thesisType?: ThesisType | null
      thesisSessionId?: string | null
      title?: string | null
    } | null
  }> | null
}

export type ModalTaoDuLieuMauLuanVanInput = {
  thesisSessionId: string
  students: TaoDuLieuMauStudentRow[]
  onSuccess?: () => void | Promise<void>
}

export function studentHasThesisInSession(
  student: TaoDuLieuMauStudentRow,
  thesisSessionId: string
) {
  return student.thesisRegistrations?.some((registration) => {
    if (registration?.deletedAt) return false
    const project = registration.thesisProject
    if (!project || project.deletedAt) return false
    return project.thesisType === ThesisType.THESIS && project.thesisSessionId === thesisSessionId
  })
}

const ModalTaoDuLieuMauLuanVan = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [tablePage, setTablePage] = useState(1)
  const [tablePageSize, setTablePageSize] = useState(10)

  const { isOpen, onClose, input } = useDisclosure<ModalTaoDuLieuMauLuanVanInput>({
    tag: "ModalTaoDuLieuMauLuanVan",
  })

  const thesisSessionId = input?.thesisSessionId ?? ""
  const students = input?.students ?? []

  const { showSpinner, hideSpinner } = useSpinner()

  useEffect(() => {
    if (!isOpen) {
      setSelectedRowKeys([])
      setTablePage(1)
      setTablePageSize(10)
    }
  }, [isOpen])

  const eligibleCount = useMemo(
    () => students.filter((s) => !studentHasThesisInSession(s, thesisSessionId)).length,
    [students, thesisSessionId]
  )

  const existingCount = students.length - eligibleCount

  const handleCreate = async () => {
    if (!thesisSessionId) {
      message.warning("Không xác định được đợt luận văn.")
      return
    }
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một sinh viên.")
      return
    }

    const selectedStudents = students.filter((s) => selectedRowKeys.includes(s.id))
    const invalid = selectedStudents.filter((s) => studentHasThesisInSession(s, thesisSessionId))
    if (invalid.length > 0) {
      message.error("Không thể tạo cho sinh viên đã có luận văn/đề án trong đợt.")
      return
    }

    try {
      showSpinner()
      const response = await createSampleThesisData({
        thesisSessionId,
        studentIds: selectedStudents.map((s) => s.id),
      })
      if (response.status !== 200) {
        message.error(
          "message" in response.data
            ? response.data.message
            : "Đã xảy ra lỗi trong lúc tạo dữ liệu mẫu."
        )
        return
      }
      message.success(`Đã tạo dữ liệu mẫu cho ${response.data.createdCount} sinh viên.`)
      await input?.onSuccess?.()
      onClose()
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi trong lúc tạo dữ liệu mẫu.")
    } finally {
      hideSpinner()
    }
  }

  const columns = useMemo<ColumnsType<TaoDuLieuMauStudentRow>>(
    () => [
      {
        title: "STT",
        width: 60,
        align: "center",
        render: (_, __, index) => (tablePage - 1) * tablePageSize + index + 1,
      },
      {
        title: "Mã HV",
        width: 100,
        render: (_, record) => record.code ?? "—",
      },
      {
        title: "Họ và tên",
        ellipsis: true,
        render: (_, record) => record.userProfile?.fullname ?? "—",
      },
      {
        title: "Lớp quản lí",
        width: 220,
        ellipsis: true,
        render: (_, record) => record.fixedClass?.name ?? "—",
      },
      {
        title: "Ngày sinh",
        width: 110,
        render: (_, record) => {
          const dob = record.userProfile?.dateOfBirth
          return dob ? dayjs(dob).format("DD/MM/YYYY") : "—"
        },
      },
    ],
    [tablePage, tablePageSize]
  )

  return (
    <Modal
      title="Tạo dữ liệu mẫu luận văn/đề án"
      open={isOpen}
      onCancel={onClose}
      width={960}
      maskClosable={false}
      destroyOnClose
      footer={
        <Flex justify="space-between" align="center" className="w-full">
          <Text type="secondary" className="text-xs">
            Đã chọn {selectedRowKeys.length} / {eligibleCount} sinh viên có thể tạo
          </Text>
          <Flex gap={8}>
            <Button onClick={onClose}>Hủy</Button>
            <Button type="primary" onClick={handleCreate} disabled={selectedRowKeys.length === 0}>
              Tạo dữ liệu mẫu
            </Button>
          </Flex>
        </Flex>
      }
    >
      <Flex vertical gap={12}>
        <Flex wrap="wrap" gap={8} align="center">
          <Text type="secondary">
            Tổng {students.length} sinh viên · {eligibleCount} có thể tạo · {existingCount} đã có dữ
            liệu
          </Text>
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <span className="inline-block w-4 h-4 rounded bg-[#e6f4ff] border border-[#91caff]" />
            Dòng xanh = đã có luận văn/đề án (không chọn được)
          </span>
        </Flex>

        <Table<TaoDuLieuMauStudentRow>
          rowKey="id"
          dataSource={students}
          columns={columns}
          size="small"
          bordered
          scroll={{ y: 420 }}
          pagination={{
            current: tablePage,
            pageSize: tablePageSize,
            showTotal: (total) => `Tổng ${total} sinh viên`,
            onChange: (page, size) => {
              setTablePage(page)
              setTablePageSize(size)
            },
          }}
          rowClassName={(record) =>
            studentHasThesisInSession(record, thesisSessionId) ? "tao-mau-lv-row-existing" : ""
          }
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
            getCheckboxProps: (record) => ({
              disabled: studentHasThesisInSession(record, thesisSessionId),
            }),
            selections: [
              {
                key: "select-eligible",
                text: "Chọn tất cả có thể tạo",
                onSelect: () => {
                  setSelectedRowKeys(
                    students
                      .filter((s) => !studentHasThesisInSession(s, thesisSessionId))
                      .map((s) => s.id)
                  )
                },
              },
              Table.SELECTION_NONE,
            ],
          }}
        />
      </Flex>

      <style jsx global>{`
        .tao-mau-lv-row-existing td {
          background-color: #e6f4ff !important;
        }
        .tao-mau-lv-row-existing:hover td {
          background-color: #bae0ff !important;
        }
      `}</style>
    </Modal>
  )
}

export default ModalTaoDuLieuMauLuanVan
