import Table from "@components/commons/table"

import useSpinner from "@hooks/spinner"
import { CouncilRole, SupervisorRole } from "@workspace/db"
import {
  useFindManyDefaultCouncilRolePayAmount,
  useFindManyDefaultSupervisorPayAmount,
  useUpdateDefaultCouncilRolePayAmount,
  useUpdateDefaultSupervisorPayAmount,
} from "@workspace/db/hooks"
import { Button, Col, Flex, Input, message, Row, Space } from "antd"
import { useEffect, useState } from "react"

const RoleType: Map<SupervisorRole | CouncilRole, string> = new Map([
  [CouncilRole.CHAIRMAN, "Chủ tịch"],
  [CouncilRole.SECRETARY, "Thư ký"],
  [CouncilRole.REVIEWER_1, "Phản biện 1"],
  [CouncilRole.REVIEWER_2, "Phản biện 2"],
  [CouncilRole.MEMBER, "Ủy viên"],
  [SupervisorRole.SUPERVISOR, "Chuyên gia hướng dẫn (GVHD1)"],
  [SupervisorRole.CO_SUPERVISOR, "Chuyên gia hướng dẫn phụ (GVHD2)"],
])

interface GroupedRecordData {
  roleName: string
  idProjectIn: string
  idThesisIn: string
  projectIn: number
  projectOut: number
  idProjectOut: string
  thesisIn: number
  idThesisOut: string
  thesisOut: number
  type: "COUNCIL" | "SUPERVISOR"
}
export default function PaymentConfigurationPage({ isThesis }: { isThesis: boolean }) {
  const [isEditing, setIsEditing] = useState(false)
  const [dataSource, setDataSource] = useState<GroupedRecordData[]>([])
  const [initialDataSource, setInitialDataSource] = useState<GroupedRecordData[]>([])

  const { data: councilRolePayAmounts = [] } = useFindManyDefaultCouncilRolePayAmount()

  const { data: supervisorPayAmounts = [] } = useFindManyDefaultSupervisorPayAmount()
  const { mutateAsync: updateCouncilPay } = useUpdateDefaultCouncilRolePayAmount()
  const { mutateAsync: updateSupervisorPay } = useUpdateDefaultSupervisorPayAmount()

  const { showSpinner, hideSpinner } = useSpinner()
  const buildGroupedData = (): GroupedRecordData[] => {
    const map = new Map<string, GroupedRecordData>()

    const allRawData = [
      ...councilRolePayAmounts.map((item) => ({ ...item, type: "COUNCIL" })),
      ...supervisorPayAmounts.map((item) => ({ ...item, type: "SUPERVISOR" })),
    ]
    allRawData.forEach((item) => {
      const roleName = RoleType.get(item.role) ?? "N/A"

      if (!map.has(roleName)) {
        map.set(roleName, {
          roleName,
          idProjectIn: "",
          idThesisIn: "",
          idProjectOut: "",
          idThesisOut: "",
          projectIn: 0,
          projectOut: 0,
          thesisIn: 0,
          thesisOut: 0,
          type: item.type as "COUNCIL" | "SUPERVISOR",
        })
      }

      // biome-ignore lint/style/noNonNullAssertion: <khong the null>
      const current = map.get(roleName)!
      const amount = item.amount.toNumber()

      if (item.description === "PROJECT") {
        if (item.inAcademy) {
          current.projectIn = amount
          current.idProjectIn = item.id
        } else {
          current.projectOut = amount
          current.idProjectOut = item.id
        }
      } else if (item.description === "THESIS") {
        if (item.inAcademy) {
          current.thesisIn = amount
          current.idThesisIn = item.id
        } else {
          current.thesisOut = amount
          current.idThesisOut = item.id
        }
      }
    })
    const roleOrder = [
      "Chủ tịch",
      "Thư ký",
      "Phản biện 1",
      "Phản biện 2",
      "Ủy viên",
      "Chuyên gia hướng dẫn (GVHD1)",
      "Chuyên gia hướng dẫn phụ (GVHD2)",
    ]
    const result = roleOrder
      .map((name) => map.get(name))
      .filter((item): item is GroupedRecordData => item !== undefined)

    return result
  }
  //ts-ignore
  // biome-ignore lint/correctness/useExhaustiveDependencies: <chua can thiet>
  useEffect(() => {
    const data = buildGroupedData()
    setDataSource(data)
    setInitialDataSource(JSON.parse(JSON.stringify(data)))
  }, [councilRolePayAmounts, supervisorPayAmounts])
  const handleInputChange = (
    value: number | null,
    roleName: string,
    field: keyof GroupedRecordData
  ) => {
    setDataSource((prevData) => {
      return prevData.map((item) => {
        if (item.roleName === roleName) {
          return {
            ...item,
            [field]: value || 0,
          }
        }
        return item
      })
    })
  }
  const renderCell = (value: number, record: GroupedRecordData, field: keyof GroupedRecordData) => {
    if (isEditing) {
      return (
        <Input
          value={record[field]}
          style={{ width: "100%" }}
          onChange={(e) => handleInputChange(Number(e.target.value), record.roleName, field)}
        />
      )
    }

    if (value === undefined || value === null || value === 0) {
      return "-"
    }

    return `${new Intl.NumberFormat("vi-VN").format(value)} VNĐ`
  }
  const handleSave = async () => {
    showSpinner()
    try {
      const updatePromises: Promise<any>[] = []

      dataSource.forEach((item, index) => {
        const originalItem = initialDataSource[index]
        if (!originalItem) return

        const pushIfChanged = (
          id: string,
          currentValue: number,
          originalValue: number,
          type: "COUNCIL" | "SUPERVISOR"
        ) => {
          if (id && currentValue !== originalValue) {
            if (type === "COUNCIL") {
              updatePromises.push(
                updateCouncilPay({
                  where: { id },
                  data: { amount: currentValue },
                })
              )
            } else {
              updatePromises.push(
                updateSupervisorPay({
                  where: { id },
                  data: { amount: currentValue },
                })
              )
            }
          }
        }

        pushIfChanged(item.idProjectIn, item.projectIn, originalItem.projectIn, item.type)
        pushIfChanged(item.idProjectOut, item.projectOut, originalItem.projectOut, item.type)
        pushIfChanged(item.idThesisIn, item.thesisIn, originalItem.thesisIn, item.type)
        pushIfChanged(item.idThesisOut, item.thesisOut, originalItem.thesisOut, item.type)
      })

      if (updatePromises.length === 0) {
        message.info("Không có thay đổi nào được thực hiện.")
        setIsEditing(false)
        return
      }

      await Promise.all(updatePromises)
      message.success(`Đã cập nhật thành công ${updatePromises.length} thay đổi!`)
    } catch (error) {
      message.error("Cập nhật thất bại. Vui lòng kiểm tra lại.")
    } finally {
      setIsEditing(false)
      hideSpinner()
    }
  }
  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={24}>
              <Flex justify="end">
                {!isEditing ? (
                  <Button type="primary" onClick={() => setIsEditing(true)}>
                    Chỉnh sửa
                  </Button>
                ) : (
                  <Space>
                    <Button
                      onClick={() => {
                        setDataSource(JSON.parse(JSON.stringify(initialDataSource)))
                        setIsEditing(false)
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => {
                        handleSave()
                      }}
                    >
                      Lưu thay đổi
                    </Button>
                  </Space>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            rowKey="roleName"
            data={dataSource}
            pagination={false}
            columns={[
              {
                title: "STT",
                width: 50,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Tên vai trò",
                align: "center",
                fixed: "left",
                width: 250,
                render: (_, record) => record.roleName,
              },
              ...(!isThesis
                ? [
                    {
                      title: "Thanh toán Đồ án",
                      align: "center" as const,
                      children: [
                        {
                          title: "Trong học viện",
                          dataIndex: "projectIn",
                          align: "center" as const,
                          width: 150,
                          render: (val: number, record: GroupedRecordData) =>
                            renderCell(val, record, "projectIn"),
                        },
                        {
                          title: "Ngoài học viện",
                          dataIndex: "projectOut",
                          align: "center" as const,
                          width: 150,
                          render: (val: number, record: GroupedRecordData) =>
                            renderCell(val, record, "projectOut"),
                        },
                      ],
                    },
                  ]
                : []),

              ...(isThesis
                ? [
                    {
                      title: "Thanh toán Luận văn/Đề án",
                      align: "center" as const,
                      children: [
                        {
                          title: "Trong học viện",
                          dataIndex: "thesisIn",
                          align: "center" as const,
                          width: 150,
                          render: (val: number, record: GroupedRecordData) =>
                            renderCell(val, record, "thesisIn"),
                        },
                        {
                          title: "Ngoài học viện",
                          dataIndex: "thesisOut",
                          align: "center" as const,
                          width: 150,
                          render: (val: number, record: GroupedRecordData) =>
                            renderCell(val, record, "thesisOut"),
                        },
                      ],
                    },
                  ]
                : []),
            ]}
          />
        </Col>
      </Row>
    </div>
  )
}
