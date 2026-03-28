import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { QuaTrinhCuDiDaoTao } from "@workspace/db"
import {
  useFindManyDM_LoaiHinhDiHocTap,
  useFindManyDM_TinhTrangDiHocTap,
} from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function QuaTrinhDiDaoTaoBoiDuongForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()
  const daoTaoList: QuaTrinhCuDiDaoTao[] = Form.useWatch("quaTrinhCuDiDaoTao", form)

  const { onOpen } = useDisclosure<
    Partial<QuaTrinhCuDiDaoTao> & { onSave: (val: QuaTrinhCuDiDaoTao) => void }
  >({
    tag: "PutQuaTrinhCuDiBoiDuongModal",
  })

  const { data: loaiHinhList } = useFindManyDM_LoaiHinhDiHocTap(
    {},
    {
      enabled: expland.includes("quaTrinhCuDiDaoTao"),
    }
  )

  const { data: tinhTrangList } = useFindManyDM_TinhTrangDiHocTap(
    {},
    {
      enabled: expland.includes("quaTrinhCuDiDaoTao"),
    }
  )

  const handleSave = (data: QuaTrinhCuDiDaoTao) => {
    const currentList = form.getFieldValue("quaTrinhCuDiDaoTao") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("quaTrinhCuDiDaoTao", newList)
  }

  const handleUpdate = (data: QuaTrinhCuDiDaoTao, index: number) => {
    const currentList = form.getFieldValue("quaTrinhCuDiDaoTao") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("quaTrinhCuDiDaoTao", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("quaTrinhCuDiDaoTao") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("quaTrinhCuDiDaoTao", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: QuaTrinhCuDiDaoTao, index: number) => {
    onOpen({
      ...data,
      onSave: (data: QuaTrinhCuDiDaoTao) => handleUpdate(data, index),
    })
  }

  const hasData = daoTaoList && daoTaoList.length > 0

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
              title: "Khoá đào tạo, bồi dưỡng tập huấn",
              align: "center",
              width: 180,
              fixed: "left",
              render: (_, record) => record?.ten || "",
            },
            {
              title: "Đơn vị tổ chức",
              align: "center",
              width: 160,
              render: (_, record) => record?.donViToChuc || "",
            },
            {
              title: "Loại",
              align: "center",
              width: 140,
              render: (_, record) => {
                const loaiHinh = loaiHinhList?.find((item) => item.id === record?.loaiId)
                return loaiHinh ? loaiHinh.name : ""
              },
            },
            {
              title: "Tình trạng đi học tập",
              align: "center",
              width: 180,
              render: (_, record) => {
                const tinhTrang = tinhTrangList?.find(
                  (item) => item.id === record?.dM_TinhTrangDiHocTapId
                )
                return tinhTrang ? tinhTrang.name : ""
              },
            },
            {
              title: "Từ ngày",
              align: "center",
              width: 140,
              render: (_, record) => formatDate(record?.tuNgay) || "",
            },
            {
              title: "Đến ngày",
              align: "center",
              width: 140,
              render: (_, record) => formatDate(record?.denNgay) || "",
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
          dataSource={daoTaoList}
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
            key: "quaTrinhDiDaoTaoBoiDuong",
            label: (
              <Title level={4} className="mb-0">
                Quá trình được cử đi đào tạo bồi dưỡng
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
