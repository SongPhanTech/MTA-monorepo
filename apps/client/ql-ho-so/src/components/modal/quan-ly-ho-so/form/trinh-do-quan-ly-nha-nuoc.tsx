import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { TrinhDoQuanLyNhaNuoc } from "@workspace/db"
import { useFindManyDM_TrinhDoQuanLyNhaNuoc } from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function TrinhDoQuanLyNhaNuocForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()

  const nhaNuocList = Form.useWatch("trinhDoQuanLyNhaNuoc", form) || []
  const { data } = useFindManyDM_TrinhDoQuanLyNhaNuoc(
    {},
    {
      enabled: expland.includes("trinhDoQuanLyNhaNuoc"),
    }
  )

  const { onOpen } = useDisclosure<
    Partial<TrinhDoQuanLyNhaNuoc> & {
      onSave: (val: TrinhDoQuanLyNhaNuoc) => void
    }
  >({
    tag: "PutTrinhDoQuanLyNhaNuocModal",
  })

  const handleSave = (data: TrinhDoQuanLyNhaNuoc) => {
    const currentList = form.getFieldValue("trinhDoQuanLyNhaNuoc") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("trinhDoQuanLyNhaNuoc", newList)
  }

  const handleUpdate = (data: TrinhDoQuanLyNhaNuoc, index: number) => {
    const currentList = form.getFieldValue("trinhDoQuanLyNhaNuoc") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("trinhDoQuanLyNhaNuoc", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("trinhDoQuanLyNhaNuoc") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("trinhDoQuanLyNhaNuoc", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: TrinhDoQuanLyNhaNuoc, index: number) => {
    onOpen({
      ...data,
      onSave: (data: TrinhDoQuanLyNhaNuoc) => handleUpdate(data, index),
    })
  }

  const hasData = nhaNuocList && nhaNuocList.length > 0

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
              render: (_, record) => {
                const trinhDo = data?.find((item) => item.id === record.trinhDoId)
                return trinhDo ? trinhDo.name : ""
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
              render: (_, record) =>
                record?.thoiGianBatDau ? formatDate(record.thoiGianBatDau) : "",
            },
            {
              title: "Thời gian kết thúc ",
              align: "center",
              width: 140,
              render: (_, record) =>
                record?.thoiGianKetThuc ? formatDate(record.thoiGianKetThuc) : "",
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
          dataSource={nhaNuocList}
          rowKey="id"
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
            key: "trinhDoQuanLyNhaNuoc",
            label: (
              <Title level={4} className="mb-0">
                Trình độ quản lý nhà nước
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
