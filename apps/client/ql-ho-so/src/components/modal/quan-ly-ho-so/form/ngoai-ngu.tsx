import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { NgoaiNgu } from "@workspace/db"
import { useFindManyDM_NgoaiNgu, useFindManyDM_TrinhDoNgoaiNgu } from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function NgoaiNguForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()
  const ngoaiNguList = Form.useWatch("ngoaiNgu", form) || []
  const { data: trinhDoData = [] } = useFindManyDM_TrinhDoNgoaiNgu(
    {},
    {
      enabled: expland.includes("ngoaiNgu"),
    }
  )

  const { data: ngoaiNgu = [] } = useFindManyDM_NgoaiNgu(
    {},
    {
      enabled: expland.includes("ngoaiNgu"),
    }
  )

  const { onOpen } = useDisclosure<Partial<NgoaiNgu> & { onSave: (val: NgoaiNgu) => void }>({
    tag: "PutNgoaiNguModal",
  })

  const handleSave = (data: NgoaiNgu) => {
    const currentList = form.getFieldValue("ngoaiNgu") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("ngoaiNgu", newList)
  }

  const handleUpdate = (data: NgoaiNgu, index: number) => {
    const currentList = form.getFieldValue("ngoaiNgu") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("ngoaiNgu", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("ngoaiNgu") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("ngoaiNgu", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: NgoaiNgu, index: number) => {
    onOpen({
      ...data,
      onSave: (data: NgoaiNgu) => handleUpdate(data, index),
    })
  }

  const hasData = ngoaiNguList && ngoaiNguList.length > 0

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
              title: "Ngôn ngữ",
              align: "center",
              width: 160,
              render: (_, record) => {
                const nn = ngoaiNgu?.find((item) => item.Id === record.ngonNguId)
                return nn ? nn.sTen : ""
              },
            },
            {
              title: "Trình độ",
              align: "center",
              width: 160,
              render: (_, record) => {
                const nn = trinhDoData?.find((item) => item.Id === record.trinhDoId)
                return nn ? nn.sTen : ""
              },
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
              render: (_, record) => formatDate(record?.thoiGianBatDau) || "",
            },
            {
              title: "Thời gian kết thúc ",
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
          dataSource={ngoaiNguList}
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
            key: "ngoaiNgu",
            label: (
              <Title level={4} className="mb-0">
                Ngoại ngữ
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
