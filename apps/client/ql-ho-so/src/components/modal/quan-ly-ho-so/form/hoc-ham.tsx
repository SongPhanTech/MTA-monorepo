import { CaretRightOutlined, PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { DomProps } from "@constants/type"
import { formatDate } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import type { HocHam } from "@workspace/db"
import { useFindManyDM_HocHam } from "@workspace/db/hooks"
import { Button, Col, Collapse, Flex, Form, Row, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography

export default function HocHamForm({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()

  const hocHamList: HocHam[] = Form.useWatch("hocHam", form)

  const { onOpen } = useDisclosure<
    Partial<HocHam> & {
      onSave: (val: HocHam) => void
    }
  >({
    tag: "PutHocHamModal",
  })

  const { data: hocHamData = [] } = useFindManyDM_HocHam(
    {
      where: {
        bActive: true,
      },
    },
    {
      enabled: expland.includes("hocHam"),
    }
  )

  const handleSave = (data: HocHam) => {
    const currentList = form.getFieldValue("hocHam") || []
    const newList = [...currentList, { ...data }]
    form.setFieldValue("hocHam", newList)
  }

  const handleUpdate = (data: HocHam, index: number) => {
    const currentList = form.getFieldValue("hocHam") || []
    const newList = [...currentList]
    newList[index] = { ...data }
    form.setFieldValue("hocHam", newList)
  }

  const handleDelete = (index: number) => {
    const currentList = form.getFieldValue("hocHam") || []
    const newList = currentList.filter((_: any, i: number) => i !== index)
    form.setFieldValue("hocHam", newList)
  }

  const handleModal = () => {
    onOpen({ onSave: handleSave })
  }

  const handleEdit = (data: HocHam, index: number) => {
    onOpen({
      ...data,
      onSave: (data: HocHam) => handleUpdate(data, index),
    })
  }

  const hasData = hocHamList && hocHamList.length > 0

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
              title: "Học hàm",
              align: "center",
              width: 120,
              fixed: "left",
              render: (_, record) => {
                const found = hocHamData.find((item) => item.Id === record.academicRankTypeId)
                return found ? found.sTen : ""
              },
            },
            {
              title: "Nơi cấp",
              align: "center",
              width: 200,
              render: (_, record) => record.noiCap || "",
            },
            {
              title: "Số quyết định",
              align: "center",
              width: 200,
              render: (_, record) => record.soQuyetDinh || "",
            },
            {
              title: "Thời gian bắt đầu",
              align: "center",
              width: 120,
              render: (_, record) => formatDate(record?.from) || "",
            },
            {
              title: "Thời gian kết thúc",
              align: "center",
              width: 120,
              render: (_, record) => formatDate(record?.to) || "",
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
          dataSource={hocHamList}
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
            key: "hocHam",
            label: (
              <Title level={4} className="mb-0">
                Học hàm
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
