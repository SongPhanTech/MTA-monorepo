import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { HocVi } from "@workspace/db"
import {
  useFindManyDM_HocVi,
  useFindManyDM_QuocGia,
  useFindManyDM_TruongDaoTaoBacDH,
} from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function ThongTinDaoTao({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()

  const hocViList: HocVi[] = Form.useWatch("hocVi", form)

  const { onOpen } = useDisclosure<
    Partial<HocVi> & {
      onSave: (val: HocVi) => void
    }
  >({
    tag: "PutHocViModal",
  })

  const { data: quocGiaData = [] } = useFindManyDM_QuocGia(
    {},
    {
      enabled: expland.includes("hocVi"),
    }
  )
  const { data: truongData = [] } = useFindManyDM_TruongDaoTaoBacDH(
    {},
    {
      enabled: expland.includes("hocVi"),
    }
  )
  const { data: hocViData = [] } = useFindManyDM_HocVi(
    {
      where: {
        bActive: true,
      },
    },
    {
      enabled: expland.includes("hocVi"),
    }
  )

  const handleSave = (data: HocVi) => {
    const currentList = form.getFieldValue("hocVi") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("hocVi", newList)
  }

  const handleUpdate = (data: HocVi, index: number) => {
    const currentList = form.getFieldValue("hocVi") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("hocVi", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("hocVi") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("hocVi", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: HocVi, index: number) => {
    onOpen({
      ...data,
      onSave: (data: HocVi) => handleUpdate(data, index),
    })
  }

  const hasData = hocViList && hocViList.length > 0

  const renderContent = () => {
    if (!hasData) {
      return (
        <Row justify="space-between" align="middle" className="py-4">
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
              title: "Học vị",
              align: "center",
              width: 120,
              fixed: "left",
              render: (_, record) => {
                const found = hocViData.find((item) => item.Id === record.academicDegreeTypeId)
                return found ? found.sTen : ""
              },
            },
            {
              title: "Lĩnh vực",
              align: "center",
              width: 200,
              render: (_, record) => record.linhVuc || "",
            },
            {
              title: "Trường",
              align: "center",
              width: 200,
              render: (_, record) => {
                const found = truongData.find((item) => item.id === record.truongId)
                return found ? found.name : ""
              },
            },
            {
              title: "Quốc gia",
              align: "center",
              width: 120,
              render: (_, record) => {
                const found = quocGiaData.find((item) => item.Id === record.nationalityId)
                return found ? found.sTen : ""
              },
            },
            {
              title: "Năm nhận",
              align: "center",
              width: 120,
              render: (_, record) => record.year || "",
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
          dataSource={hocViList}
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
            key: "thongTinDaotao",
            label: (
              <Title level={4} className="mb-0">
                Thông tin đào tạo
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
