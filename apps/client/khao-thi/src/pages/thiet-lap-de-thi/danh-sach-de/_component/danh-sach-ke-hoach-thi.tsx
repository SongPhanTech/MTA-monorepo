import HtmlTruncate from "@components/commons/html-truncate"
import Table from "@components/commons/table"
import { useStore } from "@tanstack/react-store"
import type { SubjectClass } from "@workspace/db/client"
import { useCountExam, useFindManyExam } from "@workspace/db/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"
import { Checkbox, Col, Flex, Input, Popover, Row } from "antd"
import dayjs from "dayjs"
import { useCallback, useMemo, useState } from "react"
import { store } from "../index"
import DatePicker from "@components/commons/date-picker"
import { examTypeOptions } from "@workspace/libs/constants"
export default function DanhSachKeHoachThi() {
  const { id: semesterId } = useSemesterStore()
  const selectedExamId = useStore(store, (state) => state.selectedExamId)
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(10)

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const updateStateselectedExamId = (value: string, item: string) => {
    store.setState((state: any) => {
      return {
        ...state,
        selectedExamId: value,
        subjectVersionId: item,
      }
    })
  }
  const [filters, setFilters] = useState<any>({
    searchText: "",
    examType: undefined,
    examRoom: undefined,
    examDay: undefined,
  })

  const where = useMemo(() => {
    const result: any = {
      semesterId,
      deletedAt: null,
      subjectVersion: {
        ...(trainingObjectTypeId && { trainingObjectTypeId }),
        ...(filters.searchText && {
          OR: [
            { code: { contains: filters.searchText, mode: "insensitive" } },
            { name: { contains: filters.searchText, mode: "insensitive" } },
          ],
        }),
      },
    }

    if (filters.examDay) {
      const d = new Date(filters.examDay)

      const start = new Date(d)
      start.setHours(0, 0, 0, 0)

      const end = new Date(d)
      end.setHours(23, 59, 59, 999)

      result.subjectClass = {
        some: {
          examDate: {
            gte: start,
            lt: end,
          },
        },
      }
    }

    let validExamTypes: string[] = []
    if (filters.examType && filters.examType.length > 0) {
      validExamTypes = filters.examType
    } else {
      validExamTypes = ["OfflineWritten", "OnlineWritten", "Oral", "Other"]
    }

    result.subjectVersion = {
      ...result.subjectVersion,
      examType: {
        in: validExamTypes,
      },
    }

    if (filters.examRoom) {
      result.examRooms = {
        some: {
          room: {
            name: {
              contains: filters.examRoom,
            },
          },
        },
      }
    }

    return result
  }, [
    filters.searchText,
    filters.examDay,
    filters.examType,
    filters.examRoom,
    semesterId,
    trainingObjectTypeId,
  ])

  const { data: exams = [] } = useFindManyExam(
    {
      where,
      include: {
        subjectVersion: {
          include: {
            subject: true,
            managementOrganization: true,
            examFramework: {
              include: {
                examMatrixs: true,
              },
            },
            trainingObjectType: {
              select: {
                name: true,
              },
            },
          },
        },
        semester: true,
        examRooms: {
          include: {
            examList: true,
            room: {
              select: {
                name: true,
                examCapacity: true,
                building: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        examBank: {
          include: {
            examMatrix: {
              include: {
                examFramework: true,
              },
            },
          },
        },
        subjectClass: {
          select: {
            name: true,
            id: true,
            code: true,
            examDate: true,
            _count: {
              select: {
                subjectClassStudent: true,
              },
            },
          },
        },
      },
      orderBy: {
        subjectVersionId: "asc",
      },
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    {
      enabled: !!semesterId,
    }
  )

  const formatDate = (date?: string | Date) => {
    if (!date) return ""
    const d = new Date(date)
    return d.toLocaleDateString("vi-VN")
  }

  const { data: count } = useCountExam(
    {
      where,
    },
    {
      enabled: !!semesterId,
    }
  )

  const debouncedSearch = useCallback((value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      searchText: value,
    }))
    setCurrentPage(1)
  }, [])

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
    <Row gutter={[8, 0]}>
      <Col span={24}>
        <Flex justify="space-between" align="center">
          <Flex gap={8}>
            <Input
              placeholder="Tìm kiếm"
              className="w-60"
              allowClear
              onChange={(e) => debouncedSearch(e.target.value)}
            />
            <DatePicker
              placeholder="Chọn ngày thi"
              allowClear
              format={{
                format: "DD/MM/YYYY",
                type: "mask",
              }}
              onChange={(date) => {
                setFilters((prev: any) => ({
                  ...prev,
                  examDay: date ? date.toDate() : undefined,
                }))
                setCurrentPage(1)
              }}
              value={filters.examDay ? dayjs(filters.examDay) : null}
            />
          </Flex>
        </Flex>
      </Col>

      <Col span={24}>
        <Table
          rowKey="id"
          style={{
            marginTop: "10px",
          }}
          filters={filters}
          setFilters={(value: any) => {
            // Reset to initial state if all filters are cleared
            const isCleared =
              !value.searchText && !value.examType && !value.examRoom && !value.examDay
            setFilters(
              isCleared
                ? {
                    searchText: "",
                    examType: undefined,
                    examRoom: undefined,
                    examDay: undefined,
                  }
                : value
            )
            setCurrentPage(1)
          }}
          onChange={(_, __, ___, extra) => {
            if (extra.action === "paginate") {
            }
          }}
          onRow={(record) => ({
            className: cn(
              selectedExamId === record.id
                ? "!bg-orange-200 hover:!bg-orange-200 [&>td]:!bg-orange-200 [&>td]:hover:!bg-orange-200"
                : ""
            ),
            onClick: (e) => {
              const target = e.target as HTMLElement
              if (
                target.closest(".ant-select") ||
                target.closest(".ant-popover") ||
                target.closest(".ant-input") ||
                target.closest(".ant-table-row-selection")
              ) {
                e.stopPropagation()
                return
              }
              updateStateselectedExamId(record?.id, record?.subjectVersionId)
            },
          })}
          data={exams}
          columns={[
            {
              title: "TT",
              align: "center",
              width: 50,
              render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
            },
            {
              title: "Môn thi",
              align: "center",
              width: 300,
              dataIndex: "searchText",
              type: "input",
              render: (_, record) => {
                const code = record.subjectVersion?.code || ""
                const name = record.subjectVersion?.name || ""

                return (
                  <div className="text-left">
                    <span className="text-black-600 font-semibold mr-1">
                      <HighlightText text={code} searchText={filters.searchText} />
                    </span>
                    -
                    <span className="ml-1">
                      <HighlightText text={name} searchText={filters.searchText} />
                    </span>
                  </div>
                )
              },
            },
            {
              title: "Số SV",
              align: "center",
              width: 50,
              render: (_, record) => {
                let total = 0
                record?.subjectClass?.forEach(
                  (sc: SubjectClass & { _count?: { subjectClassStudent: number } }) => {
                    total += sc?._count?.subjectClassStudent || 0
                  }
                )
                return total
              },
            },
            {
              title: "Khóa DTS",
              align: "center",
              width: 60,
              render: (_, record) => {
                const lockExamSessions = record.lockExamSessions
                return <Checkbox checked={lockExamSessions} />
              },
            },
            {
              title: "Phòng thi",
              align: "center",
              width: 100,
              render: (_, record) => {
                if (!record?.examRooms || record.examRooms?.length === 0) {
                  return <span className="text-gray-400 text-left">Chưa có phòng thi</span>
                }

                const totalRooms = record.examRooms.length
                const displayLimit = 3 // Hiển thị tối đa 3 phòng
                const displayRooms = record.examRooms.slice(0, displayLimit)
                const remainingCount = totalRooms - displayLimit

                // Nội dung đầy đủ cho Popover
                const fullContent = (
                  <div className="max-h-60 overflow-y-auto">
                    {record.examRooms.map((examRoom: any) => (
                      <div key={examRoom.id} className="py-1">
                        {examRoom.room?.name}
                      </div>
                    ))}
                  </div>
                )

                return (
                  <div className="text-center">
                    {displayRooms.map((examRoom: any) => (
                      <div key={examRoom.id}>{examRoom.room?.name}</div>
                    ))}
                    {remainingCount > 0 && (
                      <Popover content={fullContent} title="Tất cả phòng thi">
                        <span className="text-blue-600 cursor-pointer hover:underline">
                          + {remainingCount} phòng khác
                        </span>
                      </Popover>
                    )}
                  </div>
                )
              },
            },
            {
              title: "Giảng đường",
              align: "center",
              width: 100,
              render: (_, record) => {
                if (!record?.examRooms || record.examRooms?.length === 0) {
                  return null
                }

                const displayLimit = 3
                const displayRooms = record.examRooms.slice(0, displayLimit)
                const remainingCount = record.examRooms.length - displayLimit

                const fullContent = (
                  <div className="max-h-60 overflow-y-auto">
                    {record.examRooms.map((examRoom: any) => (
                      <div key={examRoom.id} className="py-1">
                        {examRoom.room?.building?.name || ""}
                      </div>
                    ))}
                  </div>
                )

                return (
                  <div className="text-center">
                    {displayRooms.map((examRoom: any) => (
                      <div key={examRoom.id}>{examRoom.room?.building?.name || ""}</div>
                    ))}
                    {remainingCount > 0 && (
                      <Popover content={fullContent} title="Tất cả giảng đường">
                        <span className="text-blue-600 cursor-pointer hover:underline">
                          + {remainingCount} khác
                        </span>
                      </Popover>
                    )}
                  </div>
                )
              },
            },
            {
              title: "Lớp môn học",
              align: "center",
              width: 150,
              render: (_, record) => {
                return record?.subjectClass.length > 0 ? (
                  <span>
                    {record?.subjectClass
                      .map((i: SubjectClass) => `${i?.code || ""}-${i?.name || ""}`)
                      .join(", ")}
                  </span>
                ) : (
                  ""
                )
              },
            },
            {
              title: "Đối tượng đào tạo",
              align: "center",
              width: 100,
              render: (_, record) => {
                return record.subjectVersion?.trainingObjectType?.name || ""
              },
            },
            {
              title: "Ngày thi",
              align: "center",
              width: 100,
              type: "date",
              dataIndex: "examDay",
              render: (_, record) => {
                if (!record?.subjectClass?.length) return ""

                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const examDays = record.subjectClass
                  .map((e: any) => e.examDate)
                  .filter(Boolean)
                  .map((d: any) => new Date(d))
                  .sort((a: Date, b: Date) => a.getTime() - b.getTime())

                if (!examDays.length) return ""

                const uniqueExamDays = Array.from(
                  new Set(examDays.map((d: Date) => d.getTime()))
                ).map((time: any) => new Date(time))

                return (
                  <HtmlTruncate>
                    <ul className="list-disc pl-4">
                      {uniqueExamDays.map((day: Date, index: number) => {
                        const isExpired = day < today
                        return (
                          <li
                            key={index}
                            className={
                              isExpired
                                ? "text-red-600 font-semibold"
                                : "text-green-600 font-semibold"
                            }
                          >
                            {formatDate(day)}
                          </li>
                        )
                      })}
                    </ul>
                  </HtmlTruncate>
                )
              },
            },
            {
              title: "Khung đề / Ma trận",
              align: "center",
              width: 100,
              render: (_, record) => {
                const examFramework = record?.subjectVersion?.examFramework ?? []

                const hasFramework = examFramework.length > 0

                const hasMatrix = examFramework.some((f: any) => f.examMatrixs?.length > 0)

                return (
                  <div className="flex flex-col items-center gap-1">
                    <span className={hasFramework ? "text-green-600" : "text-red-400"}>
                      Khung đề: {hasFramework ? "✔" : "✖"}
                    </span>
                    <span className={hasMatrix ? "text-green-600" : "text-red-400"}>
                      Ma trận: {hasMatrix ? "✔" : "✖"}
                    </span>
                  </div>
                )
              },
            },
            {
              title: "Hình thức thi",
              align: "center",
              width: 100,
              dataIndex: "examType",
              type: "select",
              options: examTypeOptions.map((opt) => ({
                label: opt.label,
                value: opt.value,
              })),
              render: (_, record) => {
                const examType = record?.subjectVersion?.examType
                return examTypeOptions.find((opt) => opt.value === examType)?.label || ""
              },
            },
            {
              title: "Đã tạo đề",
              align: "center",
              width: 100,
              render: (_, record) => {
                const lockExamSessions = record?.examBank?.length > 0
                return <Checkbox checked={lockExamSessions} />
              },
            },
          ]}
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
        />
      </Col>
    </Row>
  )
}
