import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function TrinhDoQuanLyHanhChinhForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<any>() // Thay any bằng type phù hợp nếu có

  const hanhChinhList = Form.useWatch("trinhDoQuanLyHanhChinh", form) || []

  const { onOpen } = useDisclosure<Partial<any> & { onSave: (val: any) => void }>({
    tag: "PutTrinhDoQuanLyHanhChinhModal",
  })

  const handleSave = (data: any) => {
    const currentList = form.getFieldValue("trinhDoQuanLyHanhChinh") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("trinhDoQuanLyHanhChinh", newList)
  }

  const handleUpdate = (data: any, index: number) => {
    const currentList = form.getFieldValue("trinhDoQuanLyHanhChinh") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("trinhDoQuanLyHanhChinh", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("trinhDoQuanLyHanhChinh") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("trinhDoQuanLyHanhChinh", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: any, index: number) => {
    onOpen({
      ...data,
      onSave: (data: any) => handleUpdate(data, index),
    })
  }

  const hasData = hanhChinhList && hanhChinhList.length > 0

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
              title: "Hình thức đào tạo",
              align: "center",
              width: 180,
              fixed: "left",
              render: (_, record) => record?.hinhThucDaoTao || "",
            },
            {
              title: "Trình độ",
              align: "center",
              width: 160,
              render: (_, record) => record?.trinhDoName || "",
            },
            {
              title: "Cơ sở đào tạo",
              align: "center",
              width: 140,
              render: (_, record) => record?.noiDaoTao || "",
            },
            {
              title: "Thời gian bắt đầu",
              align: "center",
              width: 140,
              render: (_, record) => record?.thoiGianBatDau || "",
            },
            {
              title: "Thời gian kết thúc ",
              align: "center",
              width: 140,
              render: (_, record) => record?.thoiGianKetThuc || "",
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
                    onClick={() => handleEdit(record, index)}
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
          dataSource={hanhChinhList}
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
            key: "trinhDoQuanLyHanhChinh",
            label: (
              <Title level={4} className="mb-0">
                Trình độ quản lý hành chính
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
