import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { QuaTrinhCongTac } from "@workspace/db"
import { useFindManyDM_ChucVu, useFindManyDM_LoaiHinhCongTac } from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function QuaTrinhCongTacForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()
  const congTacList: QuaTrinhCongTac[] = Form.useWatch("quaTrinhCongTac", form)

  const { data: chucVuList = [] } = useFindManyDM_ChucVu(
    {},
    {
      enabled: expland.includes("quaTrinhCongTac"),
    }
  )

  const { onOpen } = useDisclosure<
    Partial<QuaTrinhCongTac> & { onSave: (val: QuaTrinhCongTac) => void }
  >({
    tag: "PutQuaTrinhCongTacModal",
  })

  const { data: loaiHinhCongTacList = [] } = useFindManyDM_LoaiHinhCongTac(
    {},
    {
      enabled: expland.includes("quaTrinhCongTac"),
    }
  )

  const handleSave = (data: QuaTrinhCongTac) => {
    const currentList = form.getFieldValue("quaTrinhCongTac") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("quaTrinhCongTac", newList)
  }

  const handleUpdate = (data: QuaTrinhCongTac, index: number) => {
    const currentList = form.getFieldValue("quaTrinhCongTac") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("quaTrinhCongTac", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("quaTrinhCongTac") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("quaTrinhCongTac", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: QuaTrinhCongTac, index: number) => {
    onOpen({
      ...data,
      onSave: (data: QuaTrinhCongTac) => handleUpdate(data, index),
    })
  }

  const hasData = congTacList && congTacList.length > 0

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
              title: "Từ tháng năm",
              align: "center",
              width: 180,
              fixed: "left",
              render: (_, record) => formatDate(record?.tuThangNam) || "",
            },
            {
              title: "Đến tháng năm",
              align: "center",
              width: 160,
              render: (_, record) => formatDate(record?.denThangNam) || "",
            },
            {
              title: "Loại hình công tác",
              align: "center",
              width: 160,
              render: (_, record) => {
                const loaiHinh = loaiHinhCongTacList.find(
                  (item) => item.id === record?.loaiHinhCongTacId
                )
                return loaiHinh ? loaiHinh.name : ""
              },
            },
            {
              title: "Đơn vị",
              align: "center",
              width: 140,
              render: (_, record) => record?.donVi || "",
            },
            {
              title: "Chức danh",
              align: "center",
              width: 140,
              render: (_, record) => record?.chucDanh || "",
            },
            {
              title: "Chức vụ đảng đoàn",
              align: "center",
              width: 140,
              render: (_, record) => record?.chucVuDangDoan || "",
            },
            {
              title: "Số quyết định",
              align: "center",
              width: 140,
              render: (_, record) => record?.soQuyetDinh || "",
            },
            {
              title: "Chức vụ",
              align: "center",
              width: 140,
              render: (_, record) => {
                const chucVu = chucVuList.find((cv) => cv.Id === record?.chucVuId)
                return chucVu ? chucVu.sTen : ""
              },
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
          dataSource={congTacList}
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
            key: "quaTrinhCongTac",
            label: (
              <Title level={4} className="mb-0">
                Quá trình công tác
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
