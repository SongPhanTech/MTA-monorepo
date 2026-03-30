import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { ChienDau } from "@workspace/db"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function ChienDauForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()

  const chienDauList: ChienDau[] = Form.useWatch("chienDau", form)

  const { onOpen } = useDisclosure<
    Partial<ChienDau> & {
      onSave: (val: ChienDau) => void
    }
  >({
    tag: "PutChienDauModal",
  })

  const handleSave = (data: ChienDau) => {
    const currentList = form.getFieldValue("chienDau") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("chienDau", newList)
  }

  const handleUpdate = (data: ChienDau, index: number) => {
    const currentList = form.getFieldValue("chienDau") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("chienDau", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("chienDau") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("chienDau", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: ChienDau, index: number) => {
    onOpen({
      ...data,
      onSave: (data: ChienDau) => handleUpdate(data, index),
    })
  }

  const hasData = chienDauList && chienDauList.length > 0

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
              title: "Cương vị",
              align: "center",
              width: 180,
              fixed: "left",
              render: (_, record) => record?.cuongVi || "",
            },
            {
              title: "Đơn vị",
              align: "center",
              width: 160,
              render: (_, record) => record?.donVi || "",
            },
            {
              title: "Địa điểm",
              align: "center",
              width: 140,
              render: (_, record) => record?.diaDiem || "",
            },
            {
              title: "Vai trò",
              align: "center",
              width: 140,
              render: (_, record) => record?.vaiTro || "",
            },
            {
              title: "Đối tượng",
              align: "center",
              width: 140,
              render: (_, record) => record?.doiTuong || "",
            },
            {
              title: "Từ tháng năm",
              align: "center",
              width: 180,
              fixed: "left",
              render: (_, record) => formatDate(record?.thoiGianBatDau) || "",
            },
            {
              title: "Đến tháng năm",
              align: "center",
              width: 160,
              render: (_, record) => formatDate(record?.thoiGianKetThuc) || "",
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
          dataSource={chienDauList}
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
            key: "phucVuChienDau",
            label: (
              <Title level={4} className="mb-0">
                Phục vụ chiến đấu
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
