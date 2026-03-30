import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { QuaTrinhLuong } from "@workspace/db"
import { useFindManyDM_BacLuong, useFindManyDM_Ngach } from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function QuaTrinhLuongForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()

  const quaTrinhLuongList: QuaTrinhLuong[] = Form.useWatch("QuaTrinhLuong", form)

  const { onOpen } = useDisclosure<
    Partial<QuaTrinhLuong> & {
      onSave: (val: QuaTrinhLuong) => void
    }
  >({
    tag: "PutQuaTrinhLuongModal",
  })

  const { data: ngachList = [] } = useFindManyDM_Ngach(
    {},
    { enabled: expland.includes("QuaTrinhLuong") }
  )
  const { data: bacLuongList = [] } = useFindManyDM_BacLuong(
    {},
    { enabled: expland.includes("QuaTrinhLuong") }
  )

  const handleSave = (data: QuaTrinhLuong) => {
    const currentList = form.getFieldValue("QuaTrinhLuong") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("QuaTrinhLuong", newList)
  }

  const handleUpdate = (data: QuaTrinhLuong, index: number) => {
    const currentList = form.getFieldValue("QuaTrinhLuong") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("QuaTrinhLuong", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("QuaTrinhLuong") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("QuaTrinhLuong", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: QuaTrinhLuong, index: number) => {
    onOpen({
      ...data,
      onSave: (data: QuaTrinhLuong) => handleUpdate(data, index),
    })
  }

  const hasData = quaTrinhLuongList && quaTrinhLuongList.length > 0

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
              title: "Từ ngày",
              align: "center",
              width: 120,
              render: (_, record) => (record?.tuNgay ? formatDate(record?.tuNgay) : ""),
            },
            {
              title: "Đến ngày",
              align: "center",
              width: 120,
              render: (_, record) => (record?.denNgay ? formatDate(record?.denNgay) : ""),
            },
            {
              title: "Ngạch",
              align: "center",
              width: 160,
              render: (_, record) => {
                const found = ngachList.find((item) => item.id === record?.ngachId)
                return found ? found.name : ""
              },
            },
            {
              title: "Bậc lương",
              align: "center",
              width: 120,
              render: (_, record) => {
                const found = bacLuongList.find((item) => item.id === record?.bacLuongId)
                return found ? found.name : ""
              },
            },
            {
              title: "Mã ngạch",
              align: "center",
              width: 120,
              render: (_, record) => record?.maNgach || "",
            },
            {
              title: "Phụ cấp chức vụ",
              align: "center",
              width: 140,
              render: (_, record) => record?.phuCapChucVu || "",
            },
            {
              title: "Phụ cấp khác",
              align: "center",
              width: 140,
              render: (_, record) => record?.phuCapKhac || "",
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
          dataSource={quaTrinhLuongList}
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
            key: "QuaTrinhLuong",
            label: (
              <Title level={4} className="mb-0">
                Quá trình lương
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
