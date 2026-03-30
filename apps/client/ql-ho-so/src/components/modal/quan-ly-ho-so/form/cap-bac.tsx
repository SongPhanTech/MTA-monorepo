import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { CapBac } from "@workspace/db"
import { useFindManyDM_CapBac } from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function CapBacForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()
  const capBacList: CapBac[] = Form.useWatch("capBac", form)
  const { data: capBacData = [] } = useFindManyDM_CapBac(
    {},
    {
      enabled: expland.includes("capBac"),
    }
  )

  const { onOpen } = useDisclosure<Partial<CapBac> & { onSave: (val: CapBac) => void }>({
    tag: "PutCapBacModal",
  })

  const handleSave = (data: CapBac) => {
    const currentList = form.getFieldValue("capBac") || []
    const newList = [{ ...data }, ...currentList]
    form.setFieldValue("capBac", newList)
  }

  const handleUpdate = (data: CapBac, index: number) => {
    const currentList = form.getFieldValue("capBac") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("capBac", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("capBac") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("capBac", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: CapBac, index: number) => {
    onOpen({
      ...data,
      onSave: (data: CapBac) => handleUpdate(data, index),
    })
  }

  const hasData = capBacList && capBacList.length > 0

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
              title: "Tên cấp bậc",
              align: "center",
              width: 180,
              fixed: "left",
              render: (_, record) => {
                const found = capBacData.find((item) => item.Id === record?.capBacId)
                return found ? found.sTen : ""
              },
            },
            {
              title: "Nơi ra quyết định",
              align: "center",
              width: 160,
              render: (_, record) => record?.noiRaQuyetDinh || "",
            },
            {
              title: "Cấp ra quyết định ",
              align: "center",
              width: 140,
              render: (_, record) => record?.capRaQuyetDinh || "",
            },
            {
              title: "Ngày nhận quyết định ",
              align: "center",
              width: 140,
              render: (_, record) => formatDate(record?.ngayNhanQuyetDinh) || "",
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
          dataSource={capBacList}
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
            key: "capBac",
            label: (
              <Title level={4} className="mb-0">
                Cấp bậc
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
