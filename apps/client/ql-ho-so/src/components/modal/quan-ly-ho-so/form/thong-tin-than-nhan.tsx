import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { Relative } from "@workspace/db"
import { useFindManyDM_QuanHeThanNhan } from "@workspace/db/hooks"
import { Button, Col, Collapse, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function ThongTinThanNhanForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()
  const thanNhanList: Relative[] = Form.useWatch("relatives", form)

  const { onOpen } = useDisclosure<Partial<Relative> & { onSave: (val: Relative) => void }>({
    tag: "PutThongTinThanNhan",
  })

  const { data = [] } = useFindManyDM_QuanHeThanNhan(
    {},
    { enabled: expland.includes("thongTinThanNhan") }
  )

  const handleSave = (data: Relative) => {
    const currentList = form.getFieldValue("relatives") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("relatives", newList)
  }

  const handleUpdate = (data: Relative, index: number) => {
    const currentList = form.getFieldValue("relatives") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("relatives", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("relatives") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("relatives", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: Relative, index: number) => {
    onOpen({
      ...data,
      onSave: (data: Relative) => handleUpdate(data, index),
    })
  }

  const hasData = thanNhanList && thanNhanList.length > 0

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
        <Row justify="end">
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
              title: "Tên thân nhân",
              align: "center",
              width: 180,
              fixed: "left",
              render: (_, record) => record?.name || "",
            },
            {
              title: "Tên mối quan hệ",
              align: "center",
              width: 160,
              render: (_, record) => {
                const found = data.find((i) => i.id === record?.quanHeThanNhanId)
                return found?.name || ""
              },
            },
            {
              title: "Năm sinh",
              align: "center",
              width: 140,
              render: (_, record) => record?.birthYear || "",
            },
            {
              title: "Nghề nghiệp",
              align: "center",
              width: 140,
              render: (_, record) => record?.job || "",
            },
            {
              title: "Quê quán",
              align: "center",
              width: 140,
              render: (_, record) => record?.queQuan || "",
            },
            {
              title: "Nơi ở hiện nay",
              align: "center",
              width: 140,
              render: (_, record) => record?.noiOHienTai || "",
            },
            {
              title: "Thông tin khác",
              align: "center",
              width: 140,
              render: (_, record) => record?.information || "",
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
          dataSource={thanNhanList}
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
            key: "thongTinThanNhan",
            label: (
              <Title level={4} className="mb-0">
                Thông tin thân nhân
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
