import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { QuaTrinhCuDiCongTac } from "@workspace/db"
import {
  useFindManyDM_ChucVu,
  useFindManyDM_LoaiTinhTrangCongTac,
  useFindManyDM_NuocCuDiHocTap,
  useFindManyDM_TinhTrangCongTac,
} from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function QuaTrinhCuDiCongTacForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()
  const cuDiCongTacList: QuaTrinhCuDiCongTac[] = Form.useWatch("quaTrinhCuDiCongTac", form)

  const { onOpen } = useDisclosure<
    Partial<QuaTrinhCuDiCongTac> & { onSave: (val: QuaTrinhCuDiCongTac) => void }
  >({
    tag: "PutQuaTrinhCuDiCongTacModal",
  })

  const { data: chucVuList = [] } = useFindManyDM_ChucVu(
    {},
    {
      enabled: expland.includes("quaTrinhCuDiCongTac"),
    }
  )

  const { data: loaiTinhTrangCongTacList = [] } = useFindManyDM_LoaiTinhTrangCongTac(
    {},
    {
      enabled: expland.includes("quaTrinhCuDiCongTac"),
    }
  )

  const { data: tinhTrangCongTacList = [] } = useFindManyDM_TinhTrangCongTac(
    {},
    {
      enabled: expland.includes("quaTrinhCuDiCongTac"),
    }
  )

  const { data: nuocCuDiHocTapList = [] } = useFindManyDM_NuocCuDiHocTap(
    {},
    {
      enabled: expland.includes("quaTrinhCuDiCongTac"),
    }
  )

  const handleSave = (data: QuaTrinhCuDiCongTac) => {
    const currentList = form.getFieldValue("quaTrinhCuDiCongTac") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("quaTrinhCuDiCongTac", newList)
  }

  const handleUpdate = (data: QuaTrinhCuDiCongTac, index: number) => {
    const currentList = form.getFieldValue("quaTrinhCuDiCongTac") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("quaTrinhCuDiCongTac", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("quaTrinhCuDiCongTac") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("quaTrinhCuDiCongTac", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: QuaTrinhCuDiCongTac, index: number) => {
    onOpen({
      ...data,
      onSave: (data: QuaTrinhCuDiCongTac) => handleUpdate(data, index),
    })
  }

  const hasData = cuDiCongTacList && cuDiCongTacList.length > 0

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
              title: "Nước công tác",
              align: "center",
              width: 140,
              render: (_, record) => {
                const nuoc = nuocCuDiHocTapList.find((nc) => nc.id === record?.dM_NuocCuDiHocTapId)
                return nuoc ? nuoc.name : ""
              },
            },
            {
              title: "Đơn vị",
              align: "center",
              width: 140,
              render: (_, record) => record?.donVi || "",
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
              title: "Loại tình trạng công tác",
              align: "center",
              width: 180,
              render: (_, record) => {
                const loaiTinhTrang = loaiTinhTrangCongTacList.find(
                  (item) => item.id === record?.dM_LoaiTinhTrangCongTacId
                )
                return loaiTinhTrang ? loaiTinhTrang.name : ""
              },
            },
            {
              title: "Tình trạng công tác",
              align: "center",
              width: 160,
              render: (_, record) => {
                const tinhTrang = tinhTrangCongTacList.find(
                  (item) => item.id === record?.dM_TinhTrangCongTacId
                )
                return tinhTrang ? tinhTrang.name : ""
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
          dataSource={cuDiCongTacList}
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
            key: "quaTrinhCuDiCongTac",
            label: (
              <Title level={4} className="mb-0">
                Quá trình được cử đi công tác
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
