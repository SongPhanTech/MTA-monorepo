import Table from "@components/commons/table"
import ScoreInputCell, { ScoreInputHandle } from "@components/commons/score-input-cell"
import { Button, Col, Flex, Form, message, Row } from "antd"
import { FilterProps } from "@constants/type"
import { useEffect, useMemo, useRef, useState } from "react"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { useAbility } from "@workspace/permissions/hooks"
import { useRouter } from "next/router"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useCountStudent, useFindManyStudent } from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import dayjs from "dayjs"
import { UserProfile } from "@workspace/db"
import {
  useStudentTrainingTypeOptions,
  useTrainingScoreStatusStatusOptions,
} from "@hooks/studentTrainingType"
import { Save } from "lucide-react"
import useSpinner from "@hooks/spinner"
import { sqlTransaction } from "@workspace/libs/api/model"

export default function SemesterTrainingScore({
  selectedFixedClass,
}: {
  selectedFixedClass?: string
}) {
  const { showSpinner, hideSpinner } = useSpinner()
  const [form] = Form.useForm<{ list: Record<string, { score: number | null }> }>()
  const router = useRouter()
  const { id: semesterId } = useSemesterStore()
  const { can } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    idCardNumber: "",
  })
  const inputRefs = useRef<Array<ScoreInputHandle>>([])

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

  const where = useMemo(() => {
    const userProfile: Record<string, unknown> = {}
    if (filters.code) {
      userProfile.code = {
        contains: filters.code,
        mode: "insensitive" as const,
      }
    }
    if (filters.name) {
      userProfile.OR = [
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
      ]
    }
    if (filters.idCardNumber) {
      userProfile.idCardNumber = {
        contains: filters.idCardNumber,
        mode: "insensitive" as const,
      }
    }
    return {
      fixedClass: {
        id: selectedFixedClass,
      },
      ...(Object.keys(userProfile).length > 0 ? { userProfile } : {}),
    }
  }, [filters, selectedFixedClass])

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

      const listTransaction: any = []

      if (listCreate.length > 0) {
        listTransaction.push({
          model: "SemesterTrainingScore",
          operation: "createMany",
          data: {
            data: listCreate.map((t: any) => ({
              studentId: t.id,
              score: t.score,
              semesterId: semesterId,
              status: "APPROVED",
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
                status: "APPROVED",
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
    inputRefs.current = []
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

  return (
    <Row gutter={[0, 0]}>
      <Col span={24}>
        <Flex justify="end" align="center">
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
                  render: (_, record) => record.userProfile?.code || "",
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
                  //  fixed: "left",
                  render: (_, record, index) => (
                    <ScoreInputCell rowId={record.id} rowIndex={index} inputRefs={inputRefs} />
                  ),
                },
                // {
                //   title: "Trạng thái",
                //   align: "center",
                //   dataIndex: "name",
                //   width: 150,
                //   render: (_, record) =>
                //     record?.semesterTrainingScore?.length > 0 ? (
                //       <Tag
                //         color={getTrainingScoreStatusColor(
                //           record?.semesterTrainingScore[0]?.status
                //         )}
                //       >
                //         {getTrainingScoreStatusLabel(record?.semesterTrainingScore[0]?.status)}
                //       </Tag>
                //     ) : (
                //       "--"
                //     ),
                // },
              ]}
              rowKey="id"
              data={data}
              pagination={false}
            />
          </Form.Item>
        </Form>
      </Col>
    </Row>
  )
}
