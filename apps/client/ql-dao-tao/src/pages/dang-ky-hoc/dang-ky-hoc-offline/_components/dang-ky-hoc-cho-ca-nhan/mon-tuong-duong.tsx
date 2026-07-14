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
import { sqlTransaction } from "@workspace/libs/api/model"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"
import { Button, Checkbox, Col, Form, Input, message, Row } from "antd"
import _ from "lodash"
import { Search } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { dangKyHocChoCaNhanStore } from "../.."

interface FilterProps {
  searchText: string | null
}

export default function MonTuongDuong() {
  const { can } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(20)
  const [selectedSubjectClassRowKeys, setSelectedSubjectClassRowKeys] = useState<React.Key[]>([])
  const [subjectVersionIds, setSubjectVersionIds] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
  })
  const { studentId } = useStore(dangKyHocChoCaNhanStore)

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
                subjects: {
                  select: {
                    subject: {
                      include: {
                        equivalencyGroups: true,
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
    {
      enabled: !!studentId,
    }
  )
  const studentSubjects = student?.curriculumVersion?.trainingBlocks.flatMap((tb) =>
    tb.subjects.flatMap((s) => s.subject.equivalencyGroups)
  )

  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

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
        type: $Enums.SubjectClassType.NORMAL,
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
        type: $Enums.SubjectClassType.NORMAL,
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

  const handleSaveStudentClass = async () => {
    if (!studentId) return
    try {
      const allSubjectClassInfo = await sqlTransaction(
        selectedSubjectClassRowKeys.map((subjectClassId) => ({
          model: "SubjectClass",
          operation: "findUnique",
          data: {
            where: { id: subjectClassId },
            select: {
              id: true,
              subjectId: true,
              subject: {
                select: {
                  // Lấy điểm cao nhất của sinh viên trong các lần đăng ký học cải thiện
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
      const res = await sqlTransaction([
        {
          model: "StudentSubjectScore",
          operation: "deleteMany",
          data: {
            where: {
              studentId,
              subjectClass: {
                semesterId,
                trainingObjectTypeId,
              },
            },
          },
        },
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
                        sc?.base10Min <= subjectClass.subject.studentSubjectScore[0]?.finalScore &&
                        subjectClass.subject.studentSubjectScore[0]?.finalScore <= sc?.base10Max &&
                        sc?.improvementRegister
                    )
                  : false,
            },
          },
        })),
      ])
      if (res.status !== 200) {
        throw new Error("Có lỗi xảy ra khi lưu đăng ký học!")
      }
      message.success("Lưu đăng ký học cải thiện thành công!")
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
    if (subjectClassData && studentId) {
      setSubjectVersionIds(subjectClassData
          .filter((item) => item.subjectClassStudent.length > 0)
          .map((item) => item.subject.id))
      setSelectedSubjectClassRowKeys(
        subjectClassData
          .filter((item) => item.subjectClassStudent.length > 0)
          .map((item) => item.id)
      )
    }
  }, [subjectClassData, studentId])

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
            disabled={!studentId || !semesterId}
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
                  setSelectedSubjectClassRowKeys((prev) => prev.filter((key) => key !== record.id))
                  setSubjectVersionIds((prev) => prev.filter((id) => id !== record.subject.id))
                  return
                }
                setSelectedSubjectClassRowKeys((prev) => [...prev, record.id])
                setSubjectVersionIds((prev) => [...prev, record.subject.id])
              },
              className: cn(notAllowSelect && "bg-yellow-100 cursor-not-allowed"),
              columnWidth: 35,
            }
          }}
          rowSelection={{
            selectedRowKeys: selectedSubjectClassRowKeys,
            onChange: (selectedRowKeys) => {
              setSelectedSubjectClassRowKeys(selectedRowKeys)
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
