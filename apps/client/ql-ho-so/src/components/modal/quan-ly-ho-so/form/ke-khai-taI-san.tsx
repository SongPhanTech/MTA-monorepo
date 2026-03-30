import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { KeKhaiTaiSan } from "@workspace/db"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function KeKhaiTaiSanForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()
  const keKhaiList: KeKhaiTaiSan[] = Form.useWatch("keKhaiTaiSan", form)

  const { onOpen } = useDisclosure<Partial<KeKhaiTaiSan> & { onSave: (val: KeKhaiTaiSan) => void }>(
    {
      tag: "PutKeKhaiTaiSanModal",
    }
  )

  const handleSave = (data: KeKhaiTaiSan) => {
    const currentList = form.getFieldValue("keKhaiTaiSan") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("keKhaiTaiSan", newList)
  }

  const handleUpdate = (data: KeKhaiTaiSan, index: number) => {
    const currentList = form.getFieldValue("keKhaiTaiSan") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("keKhaiTaiSan", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("keKhaiTaiSan") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("keKhaiTaiSan", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: KeKhaiTaiSan, index: number) => {
    onOpen({
      ...data,
      onSave: (data: KeKhaiTaiSan) => handleUpdate(data, index),
    })
  }

  const hasData = keKhaiList && keKhaiList.length > 0

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
              title: "Tên đợt",
              align: "center",
              width: 180,
              fixed: "left",
              render: (_, record) => record?.tenDot || "",
            },
            {
              title: "Loại",
              align: "center",
              width: 160,
              render: (_, record) => record?.loai || "",
            },
            {
              title: "Thời gian kê khai",
              align: "center",
              width: 140,
              render: (_, record) => formatDate(record?.thoiGianKeKhai) || "",
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
          dataSource={keKhaiList}
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
            key: "keKhaiTaiSan",
            label: (
              <Title level={4} className="mb-0">
                Kê khai tài sản
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
