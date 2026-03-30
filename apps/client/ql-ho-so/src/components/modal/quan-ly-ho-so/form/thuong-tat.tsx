import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { ThuongTat } from "@workspace/db"
import { useFindManyDM_LoaiThuongTat } from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function ThuongTatForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()

  const thuongTatList: ThuongTat[] = Form.useWatch("thuongTat", form)

  const { onOpen } = useDisclosure<
    Partial<ThuongTat> & {
      onSave: (val: ThuongTat) => void
    }
  >({
    tag: "PutThuongTatModal",
  })

  const { data = [] } = useFindManyDM_LoaiThuongTat(
    {},
    {
      enabled: expland.includes("thuongTat"),
    }
  )

  const handleSave = (data: ThuongTat) => {
    const currentList = form.getFieldValue("thuongTat") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("thuongTat", newList)
  }

  const handleUpdate = (data: ThuongTat, index: number) => {
    const currentList = form.getFieldValue("thuongTat") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("thuongTat", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("thuongTat") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("thuongTat", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: ThuongTat, index: number) => {
    onOpen({
      ...data,
      onSave: (data: ThuongTat) => handleUpdate(data, index),
    })
  }

  const hasData = thuongTatList && thuongTatList.length > 0

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
              title: "Loại thương tật",
              align: "center",
              width: 180,
              fixed: "left",
              render: (_, record) => {
                const found = data.find((item) => item.id === record?.loaiId)
                return found ? found.name : ""
              },
            },
            {
              title: "Tỉ lệ (%)",
              align: "center",
              width: 100,
              render: (_, record) => record?.tiLe ?? "",
            },
            {
              title: "Nguyên nhân",
              align: "center",
              width: 180,
              render: (_, record) => record?.nguyenNhan || "",
            },
            {
              title: "Thời gian bị thương",
              align: "center",
              width: 160,
              render: (_, record) => (record?.thoiGian ? formatDate(record?.thoiGian) : ""),
            },
            {
              title: "Nơi bị thương",
              align: "center",
              width: 160,
              render: (_, record) => record?.noiBiThuong || "",
            },
            {
              title: "Thời gian giám định",
              align: "center",
              width: 160,
              render: (_, record) =>
                record?.thoiGianGiamDinh ? formatDate(record?.thoiGianGiamDinh) : "",
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
          dataSource={thuongTatList}
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
            key: "thuongTat",
            label: (
              <Title level={4} className="mb-0">
                Thương tật
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
