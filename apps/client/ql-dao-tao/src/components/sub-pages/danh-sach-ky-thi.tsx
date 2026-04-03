import Select from "@components/commons/select"
import Table from "@components/commons/table"
import TextTruncate from "@components/commons/text-truncate"
import { DEFAULT_PAGINATE_SIZE, EXAMTYPECOLOR } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useExamTypeOptions } from "@hooks/examType"
import { cn, formatDate } from "@lib/utils"
import { diemPhongThiStore, kythiStore } from "@pages/quan-ly-diem/nhap-diem-theo-phach"
import { useStore } from "@tanstack/react-store"
import { $Enums, type ExamList, type Prisma, type SubjectClass } from "@workspace/db/client"
import { useCountExam, useFindManyExam } from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Checkbox, Col, Flex, Input, Row, Tag } from "antd"
import _ from "lodash"
import { useCallback, useMemo, useState } from "react"

export default function KyThi({ setActiveKey }: { setActiveKey: (key: string) => void }) {
  const { can } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { options: examTypeOptions, getExamTypeLabel } = useExamTypeOptions()
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    searchText: "",
    examType: undefined,
  })

  const { examId } = useStore(kythiStore)

  const where: Prisma.ExamWhereInput = useMemo(() => {
    return {
      subjectClass: {
        some: {
          trainingObjectTypeId,
          semesterId,
          ...(filters.examType && filters.examType.length > 0
            ? { examType: { in: filters.examType } }
            : {}),
        },
      },
      lockExamSessions: true,
    }
  }, [trainingObjectTypeId, semesterId, filters])

  const { data = [], refetch } = useFindManyExam({
    where,
    include: {
      subjectVersion: true,
      subjectClass: true,
      _count: {
        select: {
          examRooms: { where: { roomId: { not: null } } },
        },
      },
      examRooms: {
        select: {
          roomId: true,
          capacity: true,
          examList: {
            select: {
              createdExamCode: true,
              lockExamCode: true,
            },
          },
        },
        where: { roomId: { not: null } },
      },
    },
    orderBy: { subjectVersion: { name: "asc" } },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountExam({
    where: { ...where, deletedAt: null },
  })
  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 300),
    []
  )
  const debouncedSearch = useCallback(
    _.debounce((value: string) => {
      setFilters((prev) => ({
        ...prev,
        searchText: value,
      }))
    }, 300),
    []
  )

  return (
    <div className="bg-white">
      <Row gutter={[16, 16]}>
        <Flex gap={8}>
          <Input
            placeholder="Tìm kiếm"
            className="w-60"
            allowClear
            onChange={(e) => debouncedSearch(e.target.value)}
          />
          <Select
            allowClear
            mode="multiple"
            placeholder="Chọn hình thức thi"
            className="w-60"
            options={examTypeOptions.map((opt) => ({
              label: opt.label,
              value: opt.value,
            }))}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                examType: value,
              }))
            }
          />
        </Flex>
        <Col span={24}>
          <Table
            rowKey="id"
            filters={filters}
            setFilters={setFilters}
            onRow={(record) => {
              return {
                onClick: () => {
                  kythiStore.setState({
                    examId: record.id,
                    subjectClassId:
                      record?.subjectClass?.length > 0
                        ? record?.subjectClass?.map((item: any) => item.id)
                        : [],
                  })
                  diemPhongThiStore.setState({ selectedExamListId: undefined })
                  debouncedRefetch()
                },
                onDoubleClick: () => {
                  setActiveKey("2")
                },
                className: cn(examId === record.id ? "bg-orange-200" : ""),
              }
            }}
            maxHeight={"calc(100vh - 390px)"}
            columns={[
              {
                title: "TT",
                width: 35,
                align: "center",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Mã MH",
                dataIndex: "code",
                width: 80,
                type: "input",
                align: "center",
                render: (_, record) => record?.subjectVersion?.code || "",
              },
              {
                title: "Tên môn học",
                dataIndex: "name",
                width: 150,
                type: "input",
                align: "center",
                render: (_, record) => (
                  <div className="flex flex-row items-start">
                    <p>
                      {record.subjectClass?.[0]?.type === $Enums.SubjectClassType.RETAKE ? (
                        <Tag color={"blue"} className="p-0 px-1">
                          Học lại
                        </Tag>
                      ) : record.subjectClass?.[0]?.type === $Enums.SubjectClassType.REEXAM ? (
                        <Tag color={"yellow"} className="p-0 px-1">
                          Thi lại
                        </Tag>
                      ) : null}
                    </p>
                    <p className="text-left">{record?.subjectVersion?.name || ""}</p>
                  </div>
                ),
              },
              {
                title: "Hình thức thi",
                width: 80,
                type: "input",
                align: "center",
                render: (_, record) => {
                  const examType = record?.subjectClass?.[0]?.examType
                  if (!examType) return ""
                  const color = EXAMTYPECOLOR[examType as keyof typeof EXAMTYPECOLOR]

                  const label = getExamTypeLabel(examType)

                  return (
                    <Tag
                      style={{
                        color,
                        borderColor: color,
                        background: "transparent",
                        borderRadius: 12,
                        padding: "0 10px",
                        fontWeight: 500,
                      }}
                    >
                      {label}
                    </Tag>
                  )
                },
              },
              {
                title: "Lớp môn học",
                width: 150,
                type: "input",
                align: "center",
                render: (_, record) => {
                  return record?.subjectClass?.length ? (
                    <TextTruncate
                      arr={record?.subjectClass.map((i: any) => {
                        return {
                          key: i?.id,
                          label: `${i?.code} ${i?.examScoreDaeadline ? formatDate(i?.examScoreDaeadline) : ""}`,
                        }
                      })}
                    />
                  ) : (
                    ""
                  )
                },
              },
              {
                title: "Trạng thái NĐ",
                width: 100,
                align: "center",
                render: (__, record) => {
                  return record.subjectClass?.[0]?.enteredExamScore ? (
                    "Đã nhập điểm thi"
                  ) : record.subjectClass?.[0]?.enteredScore ? (
                    "Đã nhập điểm TX,ĐK"
                  ) : (
                    <div className="text-red-500">Chưa nhập điểm</div>
                  )
                },
              },
              {
                title: "Khóa nhập ĐQT",
                align: "center",
                width: 80,
                render: (_, record) => {
                  return (
                    <Checkbox
                      indeterminate={
                        !record?.subjectClass?.every?.((sc: SubjectClass) => sc.isLockScore) &&
                        record?.subjectClass.some((sc: SubjectClass) => sc.isLockScore)
                      }
                      checked={record?.subjectClass.every((sc: SubjectClass) => sc.isLockScore)}
                    />
                  )
                },
              },
              {
                title: "Khóa DTS",
                align: "center",
                width: 80,
                render: (_, record) => {
                  const lockExamSessions = record.lockExamSessions
                  return <Checkbox checked={lockExamSessions} />
                },
              },
              {
                title: "Đánh phách",
                align: "center",
                width: 60,
                render: (_, record) => {
                  return (
                    <Checkbox
                      indeterminate={
                        !record?.examRooms?.every?.((er: { examList: ExamList[] }) =>
                          er.examList.every((el) => el.createdExamCode)
                        ) &&
                        record?.examRooms?.some((er: { examList: ExamList[] }) =>
                          er.examList?.some((el) => el.createdExamCode)
                        )
                      }
                      checked={record?.examRooms?.every?.((sc: { examList: ExamList[] }) =>
                        sc.examList.every((el) => el.createdExamCode)
                      )}
                    />
                  )
                },
              },
              {
                title: "Khóa phách",
                align: "center",
                width: 60,
                render: (_, record) => {
                  return (
                    <Checkbox
                      indeterminate={
                        !record?.examRooms?.every?.((er: { examList: ExamList[] }) =>
                          er.examList.every((el) => el.lockExamCode)
                        ) &&
                        record?.examRooms?.some((er: { examList: ExamList[] }) =>
                          er.examList?.some((el) => el.lockExamCode)
                        )
                      }
                      checked={record?.examRooms?.every?.((sc: { examList: ExamList[] }) =>
                        sc.examList.every((el) => el.lockExamCode)
                      )}
                    />
                  )
                },
              },
              {
                title: "Số ca thi",
                width: 100,
                align: "center",
                render: (_, record) => {
                  return record?.session
                },
              },
              {
                title: "Số phòng thi",
                width: 100,
                align: "center",
                render: (_, record) => {
                  return record?._count.examRooms
                },
              },
            ]}
            data={data}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,
              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page)
                } else {
                  setCurrentPage(1)
                  setNumberOfPages(pageSize)
                }
              },
            }}
          />
        </Col>
      </Row>
    </div>
  )
}
