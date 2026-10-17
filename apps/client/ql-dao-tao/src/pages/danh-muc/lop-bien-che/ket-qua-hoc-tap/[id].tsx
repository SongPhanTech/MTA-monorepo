import { DownloadOutlined, SafetyCertificateOutlined } from "@ant-design/icons"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import TableCollapse from "@components/commons/tableCollapse"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import {
  baoLuuRowProps,
  isBaoLuuScoreDescription,
  visibleScoreNote,
} from "@workspace/libs/bao-luu-diem"
import { convertScoreWithCourseConfig } from "@workspace/libs/utils"
import {
  $Enums,
  type ArchivedCertificate,
  type Prisma,
  type StudentSubjectScore,
} from "@workspace/db/client"
import {
  useFindManySemester,
  useFindManyStudentSubjectScore,
  useFindManySubjectVersion,
  useFindManyTrainingBlockSubject,
  useFindUniqueStudent,
} from "@workspace/db/hooks"
import { customTrainingFetch } from "@workspace/libs/api/custom-instance"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { Button, Col, Divider, Dropdown, Flex, message, Row, Tag, Tooltip } from "antd"
import { saveAs } from "file-saver"
import _ from "lodash"
import { Check, X } from "lucide-react"
import { useRouter } from "next/router"
import { useCallback, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export interface IMonHoc {
  TenMonhoc: string
  MaMH?: string
  soTC?: number
  diem01?: number
  diem02?: number
  diem07?: number
  diemhe10?: number | null
  diemhe4?: number | null
  diemchu?: string | null
  pass?: boolean | null
  ghichu?: string
}

export interface IHocKi {
  TenHocKi?: string
  SoTinChiKy?: number
  DiemTBKyHe10?: number
  DiemTBKyHe4?: number
  monHocs?: IMonHoc[]
}

function formatGpa(value: unknown) {
  if (value == null || value === "") return "—"
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(2) : "—"
}

export default function StudentScoreClassPage() {
  const router = useRouter()
  const { can } = useAbility()
  const { showSpinner, hideSpinner } = useSpinner()
  const [expandAll, setExpandAll] = useState(true)
  const studentId = router.query.id as string
  const [semesterId, setSemesterId] = useState<string>()
  const [subjectClassTypeFilter, setSubjectClassTypeFilter] = useState<
    $Enums.SubjectClassType | undefined
  >()
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
  })

  const { onOpen: onOpenModalAddCertificate } = useDisclosure<{
    id: string
    list: string[]
    studentId: string
    subjectClassStudent: StudentSubjectScore
  }>({
    tag: "PutAddCertificateScoreModal",
  })

  const { onOpen: onOpenModalNhapDiem } = useDisclosure<string>({
    tag: "NhapDiemThuCong",
    onClose: () => {
      refetch()
    },
  })

  const { data: student } = useFindUniqueStudent(
    {
      where: { id: studentId },
      include: {
        userProfile: true,
        curriculumVersion: {
          include: {
            trainingLevel: true,
            trainingLanguage: true,
            trainingTime: true,
            trainingType: true,
            curriculum: {
              include: {
                trainingField: true,
                trainingMajor: {
                  include: {
                    trainingField: true,
                  },
                },
              },
            },
          },
        },
        fixedClass: {
          include: {
            trainingCourse: {
              include: {
                trainingObjectType: true,
                scoreConverts: true,
              },
            },
            curriculumVersion: {
              include: {
                trainingLevel: true,
                trainingLanguage: true,
                trainingTime: true,
                trainingType: true,
                curriculum: {
                  include: {
                    trainingField: true,
                    trainingMajor: {
                      include: {
                        trainingField: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        studentSemesterResult: {
          include: {
            rank: true,
            semester: { include: { schoolYear: true } },
          },
        },
        studentYearResult: {
          where: { deletedAt: null, active: true },
          include: {
            rank: true,
            schoolYear: { select: { id: true, name: true, startDate: true } },
          },
          orderBy: [{ schoolYear: { startDate: "desc" } }],
        },
      },
    },
    { enabled: !!studentId }
  )

  const scoreToPassGraduation = student?.fixedClass?.trainingCourse?.scoreToPassGraduation ?? 5.5
  const scoreToPassConditional = student?.fixedClass?.trainingCourse?.scoreToPassConditional ?? 5
  const scoreToPass = student?.fixedClass?.trainingCourse?.scoreToPass ?? 4
  const scoreToTakeExam = student?.fixedClass?.trainingCourse?.scoreToTakeExam ?? null
  const examScoreToPass = student?.fixedClass?.trainingCourse?.examScoreToPass ?? null

  const convertScoreWithGraduation = useCallback(
    (
      score: number | null | undefined,
      isGraduation: boolean,
      isConditional: boolean,
      attendanceScore?: number | null,
      midtermScore?: number | null,
      examScore?: number | null
    ) => {
      if (score == null) return null

      return convertScoreWithCourseConfig(
        score,
        student?.fixedClass?.trainingCourse?.scoreConverts ?? [],
        {
          attendanceScore,
          midtermScore,
          examScore,
          isGraduation,
          isConditional,
          scoreToTakeExam,
          examScoreToPass,
          scoreToPass,
          scoreToPassGraduation,
          scoreToPassConditional,
        }
      )
    },
    [
      student?.fixedClass?.trainingCourse?.scoreConverts,
      scoreToPassGraduation,
      scoreToPassConditional,
      scoreToPass,
      scoreToTakeExam,
      examScoreToPass,
    ]
  )

  const curriculumVersionId =
    student?.curriculumVersionId || student?.fixedClass?.curriculumVersionId

  const { data: plannedSubjects = [] } = useFindManyTrainingBlockSubject(
    {
      where: {
        trainingBlockOnCurriculumVersion: { curriculumVersionId: curriculumVersionId || "" },
        deletedAt: null,
        active: true,
      },
      select: { subjectId: true, semester: true },
    },
    { enabled: !!curriculumVersionId }
  )

  const { data: manualScoreData = [] } = useFindManyStudentSubjectScore(
    {
      where: {
        studentId: studentId,
        manualFinalScore: { gt: 0 },
        deletedAt: null,
      },
      include: { subjectVersion: true },
    },
    { enabled: !!studentId }
  )

  const { data: trainingSubjectVersions = [] } = useFindManySubjectVersion(
    {
      where: {
        studentSubjectScore: {
          some: {
            studentId: studentId,
            deletedAt: null,
            subjectClass: { cancelled: false },
          },
        },
      },
    },
    { enabled: !!studentId }
  )

  const subjectVersionWhere: Prisma.SubjectVersionWhereInput = useMemo(() => {
    return {
      ...(filters.code ? { code: { contains: filters.code, mode: "insensitive" } } : {}),
      ...(filters.name ? { name: { contains: filters.name, mode: "insensitive" } } : {}),
      ...(filters.creditCmp
        ? {
            credit: {
              ...(filters.creditCmp.gte ? { gte: Number(filters.creditCmp.gte) } : {}),
              ...(filters.creditCmp.lte ? { lte: Number(filters.creditCmp.lte) } : {}),
            },
          }
        : {}),
    }
  }, [filters.name, filters.creditCmp, filters.code])

  const subjectScoreWhere: Prisma.StudentSubjectScoreWhereInput = useMemo(() => {
    return {
      studentId,
      deletedAt: null,
      ...(filters.attendanceScoreCmp
        ? {
            attendanceScore: {
              ...(filters.attendanceScoreCmp.gte
                ? { gte: Number(filters.attendanceScoreCmp.gte) }
                : {}),
              ...(filters.attendanceScoreCmp.lte
                ? { lte: Number(filters.attendanceScoreCmp.lte) }
                : {}),
            },
          }
        : {}),
      ...(filters.midtermScoreCmp
        ? {
            midtermScore: {
              ...(filters.midtermScoreCmp.gte ? { gte: Number(filters.midtermScoreCmp.gte) } : {}),
              ...(filters.midtermScoreCmp.lte ? { lte: Number(filters.midtermScoreCmp.lte) } : {}),
            },
          }
        : {}),
      ...(filters.examScoreCmp
        ? {
            examScore: {
              ...(filters.examScoreCmp.gte ? { gte: Number(filters.examScoreCmp.gte) } : {}),
              ...(filters.examScoreCmp.lte ? { lte: Number(filters.examScoreCmp.lte) } : {}),
            },
          }
        : {}),
      ...(filters.finalScoreCmp
        ? {
            finalScore: {
              ...(filters.finalScoreCmp.gte ? { gte: Number(filters.finalScoreCmp.gte) } : {}),
              ...(filters.finalScoreCmp.lte ? { lte: Number(filters.finalScoreCmp.lte) } : {}),
            },
          }
        : {}),
      subjectVersion: subjectVersionWhere,
    }
  }, [filters, studentId, subjectVersionWhere])

  const { data = [], refetch } = useFindManySemester({
    where: {
      subjectClasses: {
        some: {
          subject: subjectVersionWhere,
          ...(subjectClassTypeFilter ? { type: subjectClassTypeFilter } : {}),
          subjectClassStudent: { some: subjectScoreWhere },
        },
      },
    },
    include: {
      subjectClasses: {
        where: {
          ...(subjectClassTypeFilter ? { type: subjectClassTypeFilter } : {}),
          subjectClassStudent: { some: subjectScoreWhere },
        },
        include: {
          subject: {
            include: {
              trainingBlocks: {
                select: {
                  graduation: true,
                  useForFinalScore: true,
                  trainingBlockOnCurriculumVersion: {
                    select: {
                      priority: true,
                      trainingBlock: {
                        select: {
                          id: true,
                          name: true,
                          priority: true,
                        },
                      },
                    },
                  },
                },
                take: 1,
              },
              prerequisiteSubject: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
              dependentSubject: {
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
              depCoRequisiteSubject: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
              equivalencyGroups: {
                select: {
                  equivalencyGroupId: true,
                },
              },
            },
          },
          subjectClassStudent: {
            where: subjectScoreWhere,
            include: {
              certificates: { include: { archivedCertificate: true } },
              awards: { include: { archivedAward: true } },
            },
          },
        },
        orderBy: [{ subject: { name: "asc" } }, { createdAt: "asc" }],
      },
      studentSemesterResult: {
        where: { studentId },
        include: { rank: true },
      },
      trainingCoursesStart: {
        where: { id: student?.fixedClass?.trainingCourseId ?? undefined },
        include: { scoreConverts: true },
      },
      schoolYear: true,
    },
    orderBy: { startDate: "asc" },
  })

  const latestYearResult = student?.studentYearResult?.[0]

  const semesterResultById = useMemo(() => {
    const map = new Map<string, (typeof data)[number]["studentSemesterResult"][number]>()
    for (const result of student?.studentSemesterResult ?? []) {
      map.set(result.semesterId, result)
    }
    for (const semester of data) {
      const nested = semester.studentSemesterResult?.[0]
      if (nested && !map.has(semester.id)) map.set(semester.id, nested)
    }
    return map
  }, [data, student?.studentSemesterResult])

  const dataWithSummary = useMemo(() => {
    const plannedBySubject = new Map<string, number | null>()
    for (const block of plannedSubjects) {
      if (!plannedBySubject.has(block.subjectId) || plannedBySubject.get(block.subjectId) == null) {
        plannedBySubject.set(block.subjectId, block.semester ?? null)
      }
    }
    const semesterByIndex = new Map(
      (student?.studentSemesterResult ?? []).map((item) => [item.semesterIndexInCourse, item])
    )
    const baoLuuBySemester = new Map<string, any[]>()
    const extraSemesters: any[] = []

    if (!subjectClassTypeFilter) {
      for (const score of manualScoreData) {
        if (score.subjectClassId || !isBaoLuuScoreDescription(score.description)) continue
        const planned = plannedBySubject.get(score.subjectVersionId)
        const mapped = planned != null ? semesterByIndex.get(planned) : undefined
        const row = {
          id: `bao-luu-${score.id}`,
          key: `bao-luu-${score.id}`,
          baoLuu: true,
          subject: score.subjectVersion,
          subjectClassStudent: [
            {
              id: score.id,
              manualFinalScore: score.manualFinalScore,
              finalScore: score.finalScore,
              attendanceScore: null,
              midtermScore: null,
              examScore: null,
              awards: [],
              certificates: [],
              description: score.description,
              subjectVersion: score.subjectVersion,
            },
          ],
        }
        if (mapped?.semester?.id) {
          const list = baoLuuBySemester.get(mapped.semester.id) ?? []
          list.push(row)
          baoLuuBySemester.set(mapped.semester.id, list)
          if (
            !data.some((semester) => semester.id === mapped.semester.id) &&
            !extraSemesters.some((semester) => semester.id === mapped.semester.id)
          ) {
            extraSemesters.push({
              id: mapped.semester.id,
              key: mapped.semester.id,
              code: mapped.semester.code,
              name: mapped.semester.name,
              schoolYear: mapped.semester.schoolYear,
              studentSemesterResult: [],
              subjectClasses: [],
            })
          }
        } else if (planned != null) {
          const virtualId = `ctdt-${planned}`
          const list = baoLuuBySemester.get(virtualId) ?? []
          list.push(row)
          baoLuuBySemester.set(virtualId, list)
          if (!extraSemesters.some((semester) => semester.id === virtualId)) {
            extraSemesters.push({
              id: virtualId,
              key: virtualId,
              code: `Học kỳ ${planned}`,
              name: "",
              schoolYear: null,
              studentSemesterResult: [],
              subjectClasses: [],
            })
          }
        }
      }
    }

    const semesters = [...data, ...extraSemesters]
      .filter((s) => !semesterId || semesterId === s.id)
      .map((semester) => {
        const result = semesterResultById.get(semester.id)
        const existingSubjectIds = new Set(
          (semester.subjectClasses ?? [])
            .map((item: { subject?: { id?: string } }) => item.subject?.id)
            .filter(Boolean)
        )
        const baoLuuRows = (baoLuuBySemester.get(semester.id) ?? []).filter(
          (row) => !existingSubjectIds.has(row.subject?.id)
        )
        const subjectClasses = [...(semester.subjectClasses ?? []), ...baoLuuRows]
        if (!result) return { ...semester, subjectClasses }
        return {
          ...semester,
          studentSemesterResult: [result],
          subjectClasses: [
            ...subjectClasses,
            {
              id: `summary-${semester.id}`,
              $isSummary: true,
              semesterResult: result,
              subjectClassStudent: [],
            },
          ],
        }
      })

    if (!latestYearResult) return semesters

    return [
      ...semesters,
      {
        id: "toan-khoa",
        key: "toan-khoa",
        code: "Toàn khóa",
        name: "",
        schoolYear: { name: "" },
        studentSemesterResult: [],
        yearResult: latestYearResult,
        subjectClasses: [],
      },
    ]
  }, [
    data,
    semesterId,
    latestYearResult,
    semesterResultById,
    plannedSubjects,
    manualScoreData,
    student?.studentSemesterResult,
    subjectClassTypeFilter,
  ])

  const exportTemplate = async () => {
    if (!studentId) {
      message.warning("Không tìm thấy học viên")
      return
    }
    showSpinner()
    try {
      const res = await customTrainingFetch<{
        status: number
        data: Blob & { message?: string }
      }>("/api/student-result/export-bang-diem-ca-nhan-p2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      })
      if (res.status === 200 && res.data instanceof Blob) {
        const fileName = `BDCN-${student?.userProfile?.code ?? ""}-${student?.userProfile?.fullname ?? ""}.xlsx`
        saveAs(res.data, fileName)
      } else {
        message.error(res.data?.message || "Xuất file thất bại")
      }
    } catch {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const exportTemplateP7 = async () => {
    if (!studentId) {
      message.warning("Không tìm thấy học viên")
      return
    }
    showSpinner()
    try {
      const res = await customTrainingFetch<{
        status: number
        data: Blob & { message?: string }
      }>("/api/student-result/export-bang-diem-ca-nhan-p7", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      })
      if (res.status === 200 && res.data instanceof Blob) {
        const fileName = `BDCN-${student?.userProfile?.code ?? ""}-${student?.userProfile?.fullname ?? ""}.xlsx`
        saveAs(res.data, fileName)
      } else {
        message.error(res.data?.message || "Xuất file thất bại")
      }
    } catch {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const handleExportQuaTrinh = async () => {
    if (!studentId) {
      message.warning("Không tìm thấy học viên")
      return
    }
    showSpinner()
    try {
      const res = await customTrainingFetch<{
        status: number
        data: Blob & { message?: string }
      }>("/api/student-result/export-bang-diem-qua-trinh-hoc-vien", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      })
      if (res.status === 200 && res.data instanceof Blob) {
        const fileName = `BDQT-${student?.userProfile?.code ?? ""}-${student?.userProfile?.fullname ?? ""}.xlsx`
        saveAs(res.data, fileName)
      } else {
        message.error(res.data?.message || "Xuất file thất bại")
      }
    } catch {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Quản lý hồ sơ" },
        {
          title: "Lớp quản lý",
          href: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE,
        },
        {
          title: "Chi tiết lớp quản lý",
          href: student?.fixedClassId
            ? ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_ID.replace("[id]", student?.fixedClassId)
            : undefined,
        },
        { title: "Kết quả học tập" },
      ]}
    >
      <div>
        <Divider orientation="left" orientationMargin={0}>
          {[
            student?.userProfile?.code,
            student?.userProfile?.fullname,
            student?.fixedClass?.trainingCourse.trainingObjectType.name,
            student?.fixedClass?.trainingCourse?.name,
            student?.fixedClass?.curriculumVersion?.name,
            student?.fixedClass?.curriculumVersion?.curriculum.trainingMajor?.name,
            student?.fixedClass?.curriculumVersion?.curriculum.trainingMajor?.trainingField?.name,
          ]
            .filter(Boolean)
            .join(" - ")}
        </Divider>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Row gutter={[8, 8]} align="top" justify="space-between">
              <Col xs={24}>
                <Flex justify="space-between" wrap="wrap" gap="8px" className="mt-1">
                  <div>
                    <h3 className="text-lg font-bold">Kết quả học tập theo kỳ</h3>
                  </div>
                  <div className="flex flex-row gap-2">
                    {can(
                      QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_SV_HV_CHUYEN_TRUONG,
                      "THEM"
                    ) && (
                      <Button type="primary" onClick={() => onOpenModalNhapDiem(studentId)}>
                        Nhập điểm trực tiếp
                      </Button>
                    )}
                    <Dropdown
                      menu={{
                        items: [
                          {
                            label: "Bảng điểm cá nhân (Mẫu P2)",
                            key: "export-bang-diem-ca-nhan-P2",
                            onClick: async () => await exportTemplate(),
                          },
                          {
                            label: "Bảng điểm cá nhân (Mẫu P7)",
                            key: "export-bang-diem-ca-nhan-P7",
                            onClick: async () => await exportTemplateP7(),
                          },
                        ],
                      }}
                    >
                      <Button type="primary" icon={<DownloadOutlined />}>
                        Xuất bảng điểm cá nhân
                      </Button>
                    </Dropdown>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => handleExportQuaTrinh()}
                    >
                      Bảng điểm quá trình
                    </Button>
                  </div>
                </Flex>
              </Col>
            </Row>
          </Col>

          <Col span={24}>
            <Flex justify="space-between">
              <div className="flex items-center gap-2">
                <Select
                  value={semesterId}
                  onChange={(v) => setSemesterId(v)}
                  placeholder="Chọn kỳ học"
                  className="w-64"
                  options={data.map((s) => ({
                    label: `${s.code} - ${s.name} - ${s.schoolYear.name}`,
                    value: s.id,
                  }))}
                />
                <Button
                  type={subjectClassTypeFilter === undefined ? "primary" : "default"}
                  onClick={() => setSubjectClassTypeFilter(undefined)}
                >
                  Tất cả
                </Button>
                <Button
                  type={
                    subjectClassTypeFilter === $Enums.SubjectClassType.RETAKE
                      ? "primary"
                      : "default"
                  }
                  onClick={() =>
                    setSubjectClassTypeFilter((prev) =>
                      prev === $Enums.SubjectClassType.RETAKE
                        ? undefined
                        : $Enums.SubjectClassType.RETAKE
                    )
                  }
                >
                  Học lại
                </Button>
                <Button
                  type={
                    subjectClassTypeFilter === $Enums.SubjectClassType.REEXAM
                      ? "primary"
                      : "default"
                  }
                  onClick={() =>
                    setSubjectClassTypeFilter((prev) =>
                      prev === $Enums.SubjectClassType.REEXAM
                        ? undefined
                        : $Enums.SubjectClassType.REEXAM
                    )
                  }
                >
                  Thi lại
                </Button>
              </div>
              <Button onClick={() => setExpandAll(!expandAll)}>
                {expandAll ? "Thu gọn" : "Mở rộng"}
              </Button>
            </Flex>
            <TableCollapse
              rowKey="key"
              onRow={(record: any) => baoLuuRowProps(!!record?.baoLuu)}
              currentPage={1}
              headerTitleKey={({ code, name, schoolYear }) => (
                <p className="font-bold text-base">
                  {[code, name, schoolYear?.name].filter(Boolean).join(" - ")}
                </p>
              )}
              headerColumn={[
                { colSpan: 1 },
                {
                  render: (_, semester) => {
                    const { code, name, schoolYear, id } = semester
                    if (id === "toan-khoa") {
                      const yearResult = (
                        semester as { yearResult?: { cumulativeGpaBase4?: unknown } }
                      ).yearResult
                      const tbctl4 =
                        yearResult?.cumulativeGpaBase4 != null
                          ? Number(yearResult.cumulativeGpaBase4).toFixed(2)
                          : "—"
                      return (
                        <div className="flex items-center gap-20">
                          <p className="font-medium text-base">Toàn khóa</p>
                          <span className="font-semibold text-xs text-black-500">
                            TBCTL hệ 4: {tbctl4}
                          </span>
                        </div>
                      )
                    }
                    const r = semester.studentSemesterResult?.[0]
                    return (
                      <div className="flex items-center gap-20">
                        <p className="font-medium text-base">
                          {[code, name, schoolYear?.name].filter(Boolean).join(" - ")}
                        </p>
                        {r && (
                          <span className="font-semibold text-xs text-black-500">
                            TBTL10: {formatGpa(r.cumulativeGpaBase10)} | TBTL4:{" "}
                            {formatGpa(r.cumulativeGpaBase4)}
                          </span>
                        )}
                      </div>
                    )
                  },
                  colSpan: 15,
                },
              ]}
              filters={filters}
              setFilters={(value) => setFilters(value)}
              childrenFieldName="subjectClasses"
              defaultExpandAll={expandAll}
              columns={[
                {
                  title: "Mã môn học",
                  align: "center",
                  dataIndex: "code",
                  type: "input",
                  fixed: "left",
                  width: 120,
                  render: (_, record: any) => {
                    const isRetakeOrReexam =
                      record?.type === $Enums.SubjectClassType.RETAKE ||
                      record?.type === $Enums.SubjectClassType.REEXAM
                    return (
                      <span className={isRetakeOrReexam ? "italic text-blue-500" : ""}>
                        {record?.subject?.code || ""}
                      </span>
                    )
                  },
                },
                {
                  title: "Tên môn học",
                  align: "center",
                  dataIndex: "name",
                  fixed: "left",
                  type: "input_search",
                  options: trainingSubjectVersions.map((item) => ({
                    label: item.name,
                    value: item.name,
                  })),
                  width: 200,
                  render: (value: string, record: any) => {
                    const isRetakeOrReexam =
                      record?.type === $Enums.SubjectClassType.RETAKE ||
                      record?.type === $Enums.SubjectClassType.REEXAM
                    return (
                      <div className="flex flex-row items-center text-left">
                        <p>
                          {record?.type === $Enums.SubjectClassType.RETAKE ? (
                            <Tag color="blue" className="p-0 px-1">
                              Học lại
                            </Tag>
                          ) : record?.type === $Enums.SubjectClassType.REEXAM ? (
                            <Tag color="yellow" className="p-0 px-1">
                              Thi lại
                            </Tag>
                          ) : null}
                        </p>
                        <span className={isRetakeOrReexam ? "italic text-blue-500" : ""}>
                          {value}
                        </span>
                      </div>
                    )
                  },
                },
                {
                  title: "Điểm TX",
                  align: "center",
                  dataIndex: "attendanceScoreCmp",
                  type: "cmp",
                  width: 80,
                  render: (_, record) => {
                    if (record.$isSummary) return null
                    return record?.subjectClassStudent?.[0]?.attendanceScore
                  },
                },
                {
                  title: "Điểm ĐK",
                  align: "center",
                  dataIndex: "midtermScoreCmp",
                  type: "cmp",
                  width: 80,
                  render: (_, record: any) => {
                    if (record.$isSummary) return null
                    return record?.subjectClassStudent?.[0]?.midtermScore
                  },
                },
                {
                  title: "Điểm thi",
                  align: "center",
                  dataIndex: "examScoreCmp",
                  type: "cmp",
                  width: 80,
                  render: (_, record: any) => {
                    if (record.$isSummary) return null
                    return record?.subjectClassStudent?.[0]?.examScore
                  },
                },
                {
                  title: "Điểm cộng",
                  align: "center",
                  width: 80,
                  render: (_, record: any) => {
                    if (record.$isSummary) return null
                    const totalBonus = record.subjectClassStudent?.[0]?.awards.reduce(
                      (acc: number, curr: { archivedAward: { bonusScore: number } }) =>
                        acc + (curr?.archivedAward?.bonusScore ?? 0),
                      0
                    )
                    return totalBonus || 0
                  },
                },
                {
                  title: "Chứng chỉ",
                  align: "center",
                  width: 150,
                  render: (_, record: any) => {
                    if (record.$isSummary) return null
                    return record.subjectClassStudent?.[0]?.certificates
                      .map(
                        (i: { archivedCertificate: ArchivedCertificate }) =>
                          i?.archivedCertificate?.code
                      )
                      .join(", ")
                  },
                },
                {
                  title: <Tooltip title="Điểm tương đương">Điểm TĐ</Tooltip>,
                  align: "center",
                  width: 80,
                  render: (__, record: any) => {
                    if (record.$isSummary) return null
                    const arr: { finalScore: number }[] =
                      record.subjectClassStudent?.[0]?.certificates.map(
                        (i: { archivedCertificate: ArchivedCertificate }) => ({
                          ...i,
                          finalScore: Number(i?.archivedCertificate?.finalScore) || 0,
                        })
                      )
                    return arr?.length > 0 ? _.maxBy(arr, "finalScore")?.finalScore : ""
                  },
                },
                {
                  title: <Tooltip title="Số tín chỉ">STC</Tooltip>,
                  align: "center",
                  dataIndex: "creditCmp",
                  type: "cmp",
                  width: 100,
                  render: (_, record) => record?.subject?.credit,
                },
                {
                  title: "Điểm hệ 10",
                  align: "center",
                  dataIndex: "finalScoreCmp",
                  type: "cmp",
                  width: 100,
                  render: (_, record) => {
                    const s = record?.subjectClassStudent?.[0]
                    return s?.manualFinalScore != null
                      ? Number(s.manualFinalScore)
                      : s?.finalScore != null
                        ? Number(s.finalScore)
                        : ""
                  },
                },
                {
                  title: "Điểm hệ 4",
                  align: "center",
                  dataIndex: "finalScore4",
                  width: 80,
                  render: (_, record: any) => {
                    if (record.$isSummary) return null
                    const s = record?.subjectClassStudent?.[0]
                    const score =
                      s?.manualFinalScore != null
                        ? Number(s.manualFinalScore)
                        : s?.finalScore != null
                          ? Number(s.finalScore)
                          : undefined
                    if (score == null) return null
                    const isGraduation = record?.subject?.trainingBlocks?.[0]?.graduation === true
                    const isConditional =
                      record?.subject?.trainingBlocks?.[0]?.useForFinalScore === false
                    return (
                      convertScoreWithGraduation(
                        score,
                        isGraduation,
                        isConditional,
                        s?.attendanceScore != null ? Number(s.attendanceScore) : undefined,
                        s?.midtermScore != null ? Number(s.midtermScore) : undefined,
                        s?.examScore != null ? Number(s.examScore) : undefined
                      )?.base4 ?? ""
                    )
                  },
                },
                {
                  title: "Điểm hệ chữ",
                  align: "center",
                  width: 80,
                  render: (_, record: any) => {
                    if (record.$isSummary) {
                      return <b>{record.semesterResult.rank?.name || ""}</b>
                    }
                    const s = record?.subjectClassStudent?.[0]
                    const score =
                      s?.manualFinalScore != null
                        ? Number(s.manualFinalScore)
                        : s?.finalScore != null
                          ? Number(s.finalScore)
                          : undefined
                    if (score == null) return null
                    const isGraduation = record?.subject?.trainingBlocks?.[0]?.graduation === true
                    const isConditional =
                      record?.subject?.trainingBlocks?.[0]?.useForFinalScore === false
                    return (
                      convertScoreWithGraduation(
                        score,
                        isGraduation,
                        isConditional,
                        s?.attendanceScore != null ? Number(s.attendanceScore) : undefined,
                        s?.midtermScore != null ? Number(s.midtermScore) : undefined,
                        s?.examScore != null ? Number(s.examScore) : undefined
                      )?.letter ?? ""
                    )
                  },
                },
                {
                  title: "Kết quả",
                  align: "center",
                  width: 100,
                  render: (_: any, record) => {
                    const s = record.subjectClassStudent?.[0]
                    const score =
                      s?.manualFinalScore != null
                        ? Number(s.manualFinalScore)
                        : s?.finalScore != null
                          ? Number(s.finalScore)
                          : undefined
                    if (score == null) return null
                    const isGraduation = record?.subject?.trainingBlocks?.[0]?.graduation === true
                    const isConditional =
                      record?.subject?.trainingBlocks?.[0]?.useForFinalScore === false
                    const result = convertScoreWithGraduation(
                      score,
                      isGraduation,
                      isConditional,
                      s?.attendanceScore != null ? Number(s.attendanceScore) : undefined,
                      s?.midtermScore != null ? Number(s.midtermScore) : undefined,
                      s?.examScore != null ? Number(s.examScore) : undefined
                    )
                    return (
                      <div className="flex items-center justify-center">
                        {result?.pass ? (
                          <Check size={18} color="green" />
                        ) : (
                          <X size={18} color="red" />
                        )}
                      </div>
                    )
                  },
                },
                {
                  title: "Ghi chú",
                  align: "center",
                  dataIndex: ["subjectClassStudent", "0", "description"],
                  width: 200,
                  render: (value: string, record) => {
                    if (record.$isSummary) {
                      const r = record.semesterResult
                      return (
                        <span className="font-semibold text-xs">
                          TBHK10: {formatGpa(r.gpaBase10)} | TBHK4: {formatGpa(r.gpaBase4)}
                        </span>
                      )
                    }
                    return (
                      <Tooltip title={visibleScoreNote(value)}>
                        <span className="line-clamp-2">{visibleScoreNote(value)}</span>
                      </Tooltip>
                    )
                  },
                },
                {
                  title: "Thao tác",
                  width: 150,
                  align: "center",
                  fixed: "right",
                  render: (_, { id, subjectClassStudent }: any) => {
                    if (subjectClassStudent?.length === 0 && !id?.startsWith?.("summary-"))
                      return null
                    if (id?.startsWith?.("summary-")) return null
                    return (
                      <Row className="justify-center gap-2">
                        <Tooltip title="Thêm chứng chỉ">
                          <SafetyCertificateOutlined
                            className="cursor-pointer hover:text-green-500"
                            onClick={() => {
                              onOpenModalAddCertificate({
                                id: subjectClassStudent?.[0]?.id,
                                studentId: studentId,
                                list:
                                  subjectClassStudent?.[0]?.certificates.map(
                                    (i: any) => i.archivedCertificateId
                                  ) || [],
                                subjectClassStudent: subjectClassStudent?.[0],
                              })
                            }}
                          />
                        </Tooltip>
                      </Row>
                    )
                  },
                },
              ]}
              data={dataWithSummary}
              pagination={{ hideOnSinglePage: true }}
            />
          </Col>

          <Col span={24}>
            <h3 className="text-lg font-bold">Danh sách điểm phiên</h3>
            <Table
              columns={[
                {
                  title: "STT",
                  width: 50,
                  align: "center",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Mã môn học",
                  width: 150,
                  align: "center",
                  render: (_, record) => record?.subjectVersion?.code,
                },
                {
                  title: "Tên môn học",
                  align: "center",
                  render: (_, record) => (
                    <span
                      style={
                        isBaoLuuScoreDescription(record.description)
                          ? { color: "#15803d" }
                          : undefined
                      }
                    >
                      {record?.subjectVersion?.name}
                    </span>
                  ),
                },
                {
                  title: "Điểm",
                  dataIndex: "manualFinalScore",
                  align: "center",
                  width: 150,
                  render: (value, record) => (
                    <span
                      style={
                        isBaoLuuScoreDescription(record.description)
                          ? { color: "#15803d" }
                          : undefined
                      }
                    >
                      {value}
                    </span>
                  ),
                },
                {
                  title: "Ghi chú",
                  dataIndex: "description",
                  align: "center",
                  width: 250,
                  render: (value: string) => visibleScoreNote(value),
                },
              ]}
              data={manualScoreData}
              pagination={false}
            />
          </Col>
        </Row>
      </div>
    </DefaultLayout>
  )
}
