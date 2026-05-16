import Table from "@components/commons/table"
import { Button, Col, Flex, Form, InputNumber, message, Row, Tag } from "antd"
import { FilterProps } from "@constants/type"
import { Key, useEffect, useMemo, useState } from "react"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useFindManySchoolYear, useFindManyStudent } from "@workspace/db/hooks"
import { SchoolYear } from "@workspace/db"
import {
  useTrainingScoreStatusStatusOptions,
} from "@hooks/studentTrainingType"
import { Save } from "lucide-react"
import useSpinner from "@hooks/spinner"
import { sqlTransaction } from "@workspace/libs/api/model"
import Select from "@components/commons/select"
import dayjs from "dayjs"
import { SemesterType, UserProfile } from "@workspace/db/client"

export default function SchoolYearTrainingScore({
  selectedFixedClass,
}: {
  selectedFixedClass?: string
}) {
  const { showSpinner, hideSpinner } = useSpinner()
  const [schoolYearId, setSchoolYearId] = useState<string>()
  const [form] = Form.useForm<{ list: Record<string, { score: number | null }> }>()
  const { can } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, _setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
  })
  const {
    getTrainingScoreStatusLabel,
    getTrainingScoreStatusColor,
  } = useTrainingScoreStatusStatusOptions()

  const where = useMemo(
    () => ({
      fixedClass: {
        id: selectedFixedClass,
      },
      ...(filters.code
        ? {
            code: {
              contains: filters.code,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.name
        ? {
            userProfile: {
              OR: [
                {
                  fullname: {
                    contains: filters.name,
                    mode: "insensitive" as const,
                  },
                },
                {
                  firstName: {
                    contains: filters.name,
                    mode: "insensitive" as const,
                  },
                },
                {
                  lastName: {
                    contains: filters.name,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          }
        : {}),
      ...(filters.idCardNumber
        ? {
            userProfile: {
              idCardNumber: {
                contains: filters.idCardNumber,
                mode: "insensitive" as const,
              },
            },
          }
        : {}),
    }),
    [filters, selectedFixedClass]
  )

  const { data = [], refetch } = useFindManyStudent(
    {
      where,
      include: {
        userProfile: true,
        schoolYearTrainingScore: {
          where: {
            schoolYearId,
          },
        },
        semesterTrainingScore: {
          where: {
            semester: {
              schoolYearId,
              semesterType: SemesterType.SECOND
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    },
    {
      enabled: !!selectedFixedClass && !!schoolYearId,
    }
  )

  const { data: schoolYears = [] } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
    include: {
      semesters: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  const handleSave = async () => {
    try {
      if (!schoolYearId) {
        return message.error("Vui lòng chọn năm học")
      }

      showSpinner()
      const dataSubmit = form.getFieldsValue()
      const error = Object.entries(dataSubmit.list).find((i: any) => Number(i?.score) > 10)
      if (error) {
        return
      }
      const listCreate: any = []
      const listUpdate: any = []
      Object.entries(dataSubmit.list).forEach(([key, value]) => {
        const item: any = data.find((i) => i.id === key)
        if (item?.schoolYearTrainingScore?.length > 0 && value?.score) {
          listUpdate.push({
            ...item,
            schoolYearTrainingScoreId: item.schoolYearTrainingScore[0].id,
            score: value.score,
          })
        } else if (item?.schoolYearTrainingScore?.length === 0 && value?.score) {
          listCreate.push({
            ...item,
            score: value.score,
          })
        }
      })

      let listTransaction: any = []
      if (listCreate.length > 0) {
        listTransaction.push({
          model: "SchoolYearTrainingScore",
          operation: "createMany",
          data: {
            data: listCreate.map((t: any) => {
              return {
                studentId: t.id,
                score: t.score,
                schoolYearId,
                status: can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_REN_LUYEN_THEO_NAM,
                  "XEM_TAT_CA"
                )
                  ? "APPROVED"
                  : "PENDING",
              }
            }),
          },
        })
      }
      if (listUpdate.length > 0) {
        listUpdate.forEach((t: any) => {
          listTransaction.push({
            model: "SchoolYearTrainingScore",
            operation: "update",
            data: {
              where: {
                id: t.schoolYearTrainingScoreId,
              },
              data: {
                score: t.score,
                status: can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_REN_LUYEN_THEO_NAM,
                  "XEM_TAT_CA"
                )
                  ? "APPROVED"
                  : "PENDING",
              },
            },
          })
        })
      }
      if (listTransaction.length > 0) {
        const res = await sqlTransaction(listTransaction)
        if (res?.status === 200) {
          message.success("Lưu điểm rèn luyện năm học thành công")
          refetch()
        }
      }

    } catch (error) {
      message.error("Đã xảy ra lỗi khi lưu điểm rèn luyện năm học")
    } finally {
      hideSpinner()
    }
  }

  useEffect(() => {
    if (data?.length > 0) {
      form.setFieldsValue({
        list: data.reduce((acc, cur) => {
          if (!acc) {
            return {}
          }
          acc[cur.id] = {
            ...cur,
            score: cur.schoolYearTrainingScore[0]?.score ?? cur.semesterTrainingScore?.[0]?.score,
          }
          return acc
        }, {} as any),
      })
    }
  }, [data, form])
  return (
    <Row gutter={[0, 0]}>
      <Col span={24}>
        <Flex justify="space-between" align="center">
          <div>
            <Select
              placeholder="Chọn năm học"
              options={schoolYears.map((i: SchoolYear) => {
                return {
                  value: i.id,
                  label: i.name,
                }
              })}
              value={schoolYearId}
              onChange={(value) => {
                setSchoolYearId(value)
              }}
              className="w-[250px]"
            />
          </div>
          <Flex justify="end" align="center">
            {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_REN_LUYEN_THEO_NAM, "SUA") && (
              <Button type="primary" onClick={handleSave}>
                <Save stroke="white" />
                Lưu
              </Button>
            )}
          </Flex>
        </Flex>
      </Col>
      <Col span={24}>
        <Form form={form}>
          <Form.Item name="list">
            <Table
              filters={filters}
              setFilters={(value) => {
                setFilters(value)
                setCurrentPage(1)
              }}
              rowSelection={{
                selectedRowKeys,
                onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
                getCheckboxProps: (record) => ({
                  disabled: record.schoolYearTrainingScore?.length <= 0,
                }),
              }}
              columns={[
                {
                  title: "STT",
                  width: 50,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
                },
                {
                  title: "Mã sinh viên",
                  align: "center",
                  width: 150,
                  render: (_, record) => record.code || "",
                },
                {
                  title: "Họ và tên",
                  align: "center",
                  dataIndex: "name",
                  render: (_, record) => record?.userProfile?.fullname,
                },
                {
                  title: "Ngày sinh",
                  align: "center",
                  width: 120,
                  render: (__, record) =>
                    record.userProfile?.dateOfBirth
                      ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
                      : "",
                },
                {
                  title: "CCCD",
                  align: "center",
                  width: 100,
                  dataIndex: "idCardNumber",
                  type: "input",
                  render: (__, record: { userProfile?: UserProfile }) =>
                    record.userProfile?.idCardNumber,
                },
                {
                  title: "Điểm",
                  width: 150,
                  align: "center",
                  fixed: "left",
                  render: (_, record) => {
                    return (
                      <Form.Item
                        className="w-full mb-0"
                        name={["list", record.id, "score"]}
                        label=""
                        rules={[
                          {
                            validator: (_, value) =>
                              value >= 1 && value <= 10
                                ? Promise.resolve()
                                : Promise.reject("Chỉ được nhập số từ 1 đến 10"),
                          },
                        ]}
                      >
                        <InputNumber
                          style={{ width: "100%" }}
                          step={1}
                          controls={false}
                          onKeyDown={(e) => {
                            if (e.key === "." || e.key === ",") {
                              e.preventDefault()
                            }
                          }}
                        />
                      </Form.Item>
                    )
                  },
                },
                {
                  title: "Trạng thái",
                  align: "center",
                  dataIndex: "name",
                  width: 150,
                  render: (_, record) =>
                    record?.schoolYearTrainingScore?.length > 0 ? (
                      <Tag
                        color={getTrainingScoreStatusColor(
                          record?.schoolYearTrainingScore[0]?.status
                        )}
                      >
                        {getTrainingScoreStatusLabel(record?.schoolYearTrainingScore[0]?.status)}
                      </Tag>
                    ) : (
                      "--"
                    ),
                },
              ]}
              rowKey="id"
              // rowSelection={{
              //     selectedRowKeys,
              //     onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
              // }}
              data={data}
              pagination={false}
              // pagination={{
              //     current: currentPage,
              //     pageSize: numberOfPages,
              //     total: count,

              //     onChange: (page, pageSize) => {
              //         if (numberOfPages === pageSize) {
              //             setCurrentPage(page)
              //         } else {
              //             setCurrentPage(1)
              //             setNumberOfPages(pageSize)
              //         }
              //     },
              //     showTotal: (total, range) =>
              //         `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
              // }}
            />
          </Form.Item>
        </Form>
      </Col>
    </Row>
  )
}
