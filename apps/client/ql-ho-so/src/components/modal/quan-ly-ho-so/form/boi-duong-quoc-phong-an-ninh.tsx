import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { BoiDuongQuocPhongAnNinh } from "@workspace/db"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function BoiDuongQuocPhongAnNinhForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()
  const boiDuongList: BoiDuongQuocPhongAnNinh[] = Form.useWatch("boiDuongQuocPhongAnNinh", form)

  const { onOpen } = useDisclosure<
    Partial<BoiDuongQuocPhongAnNinh> & { onSave: (val: BoiDuongQuocPhongAnNinh) => void }
  >({
    tag: "PutBoiDuongQuocPhongModal",
  })

  const handleSave = (data: BoiDuongQuocPhongAnNinh) => {
    const currentList = form.getFieldValue("boiDuongQuocPhongAnNinh") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("boiDuongQuocPhongAnNinh", newList)
  }

  const handleUpdate = (data: BoiDuongQuocPhongAnNinh, index: number) => {
    const currentList = form.getFieldValue("boiDuongQuocPhongAnNinh") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("boiDuongQuocPhongAnNinh", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("boiDuongQuocPhongAnNinh") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("boiDuongQuocPhongAnNinh", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: BoiDuongQuocPhongAnNinh, index: number) => {
    onOpen({
      ...data,
      onSave: (data: BoiDuongQuocPhongAnNinh) => handleUpdate(data, index),
    })
  }

  const hasData = boiDuongList && boiDuongList.length > 0

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
              title: "Tên lớp bồi dưỡng",
              align: "center",
              width: 180,
              fixed: "left",
              render: (_, record) => record?.name || "",
            },
            {
              title: "Thời gian bắt đầu",
              align: "center",
              width: 140,
              render: (_, record) => formatDate(record?.thoiGianBatDau) || "",
            },
            {
              title: "Thời gian kết thúc",
              align: "center",
              width: 140,
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
          dataSource={boiDuongList}
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
            key: "boiDuongQuocPhongAnNinh",
            label: (
              <Title level={4} className="mb-0">
                Bồi dưỡng quốc phòng an ninh
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
