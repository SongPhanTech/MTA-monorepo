import { queryClient } from "@api/index"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { useStore } from "@tanstack/react-store"
import { $Enums, type ScoreConvert } from "@workspace/db/client"
import {
  useCountSubjectClass,
  useFindManySubjectClass,
  useFindUniqueStudent,
} from "@workspace/db/hooks"
import { diffArrays } from "@workspace/libs"
import { sqlTransaction } from "@workspace/libs/api/model"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"
import { Button, Checkbox, Col, Form, Input, message, Row } from "antd"
import _ from "lodash"
import { Search } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { dangKyHocChoCaNhanStore } from "../.."

interface FilterProps {
  searchText: string | null
}

function mergePageSelection(
  previousIds: React.Key[],
  pageIds: React.Key[],
  selectedOnPage: React.Key[]
) {
  const pageIdSet = new Set(pageIds.map(String))
  const preserved = previousIds.filter((id) => !pageIdSet.has(String(id)))
  return [...new Set([...preserved, ...selectedOnPage].map(String))]
}

export default function MonHocLai() {
  const { can } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(20)
  const [selectedSubjectClassRowKeys, setSelectedSubjectClassRowKeys] = useState<React.Key[]>([])
  const [subjectVersionIds, setSubjectVersionIds] = useState<string[]>([])
  const [selectionReady, setSelectionReady] = useState(false)
  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
  })
  const { studentId } = useStore(dangKyHocChoCaNhanStore)
  const prevStudentIdRef = useRef<string | undefined>()
  const subjectIdByClassIdRef = useRef<Record<string, string>>({})

  const { data: student } = useFindUniqueStudent(
    {
      where: {
        id: studentId as string,
      },
      include: {
        curriculumVersion: {
          select: {
            trainingBlocks: {
              select: {
                subjects: true,
              },
            },
          },
        },
      },
    },
    {
      enabled: !!studentId,
    }
  )
  const studentSubjects = student?.curriculumVersion?.trainingBlocks.flatMap((tb) => tb.subjects)

  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { data: enrolledRetakeClasses, isLoading: enrolledLoading } = useFindManySubjectClass(
    {
      where: {
        semesterId,
        trainingObjectTypeId,
        cancelled: false,
        active: true,
        type: $Enums.SubjectClassType.RETAKE,
        status: "OFFICIAL",
        subjectClassStudent: {
          some: {
            studentId: studentId as string,
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        subjectId: true,
      },
    },
    {
      enabled: !!studentId && !!semesterId,
    }
  )

  const { data: subjectClassData = [], refetch } = useFindManySubjectClass(
    {
      where: {
        ...(filters.searchText
          ? {
              name: {
                contains: filters.searchText,
                mode: "insensitive",
              },
            }
          : {}),
        semesterId,
        trainingObjectTypeId,
        cancelled: false,
        active: true,
        type: $Enums.SubjectClassType.RETAKE,
        subjectId: {
          in: studentSubjects?.map((ss) => ss.subjectId),
        },
        status: "OFFICIAL",
      },
      include: {
        subject: {
          include: {
            // Lấy điểm cao nhất của sinh viên trong các lần đăng ký học cải thiện
            studentSubjectScore: {
              where: {
                studentId: studentId as string,
              },
              orderBy: {
                finalScore: "desc",
              },
              select: {
                finalScore: true,
                student: {
                  select: {
                    fixedClass: {
                      select: {
                        trainingCourse: {
                          select: {
                            scoreConverts: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        subjectClassStudent: {
          where: {
            studentId: studentId as string,
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            subjectClassStudent: {
              where: {
                student: {
                  status: "ENROLLED",
                  active: true,
                  deletedAt: null,
                },
              },
            },
          },
        },
      },
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
      orderBy: {
        code: "asc",
      },
    },
    {
      enabled: !!studentSubjects && !!semesterId,
    }
  )
  const { data: countSubjectClass = 0 } = useCountSubjectClass(
    {
      where: {
        ...(filters.searchText && filters.searchText !== ""
          ? {
              name: {
                contains: filters.searchText,
                mode: "insensitive",
              },
            }
          : {}),
        semesterId,
        trainingObjectTypeId,
        cancelled: false,
        active: true,
        subjectId: {
          in: studentSubjects?.map((ss) => ss.subjectId),
        },
        status: "OFFICIAL",
        type: $Enums.SubjectClassType.RETAKE,
      },
    },
    {
      enabled: !!studentSubjects && !!semesterId,
    }
  )

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  if (enrolledRetakeClasses) {
    for (const item of enrolledRetakeClasses) {
      subjectIdByClassIdRef.current[item.id] = item.subjectId
    }
  }
  for (const item of subjectClassData) {
    subjectIdByClassIdRef.current[item.id] = item.subject.id
  }

  const applySubjectClassSelection = (nextKeys: React.Key[]) => {
    setSelectedSubjectClassRowKeys(nextKeys)
    setSubjectVersionIds(
      nextKeys
        .map((key) => subjectIdByClassIdRef.current[String(key)])
        .filter((id): id is string => Boolean(id))
    )
  }

  const handleSaveStudentClass = async () => {
    if (!studentId || !selectionReady) return
    try {
      const enrolledIds = (enrolledRetakeClasses ?? []).map((item) => ({ id: item.id }))
      const selectedIds = selectedSubjectClassRowKeys.map((id) => ({ id: String(id) }))
      const { onlyInA, onlyInB } = diffArrays(enrolledIds, selectedIds, "id")
      const idsToDelete = onlyInA.map((item: { id: string }) => item.id)
      const idsToCreate = onlyInB.map((item: { id: string }) => item.id)

      const operations: any[] = []
      if (idsToDelete.length > 0) {
        operations.push({
          model: "StudentSubjectScore",
          operation: "deleteMany",
          data: {
            where: {
              studentId,
              subjectClassId: { in: idsToDelete },
            },
          },
        })
      }

      if (idsToCreate.length > 0) {
        const allSubjectClassInfo = await sqlTransaction(
          idsToCreate.map((subjectClassId) => ({
            model: "SubjectClass",
            operation: "findUnique",
            data: {
              where: { id: subjectClassId },
              select: {
                id: true,
                subjectId: true,
                subject: {
                  select: {
                    studentSubjectScore: {
                      where: {
                        studentId,
                      },
                      orderBy: {
                        finalScore: "desc",
                      },
                      select: {
                        finalScore: true,
                        student: {
                          select: {
                            fixedClass: {
                              select: {
                                trainingCourse: {
                                  select: {
                                    scoreConverts: true,
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }))
        )
        if (allSubjectClassInfo.status !== 200) {
          throw new Error("Có lỗi xảy ra khi lấy thông tin lớp học phần!")
        }
        operations.push(
          ...allSubjectClassInfo.data.map((subjectClass: any) => ({
            model: "StudentSubjectScore" as const,
            operation: "create",
            data: {
              data: {
                studentId,
                subjectClassId: subjectClass.id,
                subjectVersionId: subjectClass.subjectId,
                isImproving:
                  subjectClass.subject.studentSubjectScore.length > 0 &&
                  subjectClass.subject.studentSubjectScore[0]?.finalScore !== null
                    ? subjectClass.subject.studentSubjectScore[0].student?.fixedClass?.trainingCourse?.scoreConverts?.some(
                        (sc: ScoreConvert) =>
                          sc?.base10Min <=
                            subjectClass.subject.studentSubjectScore[0]?.finalScore &&
                          subjectClass.subject.studentSubjectScore[0]?.finalScore <=
                            sc?.base10Max &&
                          sc?.improvementRegister
                      )
                    : false,
              },
            },
          }))
        )
      }

      if (operations.length > 0) {
        const res = await sqlTransaction(operations)
        if (res.status !== 200) {
          throw new Error("Có lỗi xảy ra khi lưu đăng ký học!")
        }
      }
      message.success("Lưu đăng ký học lại thành công!")
      queryClient.invalidateQueries({ queryKey: ["zenstack", "StudentSubjectScore"] })
      queryClient.invalidateQueries({ queryKey: ["zenstack", "SubjectClass"] })
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Có lỗi xảy ra khi gán lớp!")
    }
  }

  useEffect(() => {
    if (!studentId) {
      prevStudentIdRef.current = undefined
      setSelectedSubjectClassRowKeys([])
      setSubjectVersionIds([])
      setSelectionReady(false)
      return
    }
    const studentChanged = prevStudentIdRef.current !== studentId
    if (studentChanged) {
      prevStudentIdRef.current = studentId
      setSelectionReady(false)
      setCurrentPage(1)
    }
    if (enrolledLoading || enrolledRetakeClasses === undefined) return
    if (studentChanged || !selectionReady) {
      applySubjectClassSelection(enrolledRetakeClasses.map((item) => item.id))
      setSelectionReady(true)
    }
  }, [studentId, enrolledRetakeClasses, enrolledLoading, selectionReady])

  return (
    <Row>
      <Col span={20}>
        <Form.Item className="mb-1" name="searchText">
          <Input
            id="search"
            placeholder="Tìm kiếm LMH..."
            onChange={(e) => handleFilterChange("searchText", e.target.value)}
            prefix={
              <Search
                size={15}
                style={{
                  color: "rgba(0, 0, 0, 0.25)",
                }}
              />
            }
            className="h-8"
            allowClear
          />
        </Form.Item>
      </Col>
      <Col span={4} className="text-right">
        {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANG_KY_HOC_DANG_KY_HOC_OFFLINE, "SUA") && (
          <Button
            type="primary"
            className="h-[32px] px-4"
            onClick={handleSaveStudentClass}
            disabled={!studentId || !semesterId || !selectionReady}
          >
            Lưu
          </Button>
        )}
      </Col>
      <Col span={24}>
        <Table
          className="m-0"
          rowKey="id"
          data={subjectClassData}
          onRow={(record) => {
            const notAllowSelect =
              subjectVersionIds.includes(record.subject.id) &&
              !selectedSubjectClassRowKeys.includes(record.id)

            return {
              onClick: () => {
                if (notAllowSelect) return
                if (selectedSubjectClassRowKeys.includes(record.id)) {
                  applySubjectClassSelection(
                    selectedSubjectClassRowKeys.filter((key) => key !== record.id)
                  )
                  return
                }
                applySubjectClassSelection([...selectedSubjectClassRowKeys, record.id])
              },
              className: cn(notAllowSelect && "bg-yellow-100 cursor-not-allowed"),
              columnWidth: 35,
            }
          }}
          rowSelection={{
            selectedRowKeys: selectedSubjectClassRowKeys,
            preserveSelectedRowKeys: true,
            onChange: (selectedRowKeys) => {
              applySubjectClassSelection(
                mergePageSelection(
                  selectedSubjectClassRowKeys,
                  subjectClassData.map((row) => row.id),
                  selectedRowKeys
                )
              )
            },
            getCheckboxProps: (record) => ({
              disabled:
                subjectVersionIds.includes(record.subject.id) &&
                !selectedSubjectClassRowKeys.includes(record.id),
            }),
            columnWidth: 35,
          }}
          columns={[
            {
              title: "TT",
              width: 35,
              align: "center",
              render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
            },
            {
              title: "Mã LMH",
              dataIndex: "code",
              align: "center",
              width: 100,
            },
            {
              title: "Tên môn",
              dataIndex: "name",
              align: "center",
              width: 150,
              render: (text) => <p className="text-left">{text}</p>,
            },
            {
              title: "Số TC",
              dataIndex: ["subject", "credit"],
              align: "center",
              width: 80,
            },
            {
              title: "Sĩ số",
              align: "center",
              width: 100,
              render: (record) => record?._count?.subjectClassStudent ?? 0,
            },
            {
              title: "Điểm",
              align: "center",
              width: 50,
              render: (_, record) =>
                record.subject.studentSubjectScore[0]?.finalScore?.toNumber() ?? "-",
            },
            {
              title: "Cải thiện",
              align: "center",
              width: 50,
              render: (_, record) => (
                <Checkbox
                  checked={
                    record.subject.studentSubjectScore.length > 0 &&
                    record.subject.studentSubjectScore[0]?.finalScore !== null
                      ? record.subject.studentSubjectScore[0].student?.fixedClass?.trainingCourse?.scoreConverts?.some(
                          (sc: ScoreConvert) =>
                            sc?.base10Min <=
                              record.subject.studentSubjectScore[0]?.finalScore?.toNumber() &&
                            record.subject.studentSubjectScore[0]?.finalScore?.toNumber() <=
                              sc?.base10Max &&
                            sc?.improvementRegister
                        )
                      : false
                  }
                />
              ),
            },
          ]}
          pagination={{
            current: currentPage,
            pageSize: numberOfPages,
            total: countSubjectClass,
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
  )
}
