import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { ToChucXaHoi } from "@workspace/db"
import { useFindManyDM_ToChucXaHoi } from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function ToChucXaHoiForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()

  const toChucXaHoiList: ToChucXaHoi[] = Form.useWatch("ToChucXaHoi", form)

  const { onOpen } = useDisclosure<
    Partial<ToChucXaHoi> & {
      onSave: (val: ToChucXaHoi) => void
    }
  >({
    tag: "PutToChucXaHoiModal",
  })

  const { data = [] } = useFindManyDM_ToChucXaHoi(
    {},
    {
      enabled: expland.includes("toChucXaHoi"),
    }
  )

  const handleSave = (data: ToChucXaHoi) => {
    const currentList = form.getFieldValue("ToChucXaHoi") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("ToChucXaHoi", newList)
  }

  const handleUpdate = (data: ToChucXaHoi, index: number) => {
    const currentList = form.getFieldValue("ToChucXaHoi") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("ToChucXaHoi", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("ToChucXaHoi") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("ToChucXaHoi", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: ToChucXaHoi, index: number) => {
    onOpen({
      ...data,
      onSave: (data: ToChucXaHoi) => handleUpdate(data, index),
    })
  }

  const hasData = toChucXaHoiList && toChucXaHoiList.length > 0

  const renderContent = () => {
    if (!hasData) {
      return (
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">Không có dữ liệu</Text>
          </Col>
          <Col>
            <Button
              onClick={handleModal}
              icon={<PlusOutlined />}
              className="border-green-700 text-green-700 hover:bg-green-50"
            >
              Thêm mới
            </Button>
          </Col>
        </Row>
      )
    }

    return (
      <div>
        <Row justify="space-between" align="middle">
          <Col span={24}>
            <Flex justify="end">
              <Button
                onClick={handleModal}
                icon={<PlusOutlined />}
                className="border-green-700 text-green-700 hover:bg-green-50"
              >
                Thêm mới
              </Button>
            </Flex>
          </Col>
        </Row>

        <Table
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              fixed: "left",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Tên tổ chức",
              align: "center",
              width: 200,
              fixed: "left",
              render: (_, record) => {
                const found = data.find((i) => i.id === record.tenId)
                return found ? found.name : ""
              },
            },
            {
              title: "Từ ngày",
              align: "center",
              width: 140,
              render: (_, record) => (record?.tuNgay ? formatDate(record?.tuNgay) : ""),
            },
            {
              title: "Đến ngày",
              align: "center",
              width: 140,
              render: (_, record) => (record?.denNgay ? formatDate(record?.denNgay) : ""),
            },
            {
              title: "Công việc",
              align: "center",
              width: 200,
              render: (_, record) => record?.congViec || "",
            },
            {
              title: "Thao tác",
              width: 100,
              align: "center",
              fixed: "right",
              render: (_, record, index) => (
                <Row className="justify-center gap-2">
                  <EditIcon
                    className="text-sm text-blue-700 cursor-pointer"
                    onClick={() => handleEdit(record as any, index)}
                  />
                  <DeleteIcon
                    popConfirm={{
                      onConfirm: () => handleDelete(index),
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Row>
              ),
            },
          ]}
          dataSource={toChucXaHoiList}
          pagination={false}
        />
      </div>
    )
  }

  return (
    <div>
      <Collapse
        items={[
          {
            key: "toChucXaHoi",
            label: (
              <Title level={4} className="mb-0">
                Tổ chức xã hội
              </Title>
            ),
            children: renderContent(),
          },
        ]}
        expandIcon={({ isActive }) => (
          <CaretRightOutlined style={{ fontSize: 16 }} rotate={isActive ? 90 : 0} />
        )}
        bordered={false}
        expandIconPosition="end"
        className="bg-transparent"
        activeKey={expland}
        onChange={(value) => {
          setExpland([...value])
        }}
      />
    </div>
  )
}
