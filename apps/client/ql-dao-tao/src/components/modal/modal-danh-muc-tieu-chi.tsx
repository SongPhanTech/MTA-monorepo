import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import useSpinner from "@hooks/spinner"
import { type CriteriaCalcType, criteriaCalcTypeLabels } from "@workspace/libs/criteria-calc"
import {
  useDeleteCriteriaDefinition,
  useFindManyCriteriaDefinition,
} from "@workspace/db/hooks"
import { Button, Flex, Modal, message, Table, Tag, Tooltip } from "antd"
import { BookPlus } from "lucide-react"
import { useDisclosure } from "react-hook-disclosure-modal"

/** Danh mục tiêu chí tự định nghĩa (CUSTOM) dùng trong bộ quy tắc hạ bậc */
const ModalCriteriaDefinition = () => {
  const { isOpen, onClose } = useDisclosure({ tag: "ModalCriteriaDefinition" })
  const { onOpen: openPutCriteria } = useDisclosure<{ id?: string }>({
    tag: "PutCriteriaDefinition",
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: deleteCriteria } = useDeleteCriteriaDefinition()

  const { data = [] } = useFindManyCriteriaDefinition(
    {
      where: { source: "CUSTOM" },
      include: {
        trainingBlocks: { select: { name: true } },
        subjects: { select: { name: true } },
        _count: { select: { downgradeConditions: true } },
      },
      orderBy: { createdAt: "desc" },
    },
    { enabled: isOpen }
  )

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await deleteCriteria({ where: { id } })
      message.success("Xóa bản ghi thành công")
    } catch (error: any) {
      message.error(error?.info?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1100}
      style={{ top: 10 }}
      title="Danh mục tiêu chí tự định nghĩa"
    >
      <Flex justify="space-between" align="center" className="mb-3">
        <span className="text-gray-500">
          Hệ thống tự tính giá trị các tiêu chí này cho từng sinh viên khi xét tốt nghiệp.
        </span>
        <Button type="primary" onClick={() => openPutCriteria({})}>
          <BookPlus />
          Thêm mới
        </Button>
      </Flex>
      <Table
        rowKey="id"
        size="small"
        dataSource={data}
        pagination={{ hideOnSinglePage: true, pageSize: 20 }}
        columns={[
          { title: "Mã", dataIndex: "code", width: 180 },
          { title: "Tên tiêu chí", dataIndex: "name" },
          {
            title: "Kiểu tính",
            dataIndex: "calcType",
            width: 200,
            render: (value: string) =>
              criteriaCalcTypeLabels[value as CriteriaCalcType] ?? (
                <Tag color="red">Không hỗ trợ: {value}</Tag>
              ),
          },
          {
            title: "Phạm vi",
            width: 220,
            render: (_, record) => {
              const names = [
                ...record.trainingBlocks.map((item) => item.name),
                ...record.subjects.map((item) => item.name),
              ]
              if (!names.length) return <span className="text-gray-400">Toàn bộ CTĐT</span>
              return (
                <Tooltip title={names.join(", ")}>
                  <div className="line-clamp-2">{names.join(", ")}</div>
                </Tooltip>
              )
            },
          },
          {
            title: "Trạng thái",
            dataIndex: "active",
            width: 130,
            align: "center",
            render: (active: boolean) =>
              active ? <Tag color="green">Đang hoạt động</Tag> : <Tag>Ngừng hoạt động</Tag>,
          },
          {
            title: "Thao tác",
            width: 100,
            align: "center",
            render: (_, record) => {
              const usedCount = record._count.downgradeConditions
              return (
                <Flex justify="center" gap={8}>
                  <EditIcon
                    onClick={() => openPutCriteria({ id: record.id })}
                    className="text-sm text-blue-700 cursor-pointer"
                  />
                  {usedCount > 0 ? (
                    <Tooltip
                      title={`Đang dùng trong ${usedCount} tiêu chí hạ bậc. Hãy chuyển sang "Ngừng hoạt động" thay vì xoá.`}
                    >
                      <span className="text-gray-300 cursor-not-allowed">Đang dùng</span>
                    </Tooltip>
                  ) : (
                    <DeleteIcon popConfirm={{ onConfirm: () => handleDelete(record.id) }} />
                  )}
                </Flex>
              )
            },
          },
        ]}
      />
    </Modal>
  )
}

export default ModalCriteriaDefinition
