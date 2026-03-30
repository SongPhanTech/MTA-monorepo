import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { TiengDanToc } from "@workspace/db"
import { useFindManyDM_DanToc } from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function TiengDanTocForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()

  const tiengDanTocList: TiengDanToc[] = Form.useWatch("tiengDanToc", form)

  const { onOpen } = useDisclosure<
    Partial<TiengDanToc> & {
      onSave: (val: TiengDanToc) => void
    }
  >({
    tag: "PutTiengDanTocModal",
  })

  const { data = [] } = useFindManyDM_DanToc(
    {},
    {
      enabled: expland.includes("tiengDanToc"),
    }
  )

  const handleSave = (data: TiengDanToc) => {
    const currentList = form.getFieldValue("tiengDanToc") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("tiengDanToc", newList)
  }

  const handleUpdate = (data: TiengDanToc, index: number) => {
    const currentList = form.getFieldValue("tiengDanToc") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("tiengDanToc", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("tiengDanToc") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("tiengDanToc", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: TiengDanToc, index: number) => {
    onOpen({
      ...data,
      onSave: (data: TiengDanToc) => handleUpdate(data, index),
    })
  }

  const hasData = tiengDanTocList && tiengDanTocList.length > 0

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
              title: "Tiếng dân tộc",
              align: "center",
              width: 180,
              fixed: "left",
              render: (_, record) => {
                const found = data.find((item) => item.Id === record?.danTocId)
                return found ? found.sTen : ""
              },
            },
            {
              title: "Mức độ nghe",
              align: "center",
              width: 160,
              render: (_, record) => record?.nghe || "",
            },
            {
              title: "Mức độ nói",
              align: "center",
              width: 140,
              render: (_, record) => record?.noi || "",
            },
            {
              title: "Mức độ viết",
              align: "center",
              width: 140,
              render: (_, record) => record?.viet || "",
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
          dataSource={tiengDanTocList}
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
            key: "tiengDanToc",
            label: (
              <Title level={4} className="mb-0">
                Tiếng dân tộc
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
