import { DatabaseOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import DownloadIcon from "@components/icons/download"
import EditIcon from "@components/icons/edit"
import PrintIcon from "@components/icons/print"
import { formatDate } from "@lib/utils"
import {
  useCountExamBank,
  useFindManyExamBank,
  useUpdateExamBank,
  useFindUniqueExam,
} from "@workspace/db/hooks"
import { useStore } from "@tanstack/react-store"
import { Button, Flex, Input, message, Row, Select, Space } from "antd"
import dayjs from "dayjs"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { store } from "../index"
import { examTypeOptions } from "@workspace/libs/constants"

export default function ExamListPage() {
  const { onOpen: onOpenExamList } = useDisclosure<{
    id?: string | null
    subjectVersionId?: string
  }>({
    tag: "SinhDeThuCongModal",
  })

  const { onOpen: onOpenExamImport } = useDisclosure({
    tag: "ExamImportModal",
    onClose: () => {
      setCurrentPage(1)
      refetchExams()
      refetchCount()
    },
  })

  const [filters, setFilters] = useState<any>({
    exam: "",
    examCode: "",
    name: "",
    examRoom: undefined,
    subjectVersionId: undefined,
    examType: undefined,
    questions: undefined,
    examDay: undefined,
    createdAt: undefined,
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const selectedExamId = useStore(store, (state) => state.selectedExamId)
  const subjectVersionId = useStore(store, (state) => state.subjectVersionId)

  const { data: dataExam } = useFindUniqueExam(
    {
      where: { id: selectedExamId },
      include: {
        subjectVersion: true,
        subjectClass: {
          include: {
            _count: {
              select: {
                subjectClassStudent: true,
              },
            },
          },
        },
        examRooms: {
          include: {
            examList: true,
          },
        },
      },
    },
    { enabled: !!selectedExamId }
  )

  const where = useMemo(() => {
    const examFilter: any = {}
    if (filters.examRoom) {
      examFilter.examRooms = {
        some: {
          room: {
            name: { contains: filters.examRoom },
          },
        },
      }
    }

    if (filters.name) {
      examFilter.semester = {
        name: { contains: filters.name },
      }
    }
    if (filters.studentCount) {
      examFilter.examRooms = {
        some: {
          ...(examFilter.examRooms?.some ?? {}),
          examList: {
            _count: {
              equals: filters.studentCount,
            },
          },
        },
      }
    }

    return {
      examId: selectedExamId,
      ...(filters.exam &&
        filters.exam !== "" && {
          OR: [
            {
              examCode: {
                contains: filters?.exam || "",
              },
            },
          ],
        }),

      ...(filters.examCode &&
        filters.examCode !== "" && {
          examCode: {
            contains: filters?.examCode || "",
          },
        }),

      ...(Object.keys(examFilter).length && {
        exam: examFilter,
      }),

      ...(filters.subjectClass && {
        subjectClass: {
          name: { contains: filters.subjectClass },
        },
      }),
      ...(filters.name &&
        filters.name !== "" && {
          exam: {
            semester: {
              name: {
                contains: filters.name,
              },
            },
          },
        }),
      ...(filters.examType && {
        exam: {
          ...examFilter,
          subjectVersion: {
            examType: {
              in: filters.examType,
            },
          },
        },
      }),
      ...(filters?.examDay?.length === 2
        ? {
            subjectClass: {
              examDate: {
                gte: dayjs(filters.examDay?.[0], "DD/MM/YYYY").toDate(),
                lte: dayjs(filters.examDay?.[1], "DD/MM/YYYY").toDate(),
              },
            },
          }
        : {}),
      ...(filters?.createdAt?.length === 2
        ? {
            createdAt: {
              gte: dayjs(filters.createdAt?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.createdAt?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
    }
  }, [selectedExamId, filters])

  const { onOpen: printExamBank } = useDisclosure<{
    id: string
  }>({
    tag: "PrintExamBank",
  })

  const { onOpen: printExplanation } = useDisclosure<{
    id: string
    timestamp?: number
  }>({
    tag: "PrintExplanation",
  })

  const { onOpen: printBatchExamBank } = useDisclosure<{
    ids: string[]
  }>({
    tag: "PrintBatchExamBank",
  })

  const { onOpen: printBatchExplanation } = useDisclosure<{
    ids: string[]
  }>({
    tag: "PrintBatchExplanation",
  })

  const { data: exams = [], refetch: refetchExams } = useFindManyExamBank(
    {
      where: {
        ...where,
        deletedAt: null,
      },
      include: {
        subjectClass: {
          select: {
            id: true,
            name: true,
            examDate: true,
          },
        },
        exam: {
          include: {
            semester: true,
            subjectVersion: {
              select: {
                id: true,
                name: true,
                code: true,
                examType: true,
              },
            },
            examRooms: {
              include: {
                room: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                examList: true,
              },
            },
          },
        },
        questions: {
          include: {
            question: true,
          },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: [
        ...(filters?.questions
          ? [
              {
                questions: {
                  _count: filters?.questions,
                },
              },
            ]
          : []),
        {
          createdAt: "desc",
        },
      ],
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    {
      enabled: !!selectedExamId,
    }
  )

  const { data: count, refetch: refetchCount } = useCountExamBank(
    {
      where: {
        ...where,
        deletedAt: null,
      },
    },
    {
      enabled: !!selectedExamId,
    }
  )
  const { mutateAsync: update } = useUpdateExamBank()
  const { onOpen: onOpenExamListAuto } = useDisclosure<{ id?: string | null }>({
    tag: "SinhDeModal",
    onClose: () => {
      setCurrentPage(1)
      refetchExams()
      refetchCount()
    },
  })

  const { subjectVersionOptions, examRoomOptions, studentCountOptions } = useMemo(() => {
    const subjectMap = new Map<string, string>() // subjectVersionId -> label
    const roomSet = new Set<string>() // room.name
    const roomStudentMap = new Map<string, number>() // roomId -> total students

    exams.forEach((examItem) => {
      const exam = examItem?.exam

      const sv = exam?.subjectVersion
      if (sv?.id) {
        subjectMap.set(sv.id, `${sv.code ?? ""} - ${sv.name}`)
      }

      exam?.examRooms?.forEach((er) => {
        if (er?.room?.name) {
          roomSet.add(er.room.name)
        }

        if (er?.roomId) {
          roomStudentMap.set(
            er.roomId,
            (roomStudentMap.get(er.roomId) ?? 0) + (er.examList?.length ?? 0)
          )
        }
      })
    })

    // build options
    const subjectVersionOptions = Array.from(subjectMap, ([value, label]) => ({
      value,
      label,
    }))

    const examRoomOptions = Array.from(roomSet, (name) => ({
      value: name,
      label: name,
    }))

    const studentCountOptions = Array.from(new Set(roomStudentMap.values()))
      .sort((a, b) => a - b)
      .map((n) => ({
        value: n,
        label: `${n} thí sinh`,
      }))

    return {
      subjectVersionOptions,
      examRoomOptions,
      studentCountOptions,
    }
  }, [exams])

  const totalStudents = useMemo(() => {
    let total = 0
    dataExam?.subjectClass?.forEach((sc: any) => {
      total += sc?._count?.subjectClassStudent || 0
    })
    return total
  }, [dataExam])

  async function handleDelete(id: string) {
    try {
      await update({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      })

      message.success("Xoá đề thi thành công")
    } catch (error: any) {
      if (error?.info?.message) {
        message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    }
  }

  const HighlightText = ({ text, searchText }: { text: string; searchText?: string }) => {
    if (!searchText) return <>{text}</>

    const parts = text.split(new RegExp(`(${searchText})`, "gi"))

    return (
      <>
        {parts.map((part) =>
          part.toLowerCase() === searchText.toLocaleLowerCase() ? (
            <span key={part} className="text-yellow-800 bg-yellow-300 font-semibold">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    )
  }

  return (
    <div>
      {/* Search + Buttons */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm kiếm"
          prefix={<SearchOutlined />}
          style={{ width: 260 }}
          value={filters.exam}
          onChange={(e) => {
            setFilters({
              ...filters,
              exam: e.target.value,
            })
          }}
        />

        <Space>
          <Button
            type="primary"
            disabled={selectedRowKeys.length === 0}
            onClick={() => {
              printBatchExamBank({
                ids: selectedRowKeys,
              })
            }}
          >
            Tải, In đề hàng loạt
          </Button>
          <Button
            type="primary"
            disabled={selectedRowKeys.length === 0}
            onClick={() => {
              printBatchExplanation({
                ids: selectedRowKeys,
              })
            }}
          >
            Tải, In đáp án hàng loạt
          </Button>
          <Button type="primary" onClick={onOpenExamImport}>
            Import đề thi
          </Button>
          <Button
            onClick={() => onOpenExamList({ id: null, subjectVersionId })}
            type="primary"
            icon={<PlusOutlined />}
          >
            Tạo đề thủ công
          </Button>
          <Button
            onClick={() => {
              onOpenExamListAuto({ id: null })
            }}
            icon={<DatabaseOutlined />}
          >
            Sinh đề
          </Button>
        </Space>
      </Flex>
      <Flex gap={8} style={{ marginBottom: 16 }}>
        <Select
          allowClear
          disabled
          placeholder="Môn thi"
          style={{ width: 280 }}
          options={
            subjectVersionOptions.length > 0
              ? subjectVersionOptions
              : dataExam?.subjectVersion
                ? [
                    {
                      value: dataExam.subjectVersion.id,
                      label: `${dataExam.subjectVersion.code ?? ""} - ${dataExam.subjectVersion.name}`,
                    },
                  ]
                : []
          }
          value={
            filters.subjectVersionId ??
            exams[0]?.exam?.subjectVersion?.id ??
            dataExam?.subjectVersion?.id
          }
          onChange={(value) => setFilters({ ...filters, subjectVersionId: value })}
        />

        {/* <Select
          allowClear
          placeholder="Phòng thi"
          style={{ width: 200 }}
          options={examRoomOptions}
          value={filters.examRoom ?? examRoomOptions[0]?.value}
          onChange={(examRoom) => setFilters((prev: typeof filters) => ({ ...prev, examRoom }))}
        /> */}

        <div
          style={{
            width: 160,
            height: 32,
            border: "1px solid #d9d9d9",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            background: "#fafafa",
            fontWeight: 500,
            opacity: 1,
            pointerEvents: "none",
          }}
        >
          {totalStudents} thí sinh
        </div>
      </Flex>

      {/* Table */}
      <Table
        rowSelection={{
          type: "checkbox",
          selectedRowKeys,
          onChange: (selectedKeys) => {
            setSelectedRowKeys(selectedKeys as string[])
          },
        }}
        onRow={(record) => ({
          onClick: (e) => {
            // Prevent toggle if clicking on action buttons or interactive elements
            const target = e.target as HTMLElement
            if (
              target.closest(".ant-btn") ||
              target.closest("button") ||
              target.closest("a") ||
              target.closest('[role="button"]') ||
              target.closest("svg")
            ) {
              return
            }

            // Toggle selection
            setSelectedRowKeys((prev) => {
              if (prev.includes(record.id)) {
                return prev.filter((key) => key !== record.id)
              }
              return [...prev, record.id]
            })
          },
          style: { cursor: "pointer" },
        })}
        filters={filters}
        setFilters={(value) => {
          setFilters(value)
          setCurrentPage(1)
        }}
        columns={[
          {
            title: "STT",
            dataIndex: "index",
            width: 60,
            align: "center",
            render: (_, __, index) => {
              return (currentPage - 1) * numberOfPages + index + 1
            },
          },
          {
            title: "Mã đề",
            dataIndex: "examCode",
            width: 100,
            type: "input",
            render: (__, record) => {
              return (
                <div className="text-left">
                  <HighlightText text={record?.examCode || ""} searchText={filters.exam} />
                </div>
              )
            },
          },
          {
            title: "Kỳ thi",
            dataIndex: "name",
            type: "input",
            width: 150,
            render: (__, record) => {
              return <span>{record?.exam?.semester?.name || ""}</span>
            },
          },
          {
            title: "Hình thức thi",
            dataIndex: "examType",
            width: 130,
            type: "select",
            options: examTypeOptions.map((opt) => ({
              label: opt.label,
              value: opt.value,
            })),
            align: "center" as const,
            render: (__, record) => {
              const examType = record?.exam?.subjectVersion?.examType
              return examTypeOptions.find((opt) => opt.value === examType)?.label || ""
            },
          },
          {
            title: "Ngày thi",
            dataIndex: "examDay",
            width: 150,
            type: "date",
            align: "center" as const,
            render: (_, record) => {
              return record?.subjectClass?.examDate
                ? formatDate(record?.subjectClass?.examDate)
                : ""
            },
          },
          {
            title: "Ngày tạo đề",
            dataIndex: "createdAt",
            width: 130,
            type: "date",
            align: "center" as const,
            render: (_, record) => {
              return record?.createdAt ? formatDate(record?.createdAt) : ""
            },
          },
          {
            title: "Số câu hỏi trong đề",
            dataIndex: "questions",
            width: 150,
            type: "order",
            align: "center" as const,
            render: (_, record) => record?._count?.questions || 0,
          },
          {
            title: "Lớp môn học",
            align: "center",
            width: 220,
            render: (_, record) => {
              return record?.subjectClass?.name || ""
            },
          },
          {
            title: "Thao tác",
            dataIndex: "actions",
            align: "center",
            width: 140,
            render: (_, record) => {
              return (
                <Row className="justify-center gap-2">
                  <PrintIcon
                    title="Tải đề thi"
                    onClick={() =>
                      printExamBank({
                        id: record.id,
                      })
                    }
                  />
                  <DownloadIcon
                    title="Tải đáp án"
                    onClick={() =>
                      printExplanation({
                        id: record.id,
                      })
                    }
                  />
                  <EditIcon
                    onClick={() => onOpenExamList({ id: record.id, subjectVersionId })}
                    disabled={record.isLock}
                  />
                  <DeleteIcon
                    popConfirm={{
                      onConfirm: () => handleDelete(record.id),
                    }}
                    disabled={record.isLock}
                  />
                </Row>
              )
            },
          },
        ]}
        dataSource={exams}
        locale={{ emptyText: "Không có dữ liệu" }}
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
          showTotal: (total, range) => `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
        }}
        bordered={false}
        scroll={{ x: "max-content" }}
        rowKey="id"
      />
    </div>
  )
}
