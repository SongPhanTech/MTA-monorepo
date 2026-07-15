import useSpinner from "@hooks/spinner"
import { Modal, Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const ThongTinBaoCaoModal = () => {
  const [labels, _setLabels] = useState<any[]>([])
  const { isOpen, onClose } = useDisclosure<string>({
    tag: "ThongTinBaoCaoModal",
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const _flattenSchema = (schema: any[], parentPath = ""): any[] => {
    return schema.flatMap((item, index) => {
      const fullPath = parentPath ? `${item.path}` : item.path
      const row = {
        key: fullPath,
        path: fullPath,
        description: item.description,
        type: item.type,
      }

      if (item.type === "array" && item.items) {
        return [row, ..._flattenSchema(item.items, fullPath)]
      }

      return row
    })
  }

  const columns: ColumnsType = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
      align: "center",
      render: (_: any, __: any, index: number) => index + 1,
      width: 20,
    },
    {
      title: "Ký hiệu",
      dataIndex: "path",
      align: "center",
      key: "path",
    },
    {
      title: "Ý nghĩa",
      dataIndex: "description",
      key: "description",
      align: "center",
    },
    {
      title: "Kiểu dữ liệu",
      dataIndex: "type",
      key: "type",
      // width: 120,
      align: "center",
    },
  ]

  return (
    <Modal
      open={isOpen}
      onOk={onClose}
      onCancel={onClose}
      maskClosable={true}
      title="Thông tin báo cáo"
      width="45vw"
      footer={null}
    >
      <Table
        columns={columns}
        dataSource={labels}
        pagination={false}
        rowKey="key"
        size="small"
        bordered
      />
    </Modal>
  )
}

export default ThongTinBaoCaoModal
