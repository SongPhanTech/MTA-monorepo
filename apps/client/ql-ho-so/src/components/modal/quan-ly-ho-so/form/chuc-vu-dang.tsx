import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { ChucVuDang } from "@workspace/db/client"
import { useFindManyDM_ChucVu } from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function ChucVuDangForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()

  const chucVuDangList: ChucVuDang[] = Form.useWatch("quaTrinhChucVuDang", form)

  const { data } = useFindManyDM_ChucVu(
    {
      where: {
        iNhomChucVu: 1,
      },
    },
    {
      enabled: expland.includes("quaTrinhChucVuDang"),
    }
  )

  const { onOpen } = useDisclosure<
    Partial<ChucVuDang> & {
      onSave: (val: ChucVuDang) => void
    }
  >({
    tag: "PutChucVuDangModal",
  })

  const handleSave = (data: ChucVuDang) => {
    const currentList = form.getFieldValue("quaTrinhChucVuDang") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("quaTrinhChucVuDang", newList)
  }

  const handleUpdate = (data: ChucVuDang, index: number) => {
    const currentList = form.getFieldValue("quaTrinhChucVuDang") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("quaTrinhChucVuDang", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("quaTrinhChucVuDang") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("quaTrinhChucVuDang", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: ChucVuDang, index: number) => {
    onOpen({
      ...data,
      onSave: (data: ChucVuDang) => handleUpdate(data, index),
    })
  }

  const hasData = chucVuDangList && chucVuDangList.length > 0

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
              title: "Tên chức vụ Đảng",
              align: "center",
              width: 200,
              fixed: "left",
              render: (_, record) => {
                const found = data?.find((i) => i.Id === record.chucVuDangId)
                return found ? found?.sTen : ""
              },
            },
            {
              title: "Nơi nhận chức vụ",
              align: "center",
              width: 160,
              render: (_, record) => record.address || "",
            },
            {
              title: "Ghi chú",
              width: 120,
              render: (_, record) => record?.description || "",
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
          dataSource={chucVuDangList}
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
            key: "quaTrinhChucVuDang",
            label: (
              <Title level={4} className="mb-0">
                Chức vụ Đảng
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
