import Table from "@components/commons/table"
import { Button, Col, Flex, Form, InputNumber, message, Row, Tag } from "antd"
import { FilterProps } from "@constants/type"
import { Key, useEffect, useMemo, useState } from "react"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { useAbility } from "@workspace/permissions/hooks"
import { useRouter } from "next/router"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useCountStudent, useFindManyStudent } from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import dayjs from "dayjs"
import { UserProfile } from "@workspace/db"
import type { ScoreConvert } from "@workspace/db/client"
import {
  useStudentTrainingTypeOptions,
  useTrainingScoreStatusStatusOptions,
} from "@hooks/studentTrainingType"
import { Save } from "lucide-react"
import useSpinner from "@hooks/spinner"
import { sqlTransaction } from "@workspace/libs/api/model"

export default function SemesterTrainingScore({
  selectedFixedClass,
  scoreConverts = [],
}: {
  selectedFixedClass?: string
  scoreConverts?: ScoreConvert[]
}) {
  const { showSpinner, hideSpinner } = useSpinner()
  const [form] = Form.useForm<{ list: Record<string, { score: number | null }> }>()
  const router = useRouter()
  const { id: semesterId } = useSemesterStore()
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    idCardNumber: "",
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const {
    options: studentTrainingTypeOptions,
    getStudentTrainingTypeLabel,
    getStudentTrainingTypeColor,
  } = useStudentTrainingTypeOptions()
  const {
    statusOptions: trainingScoreStatusOptions,
    getTrainingScoreStatusLabel,
    getTrainingScoreStatusColor,
  } = useTrainingScoreStatusStatusOptions()

  const getScoreRank = (score: number | null | undefined) => {
    if (score == null || !scoreConverts?.length) return null
    return (
      scoreConverts.find((sc) => score >= Number(sc.base10Min) && score <= Number(sc.base10Max)) ??
      null
    )
  }

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
        semesterTrainingScore: {
          where: {
            semesterId,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    },
    {
      enabled: !!selectedFixedClass,
    }
  )

  const { data: count, refetch: refetchCount } = useCountStudent(
    {
      where: {
        ...where,
        deletedAt: null,
      },
    },
    {
      enabled: !!selectedFixedClass,
    }
  )

  const handleApproved = async () => {
    try {
      showSpinner()
      if (selectedRowKeys?.length === 0) return
      const res = await sqlTransaction([
        {
          model: "SemesterTrainingScore" as const,
          operation: "updateMany",
          data: {
            where: {
              studentId: {
                in: selectedRowKeys,
              },
              semesterId,
            },
            data: {
              status: "APPROVED",
            },
          },
        },
      ])
      if (res?.status === 200) {
        message.success("Phê duyệt điểm rèn luyện thành công")
        refetch()
      }
      hideSpinner()
    } catch (error) {
      message.error("Phê duyệt điểm rèn luyện thất bại")
      hideSpinner()
    }
  }

  const handleRejected = async () => {
    try {
      showSpinner()
      if (selectedRowKeys?.length === 0) return
      const res = await sqlTransaction([
        {
          model: "SemesterTrainingScore" as const,
          operation: "updateMany",
          data: {
            where: {
              studentId: {
                in: selectedRowKeys,
              },
              semesterId,
            },
            data: {
              status: "REJECTED",
            },
          },
        },
      ])
      if (res?.status === 200) {
        message.success("Từ chối điểm rèn luyện thành công")
        refetch()
      }
      hideSpinner()
    } catch (error) {
      message.error("Từ chối điểm rèn luyện thất bại")
      hideSpinner()
    }
  }

  const handleSave = async () => {
    try {
      showSpinner()
      const dataSubmit = form.getFieldsValue()
      const keys = Object.keys(dataSubmit.list)

      const error = Object.values(dataSubmit.list).find(
        (i: any) => Number(i?.score) > 10 || Number(i?.score) < 0
      )
      if (error) {
        message.error("Vui lòng nhập điểm từ 0 đến 10")
        return
      }
      const listCreate: any = []
      const listUpdate: any = []

      Object.entries(dataSubmit.list).forEach(([key, value]) => {
        const item: any = data.find((i) => i.id === key)
        if (item?.semesterTrainingScore?.length > 0 && value?.score) {
          listUpdate.push({
            ...item,
            semesterTrainingScoreId: item.semesterTrainingScore[0].id,
            score: value.score,
          })
        } else if (item?.semesterTrainingScore?.length === 0 && value?.score) {
          listCreate.push({
            ...item,
            score: value.score,
          })
        }
      })

      let listTransaction: any = []
      if (listCreate.length > 0) {
        listTransaction.push({
          model: "SemesterTrainingScore",
          operation: "createMany",
          data: {
            data: listCreate.map((t: any) => ({
              studentId: t.id,
              score: t.score,
              semesterId: semesterId,
              status: can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_REN_LUYEN, "XEM_TAT_CA")
                ? "APPROVED"
                : "PENDING",
            })),
          },
        })
      }
      if (listUpdate.length > 0) {
        listUpdate.forEach((t: any) => {
          listTransaction.push({
            model: "SemesterTrainingScore",
            operation: "update",
            data: {
              where: {
                id: t.semesterTrainingScoreId,
              },
              data: {
                score: t.score,
                status: can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_REN_LUYEN,
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
          message.success("Lưu điểm rèn luyện thành công")
          refetch()
        }
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi khi lưu điểm rèn luyện học kỳ")
    } finally {
      hideSpinner()
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (data?.length > 0) {
      form.setFieldsValue({
        list: data.reduce((acc, cur) => {
          if (!acc) return {}
          acc[cur.id] = {
            ...cur,
            score: cur.semesterTrainingScore[0]?.score,
          }
          return acc
        }, {} as any),
      })
    }
  }, [data])
  function ScoreRankCell({
    recordId,
    form,
    getScoreRank,
  }: {
    recordId: string
    form: any
    getScoreRank: (score: number | null | undefined) => any
  }) {
    const score = Form.useWatch(["list", recordId, "score"], form)
    const rank = getScoreRank(score)
    return rank ? <Tag color="blue">{rank.classification}</Tag> : <span>--</span>
  }
  return (
    <Row gutter={[0, 0]}>
      <Col span={24}>
        <Flex justify="end" align="center">
          {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_REN_LUYEN, "XEM_TAT_CA") && (
            <>
              <Button
                type="default"
                className="mr-3"
                disabled={selectedRowKeys.length === 0}
                onClick={handleRejected}
              >
                Từ chối
              </Button>
              <Button
                type="primary"
                className="mr-3"
                disabled={selectedRowKeys.length === 0}
                onClick={handleApproved}
              >
                Phê duyệt
              </Button>
            </>
          )}
          {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_REN_LUYEN, "SUA") && (
            <Button type="primary" onClick={handleSave}>
              <Save stroke="white" />
              Lưu
            </Button>
          )}
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
                  render: (_, record) => (
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
                  ),
                },
                {
                  title: "Xếp loại",
                  width: 120,
                  align: "center",
                  render: (_, record) => (
                    <ScoreRankCell recordId={record.id} form={form} getScoreRank={getScoreRank} />
                  ),
                },
                {
                  title: "Trạng thái",
                  align: "center",
                  dataIndex: "name",
                  width: 150,
                  render: (_, record) =>
                    record?.semesterTrainingScore?.length > 0 ? (
                      <Tag
                        color={getTrainingScoreStatusColor(
                          record?.semesterTrainingScore[0]?.status
                        )}
                      >
                        {getTrainingScoreStatusLabel(record?.semesterTrainingScore[0]?.status)}
                      </Tag>
                    ) : (
                      "--"
                    ),
                },
              ]}
              rowKey="id"
              rowSelection={{
                selectedRowKeys,
                onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
                getCheckboxProps: (record) => ({
                  disabled: record.semesterTrainingScore?.length <= 0,
                }),
              }}
              data={data}
              pagination={false}
            />
          </Form.Item>
        </Form>
      </Col>
    </Row>
  )
}
