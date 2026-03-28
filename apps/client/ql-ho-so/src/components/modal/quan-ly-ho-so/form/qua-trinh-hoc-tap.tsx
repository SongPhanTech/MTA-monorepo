import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { QuaTrinhHocTap } from "@workspace/db"
import {
  useFindManyDM_ChuyenNganhDaoTaoBacDH,
  useFindManyDM_NganhHoc,
  useFindManyDM_TruongDaoTaoBacDH,
} from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function QuaTrinhHocTapForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()

  const quaTrinhHocTapList: QuaTrinhHocTap[] = Form.useWatch("quaTrinhHocTap", form)

  const { onOpen } = useDisclosure<
    Partial<QuaTrinhHocTap> & {
      onSave: (val: QuaTrinhHocTap) => void
    }
  >({
    tag: "PutQuaTrinhHocTapModal",
  })

  const { data: truongList = [] } = useFindManyDM_TruongDaoTaoBacDH(
    {},
    { enabled: expland.includes("quaTrinhHocTap") }
  )
  const { data: nganhList = [] } = useFindManyDM_NganhHoc(
    {},
    { enabled: expland.includes("quaTrinhHocTap") }
  )
  const { data: chuyenNganhList = [] } = useFindManyDM_ChuyenNganhDaoTaoBacDH(
    {},
    { enabled: expland.includes("quaTrinhHocTap") }
  )

  const handleSave = (data: QuaTrinhHocTap) => {
    const currentList = form.getFieldValue("quaTrinhHocTap") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("quaTrinhHocTap", newList)
  }

  const handleUpdate = (data: QuaTrinhHocTap, index: number) => {
    const currentList = form.getFieldValue("quaTrinhHocTap") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("quaTrinhHocTap", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("quaTrinhHocTap") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("quaTrinhHocTap", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: QuaTrinhHocTap, index: number) => {
    onOpen({
      ...data,
      onSave: (data: QuaTrinhHocTap) => handleUpdate(data, index),
    })
  }

  const hasData = quaTrinhHocTapList && quaTrinhHocTapList.length > 0

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
              title: "Trường",
              align: "center",
              width: 200,
              render: (_, record) => {
                const found = truongList.find((item) => item.id === record?.tenTruongId)
                return found ? found.name : ""
              },
            },
            {
              title: "Ngành học",
              align: "center",
              width: 180,
              render: (_, record) => {
                const found = nganhList.find((item) => item.id === record?.nganhHocId)
                return found ? found.name : ""
              },
            },
            {
              title: "Chuyên ngành",
              align: "center",
              width: 180,
              render: (_, record) => {
                const found = chuyenNganhList.find((item) => item.id === record?.chuyenNganhId)
                return found ? found.name : ""
              },
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
              title: "Kết quả",
              align: "center",
              width: 120,
              render: (_, record) => record?.ketQua || "",
            },
            {
              title: "Loại hình đào tạo",
              align: "center",
              width: 160,
              render: (_, record) => record?.loaiHinhDaoTao || "",
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
          dataSource={quaTrinhHocTapList}
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
            key: "quaTrinhHocTap",
            label: (
              <Title level={4} className="mb-0">
                Quá trình học tập
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
