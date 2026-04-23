import { queryClient } from "@api/index"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import { useStore } from "@tanstack/react-store"
import type { ScoreConvert, Student, StudentSubjectScore } from "@workspace/db/client"
import {
  useCountStudent,
  useFindFirstTrainingCourseRegulation,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindUniqueSubjectClass,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { InfoCircleOutlined } from "@ant-design/icons"
import { Button, Checkbox, Col, Form, Input, message, Popover, Row, Select } from "antd"
import _ from "lodash"
import { Search } from "lucide-react"
import { type Key, useCallback, useEffect, useMemo, useState } from "react"
import { dangKyHocChoLopQuanLyStore } from "../.."
import { isNullish } from "@workspace/libs/utils"

interface FilterProps {
  searchText: string | null
  trainingCourseId?: string
  fixedClassId?: string
}

interface RegisterClassProps {
  hocLai?: boolean
}

type TStudentSubjectScoreLite = Pick<
  StudentSubjectScore,
  | "subjectClassId"
  | "subjectVersionId"
  | "attendanceScore"
  | "midtermScore"
  | "examScore"
  | "finalScore"
  | "manualFinalScore"
>

export default function CaNhanTrongLopQuanLy({ hocLai }: RegisterClassProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(50)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
    trainingCourseId: undefined,
    fixedClassId: undefined,
  })
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { subjectClassId, fixedClassesIds } = useStore(dangKyHocChoLopQuanLyStore)

  const { data: fixedClassData = [] } = useFindManyFixedClass({
    orderBy: {
      code: "asc",
    },
    where: {
      active: true,
      trainingCourseId: filters.trainingCourseId,
      id: {
        in: fixedClassesIds,
      },
    },
  })

  const { data: selectedSubjectClass } = useFindUniqueSubjectClass(
    {
      where: {
        id: subjectClassId as string,
      },
      select: {
        id: true,
        subjectId: true,
        subjectClassStudent: {
          select: {
            studentId: true,
          },
        },
        subject: {
          select: {
            type: true,
            prerequisiteSubject: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            coRequisiteSubject: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    },
    { enabled: !!semesterId && !!subjectClassId }
  )

  const { data: students = [], refetch } = useFindManyStudent(
    {
      where: {
        ...(filters.searchText && filters.searchText !== ""
          ? {
              OR: [
                {
                  userProfile: {
                    fullname: {
                      contains: filters.searchText,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  code: {
                    contains: filters.searchText,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        fixedClass: {
          trainingCourseId: filters.trainingCourseId,
          id: filters.fixedClassId
            ? filters.fixedClassId
            : {
                in: fixedClassesIds,
              },
        },
        active: true,
        status: "ENROLLED",
        deletedAt: null,
      },
      include: {
        userProfile: {
          select: {
            fullname: true,
          },
        },
        studentSemesterResult: {
          select: {
            gpaBase10: true,
            cumulativeGpaBase10: true,
            totalFailedCredits: true,
          },
          orderBy: {
            semester: {
              startDate: "desc",
            },
          },
        },
        subjectClassStudent: {
          select: {
            attendanceScore: true,
            midtermScore: true,
            examScore: true,
            finalScore: true,
            manualFinalScore: true,
            subjectClassId: true,
            subjectVersionId: true,
          },
          orderBy: { createdAt: "desc" },
          take: 2,
          where: {
            OR: [
              { subjectVersionId: selectedSubjectClass?.subjectId },
              {
                subjectVersionId: {
                  in: [
                    ...(selectedSubjectClass?.subject?.prerequisiteSubject?.map((s) => s.id) || []),
                    ...(selectedSubjectClass?.subject?.coRequisiteSubject?.map((s) => s.id) || []),
                  ],
                },
              },
            ],
          },
        },
        fixedClass: {
          select: {
            code: true,
            trainingCourse: {
              select: {
                scoreConverts: true,
                scoreToPass: true,
              },
            },
          },
        },
      },
      orderBy: [{ fixedClass: { code: "asc" } }, { userProfile: { firstName: "asc" } }],
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    {
      enabled: !!selectedSubjectClass,
    }
  )

  const { data: allStudentIds = [] } = useFindManyStudent({
    where: {
      ...(filters.searchText && filters.searchText !== ""
        ? {
            OR: [
              {
                userProfile: {
                  fullname: {
                    contains: filters.searchText,
                    mode: "insensitive",
                  },
                },
              },
              {
                code: {
                  contains: filters.searchText,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      fixedClass: {
        trainingCourseId: filters.trainingCourseId,
        id: filters.fixedClassId
          ? filters.fixedClassId
          : {
              in: fixedClassesIds,
            },
      },
      active: true,
      status: "ENROLLED",
      deletedAt: null,
    },
    select: {
      id: true,
      studentSemesterResult: {
        select: {
          totalFailedCredits: true,
        },
        orderBy: {
          semester: {
            startDate: "desc",
          },
        },
      },
    },
  })

  const { data: tcNoToiThieuLamDoAn } = useFindFirstTrainingCourseRegulation(
    {
      where: {
        code: "TC_NO_TOI_THIEU_LAM_DO_AN",
        trainingCourseId: fixedClassData?.[0]?.trainingCourseId,
      },
    },
    {
      enabled:
        (selectedSubjectClass?.subject?.type === "Project" ||
          selectedSubjectClass?.subject?.type === "Thesis") &&
        !!fixedClassData?.[0]?.trainingCourseId,
    }
  )

  const tcNoToiThieuLamDoAnValue = useMemo(() => {
    if (
      selectedSubjectClass?.subject?.type === "Project" ||
      selectedSubjectClass?.subject?.type === "Thesis"
    ) {
      return tcNoToiThieuLamDoAn?.value
    }
    return Number.POSITIVE_INFINITY
  }, [tcNoToiThieuLamDoAn, selectedSubjectClass])

  const { data: countStudents = 0 } = useCountStudent({
    where: {
      ...(filters.searchText && filters.searchText !== ""
        ? {
            OR: [
              {
                userProfile: {
                  fullname: {
                    contains: filters.searchText,
                    mode: "insensitive",
                  },
                },
              },
              {
                code: {
                  contains: filters.searchText,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      fixedClass: {
        trainingCourseId: filters.trainingCourseId,
        id: filters.fixedClassId
          ? filters.fixedClassId
          : {
              in: fixedClassesIds,
            },
      },
      active: true,
      status: "ENROLLED",
      deletedAt: null,
    },
  })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  useEffect(() => {
    if (students && selectedSubjectClass) {
      const selectedSubjectClassFixedClassIds = selectedSubjectClass?.subjectClassStudent.map(
        (scs) => scs.studentId
      )
      const selectedKeys = students
        .filter((item) => selectedSubjectClassFixedClassIds?.includes(item.id))
        .map((item) => item.id)
      setSelectedRowKeys(selectedKeys)
      if (!dangKyHocChoLopQuanLyStore.state.studentIds.compare(selectedKeys, (a, b) => a === b)) {
        dangKyHocChoLopQuanLyStore.setState((prev) => ({
          ...prev,
          studentIds: selectedKeys as string[],
        }))
      }
    }
  }, [students, selectedSubjectClass])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  const handleRowSelection = (ids: Key[]) => {
    setSelectedRowKeys(ids)
  }

  const prerequisiteSubjects = selectedSubjectClass?.subject?.prerequisiteSubject || []
  const coRequisiteSubjects = selectedSubjectClass?.subject?.coRequisiteSubject || []

  const getScoreValue = (score: TStudentSubjectScoreLite) => {
    if (score.manualFinalScore !== null && score.manualFinalScore !== undefined) {
      return Number(score.manualFinalScore)
    }
    if (score.finalScore) {
      return score.finalScore.toNumber()
    }
    return null
  }

  const getBestPrerequisiteScore = (
    scores: TStudentSubjectScoreLite[],
    prerequisiteSubjectId: string
  ) => {
    const sameSubjectScores = scores.filter((s) => s.subjectVersionId === prerequisiteSubjectId)
    if (sameSubjectScores.length === 0) return null

    return sameSubjectScores.reduce<TStudentSubjectScoreLite | null>((best, current) => {
      if (!best) return current
      const currentScore = getScoreValue(current)
      const bestScore = getScoreValue(best)
      if (currentScore === null) return best
      if (bestScore === null) return current
      return currentScore > bestScore ? current : best
    }, null)
  }

  const isPrerequisiteNotPassed = (record: any) => {
    if (!prerequisiteSubjects.length) return false

    const scores = (record?.subjectClassStudent || []) as TStudentSubjectScoreLite[]
    const scoreToPass = record?.fixedClass?.trainingCourse?.scoreToPass ?? 5

    return prerequisiteSubjects.some((subject) => {
      const bestScoreRecord = getBestPrerequisiteScore(scores, subject.id)
      const bestScore = bestScoreRecord ? getScoreValue(bestScoreRecord) : null
      return bestScore === null || bestScore < scoreToPass
    })
  }

  const renderPrerequisiteInfo = (record: any) => {
    if (!prerequisiteSubjects.length) return null

    const scores = (record?.subjectClassStudent || []) as TStudentSubjectScoreLite[]
    const scoreToPass = record?.fixedClass?.trainingCourse?.scoreToPass ?? 5

    return (
      <div className="space-y-2 max-w-[380px] text-xs">
        {prerequisiteSubjects.map((subject) => {
          const bestScoreRecord = getBestPrerequisiteScore(scores, subject.id)
          const bestScore = bestScoreRecord ? getScoreValue(bestScoreRecord) : null
          const passed = bestScore !== null && bestScore >= scoreToPass

          return (
            <div key={subject.id} className="border border-gray-200 rounded px-2 py-1">
              <div className="font-semibold">
                {subject.code} - {subject.name}
              </div>
              <div>
                CC: {bestScoreRecord?.attendanceScore ?? "-"} | ĐK:{" "}
                {bestScoreRecord?.midtermScore ?? "-"} | Thi: {bestScoreRecord?.examScore ?? "-"} |
                TK: {bestScore ?? "-"}
              </div>
              <div className={passed ? "text-green-600" : "text-red-600"}>
                {passed ? "Đạt tiên quyết" : `Chưa đạt tiên quyết (>= ${scoreToPass})`}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const hasLearnedCoRequisiteSubject = (
    scores: TStudentSubjectScoreLite[],
    coRequisiteSubjectId: string
  ) => {
    return scores.some((s) => s.subjectVersionId === coRequisiteSubjectId)
  }

  const isCoRequisiteNotLearned = (record: any) => {
    if (!coRequisiteSubjects.length) return false

    const scores = (record?.subjectClassStudent || []) as TStudentSubjectScoreLite[]

    return coRequisiteSubjects.some((subject) => !hasLearnedCoRequisiteSubject(scores, subject.id))
  }

  const renderCoRequisiteInfo = (record: any) => {
    if (!coRequisiteSubjects.length) return null

    const scores = (record?.subjectClassStudent || []) as TStudentSubjectScoreLite[]

    return (
      <div className="space-y-2 max-w-[380px] text-xs">
        {coRequisiteSubjects.map((subject) => {
          const learned = hasLearnedCoRequisiteSubject(scores, subject.id)

          return (
            <div key={subject.id} className="border border-gray-200 rounded px-2 py-1">
              <div className="font-semibold">
                {subject.code} - {subject.name}
              </div>
              <div className={learned ? "text-green-600" : "text-red-600"}>
                {learned ? "Đã học môn học trước" : "Chưa học môn học trước"}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const { showSpinner, hideSpinner } = useSpinner()

  const handleSaveDangKyHoc = async () => {
    if (!subjectClassId) {
      message.warning("Chưa chọn lớp môn học")
      return
    }
    try {
      showSpinner()
      const scoreRes = await sqlTransaction([
        {
          model: "StudentSubjectScore",
          operation: "findMany",
          data: {
            where: {
              subjectClassId,
              OR: [
                { attendanceScore: { not: null } },
                { midtermScore: { not: null } },
                { examScore: { not: null } },
              ],
            },
          },
        },
      ])

      const studentSubjectScores = scoreRes.data[0] as StudentSubjectScore[]
      const studentIds = studentSubjectScores.map((s) => s.studentId)

      for (const studentId of studentIds) {
        if (!selectedRowKeys.includes(studentId)) {
          message.error("Không thể huỷ đăng ký SV đã có điểm, vui lòng thử lại")
          return
        }
      }

      const res = await sqlTransaction([
        {
          model: "StudentSubjectScore",
          operation: "deleteMany",
          data: {
            where: {
              id: { notIn: studentSubjectScores.map((s) => s.id) },
              subjectClassId,
              attendanceScore: null,
              midtermScore: null,
              examScore: null,
            },
          },
        },
        {
          model: "StudentSubjectScore",
          operation: "createMany",
          data: {
            data: selectedRowKeys.map((studentId) => ({
              subjectClassId: selectedSubjectClass?.id,
              studentId,
              subjectVersionId: selectedSubjectClass?.subjectId,
            })),
            skipDuplicates: true,
          },
        },
      ])
      if (res.status !== 200) throw new Error("Transaction failed")
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "SubjectClass"],
      })
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "FixedClass"],
      })
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "Student"],
      })
      message.success("Lưu danh sách đăng ký học thành công")
    } catch (error) {
      console.error(error)
      message.error("Lưu danh sách đăng ký học thất bại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Row gutter={[4, 0]}>
      <Col span={24}>
        <h3 className="text-lg">Danh sách học viên</h3>
      </Col>

      <Col span={8}>
        <Form.Item className="mb-1" name="searchText">
          <Input
            id="search"
            placeholder="Tìm kiếm HV/SV..."
            onChange={(e) => handleFilterChange("searchText", e.target.value)}
            style={{ height: 32 }}
            prefix={
              <Search
                size={15}
                style={{
                  color: "rgba(0, 0, 0, 0.25)",
                }}
              />
            }
            allowClear
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Select
          placeholder="Chọn lớp"
          className="w-full"
          dropdownStyle={{
            width: "400px",
          }}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          options={fixedClassData.map((i) => ({
            value: i.id,
            label: `${i.code} - ${i.name}`,
          }))}
          onChange={(value) => handleFilterChange("fixedClassId", value)}
        />
      </Col>
      <Col span={8} className="text-right">
        <Button
          type="primary"
          onClick={handleSaveDangKyHoc}
          disabled={!subjectClassId || fixedClassesIds.length === 0}
        >
          Lưu danh sách ĐKH
        </Button>
      </Col>
      <Col span={24}>
        <Table
          rowKey="id"
          scrollable
          // maxHeight={"calc(100vh - 380px)"}
          data={students}
          onRow={(record) => ({
            onClick: () => {
              const blockedByDebtCredits =
                !!tcNoToiThieuLamDoAnValue &&
                record?.studentSemesterResult?.[0]?.totalFailedCredits >= tcNoToiThieuLamDoAnValue
              const blockedByPrerequisite = isPrerequisiteNotPassed(record)
              const blockedByCoRequisite = isCoRequisiteNotLearned(record)

              if (blockedByDebtCredits || blockedByPrerequisite || blockedByCoRequisite) {
                return
              }
              if (!selectedRowKeys.includes(record.id)) {
                handleRowSelection([...selectedRowKeys, record.id])
              } else {
                handleRowSelection(selectedRowKeys.filter((key) => key !== record.id))
              }
            },
            style: { cursor: "pointer" },
            columnWidth: 35,
          })}
          rowSelection={{
            selectedRowKeys: selectedRowKeys,
            onChange: (selectedKeys, _, { type }) => {
              if (type === "all") {
                if (selectedRowKeys.length > 0) {
                  handleRowSelection([])
                } else {
                  handleRowSelection(allStudentIds.map((i) => i.id))
                }
              } else handleRowSelection(selectedKeys)
            },
            type: "checkbox",
            fixed: "left",
            getCheckboxProps: (record) => ({
              disabled:
                (!!tcNoToiThieuLamDoAnValue &&
                  record?.studentSemesterResult?.[0]?.totalFailedCredits >=
                    tcNoToiThieuLamDoAnValue) ||
                isPrerequisiteNotPassed(record) ||
                isCoRequisiteNotLearned(record),
            }),
            columnWidth: 35,
          }}
          columns={[
            {
              title: "TT",
              width: 35,
              fixed: "left",
              align: "center",
              render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
            },
            {
              title: "Mã",
              dataIndex: "code",
              // fixed: "left",
              align: "center",
              width: 100,
            },
            {
              title: "Tên",
              align: "center",
              fixed: "left",
              width: 200,
              render: (_, record) => <p className="text-left">{record?.userProfile?.fullname}</p>,
            },
            {
              title: "Lớp",
              align: "center",
              width: 80,
              render: (_, record) => <p>{record?.fixedClass?.code}</p>,
            },
            {
              title: "GPA",
              align: "center",
              width: 50,
              render: (_, record) =>
                record?.studentSemesterResult.length > 0 ? (
                  <span>
                    {Number(record.studentSemesterResult[0]?.cumulativeGpaBase10).toFixed(2)}
                  </span>
                ) : (
                  <span>-</span>
                ),
            },
            {
              title: "TC nợ",
              align: "center",
              width: 60,
              render: (_, record) =>
                record?.studentSemesterResult.length > 0 ? (
                  <span>{record.studentSemesterResult[0]?.totalFailedCredits}</span>
                ) : (
                  <span>-</span>
                ),
            },
            {
              title: "Có điểm",
              align: "center",
              width: 50,
              render: (_, record) => {
                const scores =
                  (record?.subjectClassStudent as Pick<
                    StudentSubjectScore,
                    | "subjectClassId"
                    | "subjectVersionId"
                    | "attendanceScore"
                    | "midtermScore"
                    | "finalScore"
                  >[]) || []
                const currentScore = scores.find(
                  (s) =>
                    s.subjectClassId === subjectClassId &&
                    s.subjectVersionId === selectedSubjectClass?.subjectId
                )
                return isNullish(currentScore?.attendanceScore) &&
                  isNullish(currentScore?.midtermScore) &&
                  isNullish(currentScore?.finalScore) ? (
                  <span>-</span>
                ) : (
                  <span>✅</span>
                )
              },
            },
            {
              title: "Điểm trước",
              align: "center",
              width: 50,
              render: (_, record) => {
                const scores =
                  (record?.subjectClassStudent as Pick<
                    StudentSubjectScore,
                    | "subjectClassId"
                    | "subjectVersionId"
                    | "attendanceScore"
                    | "midtermScore"
                    | "finalScore"
                    | "manualFinalScore"
                  >[]) || []
                const preScoreRecord = scores.find(
                  (s) =>
                    s.subjectVersionId === selectedSubjectClass?.subjectId &&
                    s.subjectClassId !== subjectClassId
                )
                const preScore = preScoreRecord
                  ? (preScoreRecord.manualFinalScore ?? preScoreRecord.finalScore?.toNumber())
                  : undefined
                return preScore ?? "-"
              },
            },
            {
              title: "Cải thiện",
              align: "center",
              width: 50,
              render: (_, record) => {
                const scores =
                  (record?.subjectClassStudent as Pick<
                    StudentSubjectScore,
                    | "subjectClassId"
                    | "subjectVersionId"
                    | "attendanceScore"
                    | "midtermScore"
                    | "finalScore"
                    | "manualFinalScore"
                  >[]) || []
                const preScoreRecord = scores.find(
                  (s) =>
                    s.subjectVersionId === selectedSubjectClass?.subjectId &&
                    s.subjectClassId !== subjectClassId
                )
                const preScore = preScoreRecord
                  ? (preScoreRecord.manualFinalScore ?? preScoreRecord.finalScore?.toNumber())
                  : undefined
                return (
                  <Checkbox
                    checked={
                      preScore !== null && preScore !== undefined
                        ? record?.fixedClass?.trainingCourse?.scoreConverts?.some(
                            (sc: ScoreConvert) =>
                              sc?.base10Min <= preScore &&
                              preScore <= sc?.base10Max &&
                              sc?.improvementRegister
                          )
                        : false
                    }
                  />
                )
              },
            },
            {
              title: "Tiên quyết",
              align: "center",
              width: 50,
              fixed: "right",
              render: (_, record) => {
                if (!prerequisiteSubjects.length) return null
                const blocked = isPrerequisiteNotPassed(record)

                return (
                  // <div title="Thông tin môn tiên quyết">
                  <Popover
                    content={renderPrerequisiteInfo(record)}
                    trigger="hover"
                    placement="left"
                  >
                    <InfoCircleOutlined
                      className={blocked ? "text-red-500" : "text-blue-500"}
                      style={{ fontSize: 16 }}
                    />
                  </Popover>
                  // </div>
                )
              },
            },
            {
              title: "Học trước",
              align: "center",
              width: 50,
              fixed: "right",
              render: (_, record) => {
                if (!coRequisiteSubjects.length) return null
                const blocked = isCoRequisiteNotLearned(record)

                return (
                  <Popover content={renderCoRequisiteInfo(record)} trigger="hover" placement="left">
                    <InfoCircleOutlined
                      className={blocked ? "text-red-500" : "text-blue-500"}
                      style={{ fontSize: 16 }}
                    />
                  </Popover>
                )
              },
            },
          ]}
          pagination={{
            current: currentPage,
            pageSize: numberOfPages,
            total: countStudents,
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
