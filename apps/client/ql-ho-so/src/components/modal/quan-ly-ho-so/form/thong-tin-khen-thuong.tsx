import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { KhenThuong } from "@workspace/db"
import { useFindManyDM_HinhThucKhenThuongChinhQuyen } from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function ThongTinKhenThuongForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()
  const khenThuongList: KhenThuong[] = Form.useWatch("khenThuong", form)

  const { onOpen } = useDisclosure<Partial<KhenThuong> & { onSave: (val: KhenThuong) => void }>({
    tag: "PutKhenThuongModal",
  })

  const { data: hinhThucKhenThuongData = [] } = useFindManyDM_HinhThucKhenThuongChinhQuyen(
    {},
    {
      enabled: expland.includes("thongTinKhenThuong"),
    }
  )

  const handleSave = (data: KhenThuong) => {
    const currentList = form.getFieldValue("khenThuong") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("khenThuong", newList)
  }

  const handleUpdate = (data: KhenThuong, index: number) => {
    const currentList = form.getFieldValue("khenThuong") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("khenThuong", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("khenThuong") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("khenThuong", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: KhenThuong, index: number) => {
    onOpen({
      ...data,
      onSave: (data: KhenThuong) => handleUpdate(data, index),
    })
  }

  const hasData = khenThuongList && khenThuongList.length > 0

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
              title: "Hình thức khen thưởng chính quyền",
              align: "center",
              width: 180,
              fixed: "left",
              render: (_, record) => {
                const found = hinhThucKhenThuongData.find(
                  (item) => item.id === record?.hinhThucKhenThuongId
                )
                return found ? found.name : ""
              },
            },
            {
              title: "Cấp khen thưởng",
              align: "center",
              width: 160,
              render: (_, record) => record?.capKhenThuong || "",
            },
            {
              title: "Số quyết định",
              align: "center",
              width: 140,
              render: (_, record) => record?.soQuyetDinh || "",
            },
            {
              title: "Người ký",
              align: "center",
              width: 140,
              render: (_, record) => record?.nguoiKy || "",
            },
            {
              title: "Ngày nhận quyết định",
              align: "center",
              width: 140,
              render: (_, record) => formatDate(record?.ngayNhanQuyetDinh) || "",
            },
            {
              title: "Lý do",
              align: "center",
              width: 140,
              render: (_, record) => record?.lyDo || "",
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
          dataSource={khenThuongList}
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
            key: "thongTinKhenThuong",
            label: (
              <Title level={4} className="mb-0">
                Thông tin khen thưởng
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
