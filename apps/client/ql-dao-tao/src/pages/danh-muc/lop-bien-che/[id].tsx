import { DownloadOutlined, SafetyCertificateOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import TextTruncate from "@components/commons/text-truncate"
import DeleteIcon from "@components/icons/delete"
import ExportStudentInFixedClass from "@components/modal/export-list-student-in-fixedClass"
import { FIXED_CLASS_STUDENT_STATUS } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useScoreConverter } from "@hooks/scoreConverter"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { $Enums, type Semester, type StudentSemesterResult } from "@workspace/db"
import type { Student } from "@workspace/db/client"
import {
  useFindManyCurriculumVersion,
  useFindManyDM_GioiTinh,
  useFindManyStudent,
  useFindManyTrainingField,
  useFindManyTrainingMajor,
  useFindUniqueFixedClass,
  useUpdateManyStudent,
  useUpdateStudent,
} from "@workspace/db/hooks"
import { sqlTransaction, type sqlTransactionResponse200 } from "@workspace/libs/api/model"
import { Docxtemplater, exportFile, loadFile } from "@workspace/libs/docxjs"
import { exportFromTemplate, type TableRow } from "@workspace/libs/template-excel"
import { getMinioUrl } from "@workspace/libs/utils"
import { ROUTER_PATH } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Divider, Dropdown, Flex, message, Popconfirm, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import { saveAs } from "file-saver"
import _ from "lodash"
import { BookCheckIcon } from "lucide-react"
import { useRouter } from "next/router"
import { useCallback, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { cn } from "@workspace/ui/lib/utils"
import type { IHocKi, IMonHoc } from "./ket-qua-hoc-tap/[id]"

dayjs.locale("vi")

export default function StudentFixedClassPage() {
  const router = useRouter()
  const fixedClassId = router.query.id as string
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  const [filters, setFilters] = useState<FilterProps>({
    gender: undefined,
    name: "",
    code: "",
    curriculumVersion: undefined,
    trainingMajors: undefined,
    trainingField: undefined,
    dateOfBirth: undefined,
    phone: undefined,
    statusStudent: undefined,
    rank: undefined,
    curriculumVersionParallel: undefined,
  })

  const { data: trainingMajorData = [] } = useFindManyTrainingMajor(
    {
      where: {
        curriculum: {
          some: {
            curriculumVersion: {
              some: {
                OR: [
                  {
                    fixedClass: { id: fixedClassId },
                  },
                  {
                    students: { some: { fixedClassId } },
                  },
                ],
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    },
    {
      enabled: !!fixedClassId,
    }
  )

  const { data: trainingFieldData = [] } = useFindManyTrainingField(
    {
      where: {
        trainingMajors: {
          some: {
            curriculum: {
              some: {
                curriculumVersion: {
                  some: {
                    OR: [
                      {
                        fixedClass: { id: fixedClassId },
                      },
                      {
                        students: { some: { fixedClassId } },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    },
    {
      enabled: !!fixedClassId,
    }
  )

  const { data: curriculumVersionData = [] } = useFindManyCurriculumVersion(
    {
      where: {
        OR: [
          {
            students: { some: { fixedClassId } },
          },
          {
            fixedClass: { id: fixedClassId },
          },
        ],
      },
      orderBy: { name: "asc" },
    },
    {
      enabled: !!fixedClassId,
    }
  )

  const { getLabel: getLabelTrainingObjectType } = useTrainingObjectTypeStore()
  const { data: genderData = [] } = useFindManyDM_GioiTinh()

  const { data: fixedClass } = useFindUniqueFixedClass(
    {
      where: {
        id: fixedClassId,
      },
      include: {
        _count: {
          select: {
            students: {
              where: {
                active: true,
                status: "ENROLLED",
              },
            },
          },
        },
        trainingCourse: {
          include: {
            trainingObjectType: true,
            semesterStart: {
              include: {
                schoolYear: true,
              },
            },
          },
        },
        curriculumVersion: {
          include: {
            curriculum: {
              include: {
                trainingMajor: {
                  include: {
                    trainingField: true,
                  },
                },
              },
            },
            trainingBlocks: {
              include: {
                subjects: {
                  include: {
                    subject: {
                      include: {
                        managementOrganization: true,
                      },
                    },
                    trainingBlockOnCurriculumVersion: {
                      select: {
                        trainingBlock: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                  orderBy: {
                    semester: "asc",
                  },
                },
              },
              orderBy: {
                priority: "asc",
              },
            },
          },
        },
        managementOrganization: true,
      },
    },
    {
      enabled: !!fixedClassId,
    }
  )

  const canBoRoles = [
    { id: fixedClass?.classMonitorId, label: "Lớp trưởng", className: "bg-blue-200" },
    { id: fixedClass?.unionSecretaryId, label: "Bí thư", className: "bg-green-200" },
    { id: fixedClass?.unionLeaderId, label: "Bí thư liên chi đoàn", className: "bg-yellow-200" },
    {
      id: fixedClass?.deputyUnionSecretaryId,
      label: "Phó bí thư liên chi đoàn",
      className: "bg-orange-200",
    },
  ]

  const roleByStudentId = useMemo(() => {
    const map: Record<string, string> = {}
    for (const r of canBoRoles) {
      if (r.id) map[r.id] = r.className
    }
    return map
  }, [
    fixedClass?.classMonitorId,
    fixedClass?.unionSecretaryId,
    fixedClass?.unionLeaderId,
    fixedClass?.deputyUnionSecretaryId,
  ])

  const { data = [] } = useFindManyStudent(
    {
      where: {
        fixedClassId,
        userProfile: {
          ...(filters.name
            ? {
                fullname: {
                  contains: filters.name,
                  mode: "insensitive",
                },
              }
            : {}),
          ...(filters.rank
            ? {
                rank: {
                  sTen: {
                    contains: filters.rank,
                    mode: "insensitive",
                  },
                },
              }
            : {}),
          ...(filters.phone
            ? {
                phoneNumber: {
                  contains: filters.phone,
                  mode: "insensitive",
                },
              }
            : {}),
          ...(filters.gender
            ? {
                genderId: {
                  in: filters.gender,
                },
              }
            : {}),
          ...(filters.dateOfBirth?.length === 2
            ? {
                dateOfBirth: {
                  gte: dayjs(filters.dateOfBirth?.[0], "DD/MM/YYYY").toDate(),
                  lte: dayjs(filters.dateOfBirth?.[1], "DD/MM/YYYY").toDate(),
                },
              }
            : {}),
        },
        ...(filters.code
          ? {
              code: {
                contains: filters.code,
                mode: "insensitive",
              },
            }
          : {}),
        ...(filters.curriculumVersion
          ? {
              curriculumVersionId: {
                in: filters.curriculumVersion,
              },
            }
          : {}),
        ...(filters.statusStudent
          ? {
              status: {
                in: filters.statusStudent,
              },
            }
          : {}),
        ...(filters.curriculumVersionParallel
          ? {
              curriculumVersionParallelId: {
                in: filters.curriculumVersionParallel,
              },
            }
          : {}),
      },
      include: {
        userProfile: {
          include: {
            rank: true,
            gender: true,
          },
        },
        fixedClass: {
          include: {
            trainingCourse: {
              include: {
                scoreConverts: true,
                trainingObjectType: {
                  include: {
                    trainingFields: {
                      include: {
                        trainingField: true,
                      },
                    },
                    trainingMajors: {
                      include: {
                        trainingMajor: true,
                      },
                    },
                  },
                },
              },
            },
            curriculumVersion: {
              include: {
                curriculum: {
                  include: {
                    trainingObjectType: {},
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
        curriculumVersion: {
          include: {
            curriculum: {
              select: {
                trainingMajor: {
                  select: {
                    name: true,
                    trainingField: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            trainingTime: true,
            trainingLanguage: true,
          },
        },
        curriculumVersionParallel: true,
        subjectClassStudent: {
          include: {
            subjectVersion: {
              include: {
                subject: true,
              },
            },
          },
        },
        studentSemesterResult: {
          orderBy: { semester: { startDate: "desc" } },
          include: {
            semester: {
              include: {
                schoolYear: true,
              },
            },
          },
        },
        thesisRegistrations: {
          include: {
            thesisProject: {
              include: {
                defenseRecord: true,
              },
            },
          },
        },
      },
      orderBy: {
        userProfile: {
          firstName: "asc",
        },
      },
    },
    {
      enabled: !!fixedClassId,
    }
  )

  const { convertScore } = useScoreConverter(data?.[0]?.fixedClass?.trainingCourse?.scoreConverts)
  const scoreToPassGraduation = data?.[0]?.fixedClass?.trainingCourse?.scoreToPassGraduation ?? 5.5

  const convertScoreWithGraduation = useCallback(
    (score: number | null | undefined, isGraduation: boolean) => {
      if (score == null) return null
      if (isGraduation && score < scoreToPassGraduation) {
        return { base4: 0, letter: "F", pass: false, classification: undefined }
      }
      return convertScore(score)
    },
    [convertScore, scoreToPassGraduation]
  )

  const { onOpen } = useDisclosure<{
    id: string
  }>({
    tag: "AddStudentToFixedClassModal",
  })

  const { onOpen: onOpenPrint } = useDisclosure<{
    dataTable: Student[]
    dataFixedClass: any
  }>({
    tag: "ModalPrintToDSHV",
  })

  const { onOpen: onOpenStandardOutput } = useDisclosure<{
    id: string
  }>({
    tag: "PutChuanDauRaModal",
  })

  const { onOpen: onOpenGanCanBo } = useDisclosure<{
    id: string
  }>({
    tag: "GanCanBoLopModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen({ id: fixedClassId })
  }

  const handleModalPrint = () => {
    onOpenPrint({ dataFixedClass: fixedClass, dataTable: data })
  }

  const { mutateAsync: updateUserProfile } = useUpdateStudent()
  const { mutateAsync: updateManyUserProfile } = useUpdateManyStudent()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateUserProfile({
        where: { id },
        data: { fixedClassId: null },
      })
      setSelectedRowKeys([])
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  async function handleDeleteMulti() {
    try {
      showSpinner()
      if (selectedRowKeys?.length > 0) {
        await updateManyUserProfile({
          where: { id: { in: selectedRowKeys } },
          data: { fixedClassId: null },
        })
      }
      setOpen(false)
      setSelectedRowKeys([])
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const handleCancel = () => {
    setOpen(false)
  }

  const showPopconfirm = () => {
    setOpen(true)
  }
  const handleExportDiemLop = async () => {
    const trainingCourseId = fixedClass?.trainingCourseId
    if (!trainingCourseId) {
      message.error("Không xác định được khóa học")
      return
    }
    showSpinner()
    try {
      // ── Types nội bộ cho export bảng điểm ──────────────────────────────
      type ScoreValue = string | number | null

      interface SubjectExport {
        semester: number | null
        graduation: boolean | null
        subject: {
          id: string
          name: string
          credit: number | null
        }
      }

      interface SubjectClassStudentExport {
        subjectVersionId: string
        exempted: boolean | null
        examPostponed: boolean | null
        examBanned: boolean | null
        suspended: boolean | null
        manualFinalScore: number | null
        finalScore: number | null
      }

      interface UserProfileExport {
        fullname: string
        dateOfBirth: Date | string | null
      }

      interface ThesisDefenseRecord {
        finalScore: number | null
      }

      interface ThesisProject {
        defenseRecord: ThesisDefenseRecord | null
      }

      interface ThesisRegistration {
        thesisProject: ThesisProject | null
      }

      interface StudentExport {
        foreignLangPass: boolean | null
        userProfile: UserProfileExport
        thesisRegistrations: ThesisRegistration[]
        subjectClassStudent: SubjectClassStudentExport[]
      }

      interface SchoolYearExport {
        startDate: string | Date | null
        endDate: string | Date | null
      }

      interface SemesterExport {
        schoolYear: SchoolYearExport | null
      }

      interface TrainingObjectTypeExport {
        name: string
      }

      interface TrainingCourseExport {
        id: string
        name: string
        trainingObjectType: TrainingObjectTypeExport | null
        semesterStart: SemesterExport | null
      }

      interface TrainingMajorExport {
        code: string | null
        name: string | null
      }

      interface CurriculumExport {
        trainingMajor: TrainingMajorExport | null
      }

      interface TrainingBlockExport {
        subjects: SubjectExport[]
      }

      interface CurriculumVersionExport {
        curriculum: CurriculumExport | null
        trainingBlocks: TrainingBlockExport[]
      }

      interface FixedClassDetail {
        id: string
        name: string
        trainingCourse: TrainingCourseExport
        curriculumVersion: CurriculumVersionExport | null
        students: StudentExport[]
      }

      // ── Fetch danh sách lớp trong cùng khóa ──────────────────────────
      const classListRes = await sqlTransaction([
        {
          model: "FixedClass",
          operation: "findMany",
          data: {
            where: { trainingCourseId, deletedAt: null, active: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          },
        },
      ])

      if (classListRes.status !== 200) {
        message.warning("Không tải được danh sách lớp")
        return
      }

      const allClassIds = (classListRes.data[0] ?? []) as { id: string; name: string }[]

      if (!allClassIds.length) {
        message.warning("Không tìm thấy lớp biên chế nào trong khóa học")
        return
      }

      const toNumericScore = (value: unknown): number | null => {
        if (typeof value === "number") return Number.isFinite(value) ? value : null
        if (typeof value === "string") {
          const normalized = value.trim().replace(",", ".")
          if (normalized === "") return null
          const parsed = Number(normalized)
          return Number.isFinite(parsed) ? parsed : null
        }
        if (value && typeof value === "object") {
          const maybeNumber = (value as { toNumber?: () => number }).toNumber?.()
          if (typeof maybeNumber === "number" && Number.isFinite(maybeNumber)) return maybeNumber
          const text = String(value).trim().replace(",", ".")
          if (text && text !== "[object Object]") {
            const parsed = Number(text)
            return Number.isFinite(parsed) ? parsed : null
          }
        }
        return null
      }

      const allSheets: Parameters<typeof exportFromTemplate>[0]["sheets"] = []

      for (const cls of allClassIds) {
        const res = await sqlTransaction([
          {
            model: "FixedClass" as Parameters<typeof sqlTransaction>[0][number]["model"],
            operation: "findUnique" as Parameters<typeof sqlTransaction>[0][number]["operation"],
            data: {
              where: { id: cls.id },
              include: {
                trainingCourse: {
                  include: {
                    trainingObjectType: true,
                    semesterStart: { include: { schoolYear: true } },
                  },
                },
                curriculumVersion: {
                  include: {
                    curriculum: {
                      include: {
                        trainingMajor: { include: { trainingField: true } },
                      },
                    },
                    trainingBlocks: {
                      include: {
                        subjects: {
                          include: { subject: { include: { managementOrganization: true } } },
                          orderBy: { semester: "asc" },
                        },
                      },
                      orderBy: { priority: "asc" },
                    },
                  },
                },
                students: {
                  where: { active: true, status: "ENROLLED", deletedAt: null },
                  include: {
                    userProfile: true,
                    fixedClass: {
                      include: { trainingCourse: { include: { trainingObjectType: true } } },
                    },
                    thesisRegistrations: {
                      where: { deletedAt: null },
                      include: { thesisProject: { include: { defenseRecord: true } } },
                    },
                    subjectClassStudent: {
                      include: {
                        subjectVersion: {
                          include: {
                            trainingBlocks: { select: { graduation: true }, take: 1 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ])

        if (res.status !== 200 || !res.data[0]) continue
        const detail = res.data[0] as FixedClassDetail

        const students = detail.students
        if (!students.length) continue

        const subjectsInOrder: SubjectExport[] = (detail.curriculumVersion?.trainingBlocks ?? [])
          .flatMap((block) => block.subjects)
          .sort((a, b) => (a.semester ?? 0) - (b.semester ?? 0))

        if (!subjectsInOrder.length) continue

        const tongSoHP = subjectsInOrder.length
        const tongSoTC = subjectsInOrder.reduce((s, sub) => s + (sub.subject.credit ?? 0), 0)
        const chuthichMonHoc: string[] = subjectsInOrder.map(
          (s, idx) => `M${idx + 1}. ${s.subject.name}`
        )

        const studentRows: TableRow[] = students.map((student, index) => {
          const thesisReg = student.thesisRegistrations[0]
          const defenseScore = thesisReg?.thesisProject?.defenseRecord?.finalScore ?? null

          const diem: ScoreValue[] = subjectsInOrder.map((subjectInfo) => {
            const scoreData = student.subjectClassStudent.find(
              (score) => score.subjectVersionId === subjectInfo.subject.id
            )
            if (!scoreData) return " "
            if (scoreData.exempted) return "Miễn"
            if (scoreData.examPostponed) return "HT"
            if (scoreData.examBanned) return "CT"
            if (scoreData.suspended) return "ĐCT"
            const final = scoreData.manualFinalScore ?? scoreData.finalScore
            return final !== null && final !== undefined ? final : "Null"
          })

          const ccta = student.foreignLangPass ? "Đạt" : ""
          let totalWeightedScore = 0
          let totalCredits = 0

          subjectsInOrder.forEach((subjectInfo, i) => {
            const numericD = toNumericScore(diem[i])
            const credit = Number(subjectInfo.subject.credit ?? 0)
            if (numericD != null && Number.isFinite(numericD) && credit > 0) {
              totalWeightedScore += numericD * credit
              totalCredits += credit
            }
          })

          const tbcDisplay = totalCredits > 0 ? Number((totalWeightedScore / totalCredits).toFixed(2)) : null
          let dlv: number | null = null
          const parsedDefenseScore = toNumericScore(defenseScore)
          if (parsedDefenseScore != null && Number.isFinite(parsedDefenseScore)) {
            dlv = parsedDefenseScore
          } else {
            const thesisIdx = subjectsInOrder.findIndex((s) => {
              const name = s.subject.name.toLowerCase()
              return name.includes("luận văn") || name.includes("đề án")
            })
            if (thesisIdx >= 0) {
              const numericD = toNumericScore(diem[thesisIdx])
              if (numericD != null && Number.isFinite(numericD)) dlv = numericD
            }
          }

          return {
            cells: [
              { value: index + 1, align: "center" as const, border: true },
              { value: student.userProfile.fullname, border: true, align: "center" as const },
              {
                value: student.userProfile.dateOfBirth
                  ? dayjs(student.userProfile.dateOfBirth).format("DD/MM/YYYY")
                  : "",
                align: "center" as const,
                border: true,
              },
              {
                value: detail.trainingCourse.trainingObjectType?.name ?? "",
                align: "center" as const,
                border: true,
              },
              ...subjectsInOrder.map((subjectInfo, i) => {
                const scoreValue = diem[i]
                const isGraduation = subjectInfo.graduation === true
                const passThreshold = isGraduation ? scoreToPassGraduation : 4.0
                const numericScore = toNumericScore(scoreValue)
                const isFailed =
                  numericScore != null && Number.isFinite(numericScore) ? numericScore < passThreshold : false
                return {
                  value: scoreValue !== undefined && scoreValue !== null ? String(scoreValue) : null,
                  align: "center" as const,
                  border: true,
                  color: isFailed ? "FFFF0000" : undefined,
                }
              }),
              { value: ccta || null, align: "center" as const, border: true },
              {
                value: tbcDisplay !== null ? String(tbcDisplay) : null,
                align: "center" as const,
                border: true,
                bold: true,
              },
              { value: dlv !== null ? String(dlv) : null, align: "center" as const, border: true, bold: true },
            ],
          }
        })

        type SemesterGroup = { semesterNum: number; subjects: SubjectExport[] }
        const semesterGroups: SemesterGroup[] = []
        subjectsInOrder.forEach((s) => {
          const semNum = s.semester ?? 0
          let group = semesterGroups.find((g) => g.semesterNum === semNum)
          if (!group) {
            group = { semesterNum: semNum, subjects: [] }
            semesterGroups.push(group)
          }
          group.subjects.push(s)
        })
        semesterGroups.sort((a, b) => a.semesterNum - b.semesterNum)

        const getSemesterLabel = (semNum: number): string => {
          const schoolYear = detail.trainingCourse.semesterStart?.schoolYear
          const semesterIndexInYear = ((semNum - 1) % 2) + 1
          const schoolYearOffset = Math.floor((semNum - 1) / 2)
          const semesterName = `Học kỳ ${semesterIndexInYear}`
          if (!schoolYear?.startDate) return semesterName
          const startYear = dayjs(schoolYear.startDate).year() + schoolYearOffset
          const endYear = schoolYear.endDate
            ? dayjs(schoolYear.endDate).year() + schoolYearOffset
            : startYear + 1
          return `${semesterName} (năm học ${startYear}-${endYear})`
        }

        const totalSubjectCols = subjectsInOrder.length
        const totalTableCols = 4 + totalSubjectCols + 3

        const headerRow5: TableRow = {
          cells: [
            { value: null, border: true, rowSpan: 2 },
            {
              value: `Lớp: ${detail.name}`,
              align: "center",
              bold: true,
              border: true,
              colSpan: 2,
              rowSpan: 2,
              wrapText: true,
            },
            {
              value: "Bảng điểm các học phần cơ sở và chuyên ngành",
              align: "center",
              bold: true,
              border: true,
              colSpan: totalTableCols - 3,
              wrapText: true,
            },
          ],
        }

        const headerRow6Cells: TableRow["cells"] = [
          { value: "Đối tượng", align: "center", bold: true, border: true, rowSpan: 3, wrapText: true },
        ]
        semesterGroups.forEach((group) => {
          headerRow6Cells.push({
            value: getSemesterLabel(group.semesterNum),
            align: "center",
            bold: true,
            border: true,
            colSpan: group.subjects.length,
            wrapText: true,
          })
        })
        headerRow6Cells.push(
          { value: null, border: true },
          { value: null, border: true },
          { value: null, border: true }
        )
        const headerRow6: TableRow = { cells: headerRow6Cells }

        const headerRow7Left: TableRow = {
          cells: [
            { value: "STT", align: "center", bold: true, border: true, rowSpan: 2, wrapText: true },
            { value: "Họ và tên", align: "center", bold: true, border: true, rowSpan: 2, wrapText: true },
            { value: "Ngày sinh", align: "center", bold: true, border: true, rowSpan: 2, wrapText: true },
          ],
        }

        const headerRow7Score: TableRow = {
          cells: [
            ...subjectsInOrder.map((_, i) => ({
              value: `M${i + 1}`,
              align: "center" as const,
              bold: true,
              border: true,
              wrapText: false,
            })),
            { value: "CCTA", align: "center", bold: true, border: true, rowSpan: 2, wrapText: false },
            { value: "Điểm", align: "center", bold: true, border: true, colSpan: 2, wrapText: false },
          ],
        }

        const headerRow8Credit: TableRow = {
          cells: subjectsInOrder.map((s) => ({
            value: s.subject.credit ? Number(s.subject.credit).toFixed(1) : "",
            align: "center" as const,
            border: true,
            wrapText: false,
          })),
        }

        const headerRow8Score: TableRow = {
          cells: [
            { value: "TBC", align: "center", bold: true, border: true, wrapText: false },
            { value: "ĐLV", align: "center", bold: true, border: true, wrapText: false },
          ],
        }

        const thongKeRows: TableRow[] = [
          {
            cells: [
              {
                value: `Tổng số học phần: ${tongSoHP} HP, tổng số tín chỉ: ${tongSoTC} TC`,
                border: false,
                colSpan: totalTableCols,
                bold: true,
              },
            ],
          },
        ]

        const chuthichPerRow = 3
        const maxRowsPerColumn = Math.ceil(chuthichMonHoc.length / chuthichPerRow)
        const footerColSpan = Math.ceil(totalTableCols / chuthichPerRow)
        const columnFooterRows: TableRow[] = []

        for (let i = 0; i < maxRowsPerColumn; i++) {
          const rowCells: TableRow["cells"] = []
          for (let col = 0; col < chuthichPerRow; col++) {
            const idx = i + col * maxRowsPerColumn
            rowCells.push(
              chuthichMonHoc[idx]
                ? { value: chuthichMonHoc[idx], border: false, colSpan: footerColSpan, wrapText: false }
                : { value: null, border: false, colSpan: footerColSpan, wrapText: false }
            )
          }
          columnFooterRows.push({ cells: rowCells })
        }

        const ghiChuRows: TableRow[] = [
          { cells: [{ value: null, border: false }] },
          { cells: [{ value: null, border: false }, { value: "GHI CHÚ:", border: false, bold: true, colSpan: 29 }] },
          { cells: [{ value: null, border: false }, { value: "1. 'Null': Môn đã lên danh sách thi nhưng chưa thi hoặc giảng viên chưa nhập điểm", border: false, colSpan: 29 }] },
          { cells: [{ value: null, border: false }, { value: "2. ' ': Môn chưa lên danh sách thi", border: false, colSpan: 29 }] },
          { cells: [{ value: null, border: false }, { value: "3. 'Miễn': Môn miễn học", border: false, colSpan: 29 }] },
          { cells: [{ value: null, border: false }, { value: "4. 'HT': Môn hoãn thi", border: false, colSpan: 29 }] },
          { cells: [{ value: null, border: false }, { value: "4. 'CT': Môn cấm thi", border: false, colSpan: 29 }] },
          { cells: [{ value: null, border: false }, { value: "5. 'ĐCT': Môn đình chỉ thi", border: false, colSpan: 29 }] },
          { cells: [{ value: null, border: false }, { value: "6. Điểm TBC: Tính điểm trung bình cộng của tất cả các môn đã có điểm ở thời điểm xuất file excel điểm (Không tính điểm môn chưa thi, không tính điểm môn hoãn thi, miễn thi)", border: false, colSpan: 29 }] },
        ]

        const bodyRows = [...studentRows, ...thongKeRows, ...columnFooterRows, ...ghiChuRows]

        const curriculum = detail.curriculumVersion?.curriculum
        const nganhHoacChuyenNganh = curriculum?.trainingMajor
        const chuyenNganhText = [nganhHoacChuyenNganh?.code, nganhHoacChuyenNganh?.name]
          .filter(Boolean)
          .join(" - ")

        const sheetName = detail.name.replace(/[\\/?:*[\]]/g, "_").slice(0, 31)

        allSheets.push(
          {
            sheet: sheetName,
            data: {
              khoa: detail.trainingCourse.name.toUpperCase(),
              chuyenNganh: chuyenNganhText,
              lop: detail.name,
            },
            tableStartCell: { row: 5, col: 1 },
            rows: [headerRow5],
          },
          { sheet: sheetName, tableStartCell: { row: 6, col: 4 }, rows: [headerRow6] },
          { sheet: sheetName, tableStartCell: { row: 7, col: 1 }, rows: [headerRow7Left] },
          { sheet: sheetName, tableStartCell: { row: 7, col: 5 }, rows: [headerRow7Score] },
          { sheet: sheetName, tableStartCell: { row: 8, col: 5 }, rows: [headerRow8Credit] },
          { sheet: sheetName, tableStartCell: { row: 8, col: 5 + totalSubjectCols + 1 }, rows: [headerRow8Score] },
          { sheet: sheetName, tableStartCell: { row: 9, col: 1 }, rows: bodyRows }
        )
      }

      if (!allSheets.length) {
        message.warning("Không có dữ liệu điểm để xuất")
        return
      }

      await exportFromTemplate({
        templateUrl: getMinioUrl("/mta/template/BangdiemTheoLop_v3.xlsx"),
        sheets: allSheets,
        fileName: `BangDiemToanKhoa-${fixedClass?.trainingCourse?.name ?? "KhoaHoc"}.xlsx`,
      })
    } catch (error) {
      console.error("Export failed:", error)
      message.error("Xuất file thất bại, vui lòng thử lại!")
    } finally {
      hideSpinner()
    }
  }

  const handleExportCaNhan = async () => {
    const result: any[] = []
    showSpinner()
    try {
      const tasks = data.map(async (item) => {
        const res = await sqlTransaction([
          {
            model: "Semester",
            operation: "findMany",
            data: {
              where: {
                subjectClasses: {
                  some: {
                    subjectClassStudent: {
                      some: {
                        studentId: item.id,
                      },
                    },
                  },
                },
              },
              include: {
                subjectClasses: {
                  where: {
                    subjectClassStudent: {
                      some: {
                        studentId: item.id,
                      },
                    },
                  },
                  include: {
                    subjectClassStudent: {
                      where: {
                        studentId: item.id,
                      },
                      include: {
                        subjectVersion: {
                          include: {
                            trainingBlocks: {
                              select: { graduation: true },
                              take: 1,
                            },
                          },
                        },
                        certificates: {
                          include: {
                            archivedCertificate: true,
                          },
                        },
                        awards: {
                          where: {
                            status: $Enums.ArchivedCertificateStatus.APPROVED,
                          },
                          include: {
                            archivedAward: true,
                          },
                        },
                      },
                    },
                  },
                },
                trainingCoursesStart: {
                  where: {
                    id: item.fixedClass?.trainingCourseId ?? undefined,
                  },
                  include: {
                    scoreConverts: true,
                  },
                },
                schoolYear: true,
              },
              orderBy: {
                startDate: "asc",
              },
            },
          },
        ])

        return { item, res }
      })
      const allResults = await Promise.all(tasks)
      for (const { item, res } of allResults) {
        if (res.status === 200) {
          const hocKis: IHocKi[] = []
          if ((res.data[0] as any[]).length) {
            const rawData = res.data[0] as any[]
            const bestAttemptsMap = new Map<string, { score: number; semesterId: string }>()
            for (const semester of rawData) {
              for (const subjectClass of semester.subjectClasses) {
                for (const scs of subjectClass.subjectClassStudent) {
                  const subjectId = scs.subjectVersion?.id
                  if (!subjectId) continue

                  const currentScore = scs?.manualFinalScore || Number(scs?.finalScore) || 0
                  const existingBest = bestAttemptsMap.get(subjectId)

                  if (!existingBest || currentScore >= existingBest.score) {
                    bestAttemptsMap.set(subjectId, {
                      score: currentScore,
                      semesterId: semester.id,
                    })
                  }
                }
              }
            }
            rawData.forEach((semester) => {
              const monhoc: IMonHoc[] = []
              semester.subjectClasses.forEach((subjectClass: any) => {
                subjectClass.subjectClassStudent.forEach((subjectClassStudent: any) => {
                  const subjectId = subjectClassStudent.subjectVersion?.id
                  if (!subjectId) return

                  const bestAttempt = bestAttemptsMap.get(subjectId)
                  const currentScore =
                    subjectClassStudent?.manualFinalScore ||
                    Number(subjectClassStudent?.finalScore) ||
                    0

                  if (bestAttempt && bestAttempt.semesterId === semester.id) {
                    const isGraduation =
                      subjectClassStudent.subjectVersion?.trainingBlocks?.[0]?.graduation === true
                    const converted = convertScoreWithGraduation(currentScore, isGraduation)
                    const diemchu: string = converted?.letter ?? ""

                    if (diemchu.toUpperCase() < "F") {
                      monhoc.push({
                        TenMonhoc: subjectClassStudent.subjectVersion.name,
                        MaMH: subjectClassStudent.subjectVersion.code?.slice(0, 2) ?? "",
                        soTC: subjectClassStudent.subjectVersion.credit,
                        diemhe10: currentScore,
                        diemhe4: converted?.base4 ?? 0,
                        diemchu: diemchu,
                        ghichu: subjectClassStudent.description ?? "",
                      })
                    }
                  }
                })
              })
              const tongSoTinChi = monhoc.reduce((acc, curr) => acc + (curr.soTC ?? 0), 0)

              const tongDiemNhanTinChiHe10 = monhoc.reduce(
                (acc, curr) => acc + (curr.diemhe10 ?? 0) * (curr.soTC ?? 0),
                0
              )
              const tongDiemNhanTinChiHe4 = monhoc.reduce(
                (acc, curr) => acc + (curr.diemhe4 ?? 0) * (curr.soTC ?? 0),
                0
              )

              const diemTBHe10_Raw = tongSoTinChi === 0 ? 0 : tongDiemNhanTinChiHe10 / tongSoTinChi
              const diemTBHe4_Raw = tongSoTinChi === 0 ? 0 : tongDiemNhanTinChiHe4 / tongSoTinChi

              const diemTBHe10 = Number.parseFloat(diemTBHe10_Raw.toFixed(1))
              const diemTBHe4 = Number.parseFloat(diemTBHe4_Raw.toFixed(1))

              hocKis.push({
                TenHocKi: semester.code + "-" + semester.name + "-" + semester.schoolYear?.name,
                SoTinChiKy: tongSoTinChi,
                DiemTBKyHe10: diemTBHe10,
                DiemTBKyHe4: diemTBHe4,
                monHocs: monhoc,
              })
            })
          }
          const sampleStudentData = {
            fullname: item.userProfile?.fullname,
            dateOfBirth: ((dateInput) => {
              if (!dateInput) {
                return ""
              }
              try {
                const date = new Date(dateInput)
                if (Number.isNaN(date.getTime())) {
                  return ""
                }
                return date.toLocaleDateString("vi-VN")
              } catch (e) {
                return ""
              }
            })(item.userProfile?.dateOfBirth),
            maSV: item.code,
            htdt: item?.fixedClass?.trainingCourse?.trainingObjectType?.name,
            nganh: item.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name,
            lop: item.fixedClass?.name,
            hocKis: hocKis,
          }
          result.push(sampleStudentData)
        }
      }
      const allSheetOptions = result.map((sampleStudentData) => {
        const tableRows = sampleStudentData.hocKis.flatMap((hocKi: IHocKi) => {
          const hocKiRow: TableRow = {
            cells: [
              {
                value: hocKi.TenHocKi ?? "",
                colSpan: 19,
                bold: true,
                align: "left",
                border: true,
              },
            ],
          }
          const monHocRows: TableRow[] =
            hocKi?.monHocs?.map((monHoc: IMonHoc, index: number) => ({
              cells: [
                { value: index + 1 },
                { value: monHoc.TenMonhoc ?? "", colSpan: 6, border: true },
                { value: monHoc.MaMH ?? "" },
                { value: monHoc.soTC, align: "center" },
                { value: monHoc.diem01 ?? 0, align: "right" },
                { value: monHoc.diem02 ?? 0, align: "right" },
                { value: monHoc.diem07 ?? 0, align: "right" },
                { value: null },
                { value: null },
                { value: monHoc.diemhe10 ?? 0, align: "right" },
                { value: monHoc.diemhe4 ?? 0, align: "right" },
                { value: monHoc.diemchu ?? "", align: "center" },
                { value: null },
                { value: monHoc.ghichu ?? "" },
              ],
            })) ?? []

          const trungBinhRow: TableRow = {
            cells: [
              { value: null },
              {
                value: "Điểm trung bình học kỳ:",
                colSpan: 6,
                bold: true,
                align: "center",
              },
              { value: null }, // Cột 7
              { value: hocKi.SoTinChiKy ?? 0, bold: true, align: "center" }, // Cột 8
              { value: null }, // Cột 9
              { value: null }, // Cột 10
              { value: null }, // Cột 11
              { value: null }, // Cột 12
              { value: null }, // Cột 13
              { value: hocKi.DiemTBKyHe10 ?? 0, bold: true, align: "right" }, // Cột 14
              { value: hocKi.DiemTBKyHe4 ?? 0, bold: true, align: "right" }, // Cột 15
              { value: null }, // Cột 16
              { value: null }, // Cột 17
              { value: null }, // Cột 18
            ],
          }

          return [hocKiRow, ...monHocRows, trungBinhRow]
        })

        const gapRow: TableRow = {
          cells: [{ value: null, colSpan: 18, border: false }],
        }
        const tongtinchi = sampleStudentData.hocKis.reduce(
          (acc: number, curr: IHocKi) => acc + (curr.SoTinChiKy ?? 0),
          0
        )

        const tongDiemNhanTinChiHe10 = sampleStudentData.hocKis.reduce(
          (acc: number, curr: IHocKi) => acc + (curr.DiemTBKyHe10 ?? 0) * (curr.SoTinChiKy ?? 0),
          0
        )
        const tongDiemNhanTinChiHe4 = sampleStudentData.hocKis.reduce(
          (acc: number, curr: IHocKi) => acc + (curr.DiemTBKyHe4 ?? 0) * (curr.SoTinChiKy ?? 0),
          0
        )

        const tongdiemhe10 =
          tongtinchi === 0 ? 0 : Number.parseFloat((tongDiemNhanTinChiHe10 / tongtinchi).toFixed(1))
        const tongdiemhe4 =
          tongtinchi === 0 ? 0 : Number.parseFloat((tongDiemNhanTinChiHe4 / tongtinchi).toFixed(1))
        const totalRow: TableRow = {
          cells: [
            {
              value: `Tổng tín chỉ: ${tongtinchi}`,
              colSpan: 18,
              border: false,
            },
          ],
        }
        const diemTBHe10Row: TableRow = {
          cells: [
            {
              value: `Điểm trung bình hệ 10 toàn khoá: ${tongdiemhe10}`,
              colSpan: 18,
              border: false,
            },
          ],
        }
        const diemTBHe4Row: TableRow = {
          cells: [
            {
              value: `Điểm trung bình hệ 4 toàn khoá: ${tongdiemhe4}`,
              colSpan: 18,
              border: false,
            },
          ],
        }
        const xeploai = convertScore(tongdiemhe10).classification
        const xepLoaiRow: TableRow = {
          cells: [{ value: `Xếp loại: ${xeploai}`, colSpan: 18, border: false }],
        }

        const dateSignatureRow: TableRow = {
          cells: [
            { value: null, colSpan: 12, border: false },
            {
              value: `Hà Nội, ngày ${new Date().getDate()} tháng ${
                new Date().getMonth() + 1
              } năm ${new Date().getFullYear()}`,
              colSpan: 6,
              border: false,
              align: "center",
            },
          ],
        }

        const titleSignatureRow: TableRow = {
          cells: [
            { value: null, colSpan: 12, border: false },
            {
              value: "  KT. TRƯỞNG PHÒNG \n PHÓ TRƯỞNG PHÒNG",
              colSpan: 6,
              border: false,
              align: "center",
              bold: true,
            },
          ],
        }
        const nameSignatureRow: TableRow = {
          cells: [
            { value: null, colSpan: 12, border: false },
            {
              value: "Đại tá, TS Nguyễn Văn Bình												",
              colSpan: 6,
              border: false,
              align: "center",
              bold: true,
            },
          ],
        }
        return {
          sheet: `${sampleStudentData.maSV} - ${sampleStudentData.fullname}`,
          data: {
            fullname: sampleStudentData.fullname,
            dateOfBirth: sampleStudentData.dateOfBirth,
            htdt: sampleStudentData.htdt,
            maSV: sampleStudentData.maSV,
            nganh: sampleStudentData.nganh,
            lop: sampleStudentData.lop,
          },
          tableStartCell: { row: 11, col: 1 },
          rows: [
            ...tableRows,
            gapRow,
            gapRow,
            totalRow,
            diemTBHe10Row,
            diemTBHe4Row,
            xepLoaiRow,
            dateSignatureRow,
            titleSignatureRow,
            nameSignatureRow,
          ],
          hiddenColumns: ["H", "M", "N", "R", "J", "K", "L"],
        }
      })
      exportFromTemplate({
        templateUrl: getMinioUrl("/mta/template/quatrinh.xlsx"),
        sheets: allSheetOptions,
        fileName: "BDCN",
        mergeSheetsToOne: true,
        sheetName: "BDCN",
      })
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }
  const handleExportQuaTrinh = async () => {
    const result: any[] = []
    showSpinner()
    try {
      const tasks = data.map(async (item) => {
        const res = await sqlTransaction([
          {
            model: "Semester",
            operation: "findMany",
            data: {
              where: {
                subjectClasses: {
                  some: {
                    subjectClassStudent: {
                      some: {
                        studentId: item.id,
                      },
                    },
                  },
                },
              },
              include: {
                subjectClasses: {
                  where: {
                    subjectClassStudent: {
                      some: {
                        studentId: item.id,
                      },
                    },
                  },
                  include: {
                    subjectClassStudent: {
                      where: {
                        studentId: item.id,
                      },
                      include: {
                        subjectVersion: {
                          include: {
                            trainingBlocks: {
                              select: { graduation: true },
                              take: 1,
                            },
                          },
                        },
                        certificates: {
                          include: {
                            archivedCertificate: true,
                          },
                        },
                        awards: {
                          where: {
                            status: $Enums.ArchivedCertificateStatus.APPROVED,
                          },
                          include: {
                            archivedAward: true,
                          },
                        },
                      },
                    },
                  },
                },
                trainingCoursesStart: {
                  where: {
                    id: item.fixedClass?.trainingCourseId ?? undefined,
                  },
                  include: {
                    scoreConverts: true,
                  },
                },
                schoolYear: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        ])

        return { item, res }
      })
      const allResults = await Promise.all(tasks)
      for (const { item, res } of allResults) {
        if (res.status === 200) {
          const hocKis: IHocKi[] = []
          if ((res.data[0] as any[]).length) {
            const rawData = res.data[0] as any[]

            // Đổi "item" thành "semester" để tránh nhầm lẫn với "item" (student) bên ngoài
            rawData.forEach((semester) => {
              const monhoc: IMonHoc[] = [] // Khởi tạo mảng môn học cho MỖI HỌC KỲ

              // Vòng lặp này CHỈ DÙNG ĐỂ gom các môn học
              semester.subjectClasses.forEach((subjectClass: any) => {
                subjectClass.subjectClassStudent.forEach((subjectClassStudent: any) => {
                  const rawScore =
                    subjectClassStudent?.manualFinalScore ||
                    Number(subjectClassStudent?.finalScore) ||
                    0

                  const isGraduation =
                    subjectClassStudent.subjectVersion?.trainingBlocks?.[0]?.graduation === true
                  const converted = convertScoreWithGraduation(rawScore, isGraduation)

                  monhoc.push({
                    TenMonhoc: subjectClassStudent.subjectVersion.name,
                    MaMH: subjectClassStudent.subjectVersion.code?.slice(0, 2) ?? "",
                    soTC: subjectClassStudent.subjectVersion.credit,
                    diemhe10: rawScore,
                    diemhe4: converted?.base4 ?? 0,
                    diemchu: converted?.letter ?? "",
                    ghichu: subjectClassStudent.description ?? "",
                  })
                })
              })
              const tongSoTinChi = monhoc.reduce((acc, curr) => acc + (curr.soTC ?? 0), 0)

              const tongDiemNhanTinChiHe10 = monhoc.reduce(
                (acc, curr) => acc + (curr.diemhe10 ?? 0) * (curr.soTC ?? 0),
                0
              )
              const tongDiemNhanTinChiHe4 = monhoc.reduce(
                (acc, curr) => acc + (curr.diemhe4 ?? 0) * (curr.soTC ?? 0),
                0
              )

              const diemTBHe10_Raw = tongSoTinChi === 0 ? 0 : tongDiemNhanTinChiHe10 / tongSoTinChi
              const diemTBHe4_Raw = tongSoTinChi === 0 ? 0 : tongDiemNhanTinChiHe4 / tongSoTinChi

              const diemTBHe10 = Number.parseFloat(diemTBHe10_Raw.toFixed(1))
              const diemTBHe4 = Number.parseFloat(diemTBHe4_Raw.toFixed(1))

              hocKis.push({
                TenHocKi: semester.code + "-" + semester.name + "-" + semester.schoolYear?.name,
                SoTinChiKy: tongSoTinChi,
                DiemTBKyHe10: diemTBHe10,
                DiemTBKyHe4: diemTBHe4,
                monHocs: monhoc,
              })
            })
          }
          const sampleStudentData = {
            fullname: item.userProfile?.fullname,
            dateOfBirth: ((dateInput) => {
              // 1. Kiểm tra nếu không có ngày
              if (!dateInput) {
                return ""
              }
              try {
                // 2. Tạo đối tượng Date
                const date = new Date(dateInput)
                // 3. Kiểm tra nếu ngày không hợp lệ
                if (Number.isNaN(date.getTime())) {
                  return ""
                }
                // 4. Trả về định dạng dd/mm/yyyy
                return date.toLocaleDateString("vi-VN")
              } catch (e) {
                return "" // Trả về rỗng nếu có lỗi
              }
            })(item.userProfile?.dateOfBirth),
            maSV: item.code,
            htdt: item?.fixedClass?.trainingCourse?.trainingObjectType?.name,
            nganh: item.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name,
            lop: item.fixedClass?.name,
            hocKis: hocKis,
          }
          result.push(sampleStudentData)
        }
      }
      const allSheetOptions = result.map((sampleStudentData) => {
        const tableRows = sampleStudentData.hocKis.flatMap((hocKi: IHocKi) => {
          const hocKiRow: TableRow = {
            cells: [
              {
                value: hocKi.TenHocKi ?? "",
                colSpan: 19,
                bold: true,
                align: "left",
                border: true,
              },
            ],
          }
          const monHocRows: TableRow[] =
            hocKi?.monHocs?.map((monHoc: IMonHoc, index: number) => ({
              cells: [
                { value: index + 1 },
                { value: monHoc.TenMonhoc ?? "", colSpan: 6, border: true },
                { value: monHoc.MaMH ?? "" },
                { value: monHoc.soTC, align: "center" },
                { value: monHoc.diem01 ?? 0, align: "right" },
                { value: monHoc.diem02 ?? 0, align: "right" },
                { value: monHoc.diem07 ?? 0, align: "right" },
                {
                  value: ((monHoc.diemhe10 || 0) * (monHoc.soTC || 0)).toFixed(1),
                  align: "right",
                },
                {
                  value: ((monHoc.diemhe4 || 0) * (monHoc.soTC || 0)).toFixed(1),
                  align: "right",
                },
                { value: monHoc.diemhe10 ?? 0, align: "right" },
                { value: monHoc.diemhe4 ?? 0, align: "right" },
                { value: monHoc.diemchu ?? "", align: "center" },
                { value: null },
                { value: monHoc.ghichu ?? "" },
              ],
            })) ?? []

          const trungBinhRow: TableRow = {
            cells: [
              { value: null },
              {
                value: "Điểm trung bình học kỳ:",
                colSpan: 6,
                bold: true,
                align: "center",
              },
              { value: null }, // Cột 7
              { value: hocKi.SoTinChiKy ?? 0, bold: true, align: "center" }, // Cột 8
              { value: null }, // Cột 9
              { value: null }, // Cột 10
              { value: null }, // Cột 11
              { value: null }, // Cột 12
              { value: null }, // Cột 13
              { value: hocKi.DiemTBKyHe10 ?? 0, bold: true, align: "right" }, // Cột 14
              { value: hocKi.DiemTBKyHe4 ?? 0, bold: true, align: "right" }, // Cột 15
              { value: null }, // Cột 16
              { value: null }, // Cột 17
              { value: null }, // Cột 18
            ],
          }

          return [hocKiRow, ...monHocRows, trungBinhRow]
        })

        const gapRow: TableRow = {
          cells: [{ value: null, colSpan: 18, border: false }],
        }
        const tongtinchi = sampleStudentData.hocKis.reduce(
          (acc: number, curr: IHocKi) => acc + (curr.SoTinChiKy ?? 0),
          0
        )

        // Tính điểm trung bình hệ 10 toàn khoá: tổng (điểm TB kỳ × số tín chỉ kỳ) / tổng số tín chỉ
        const tongDiemNhanTinChiHe10 = sampleStudentData.hocKis.reduce(
          (acc: number, curr: IHocKi) => acc + (curr.DiemTBKyHe10 ?? 0) * (curr.SoTinChiKy ?? 0),
          0
        )
        const tongDiemNhanTinChiHe4 = sampleStudentData.hocKis.reduce(
          (acc: number, curr: IHocKi) => acc + (curr.DiemTBKyHe4 ?? 0) * (curr.SoTinChiKy ?? 0),
          0
        )

        const tongdiemhe10 =
          tongtinchi === 0 ? 0 : Number.parseFloat((tongDiemNhanTinChiHe10 / tongtinchi).toFixed(1))
        const tongdiemhe4 =
          tongtinchi === 0 ? 0 : Number.parseFloat((tongDiemNhanTinChiHe4 / tongtinchi).toFixed(1))
        const totalRow: TableRow = {
          cells: [
            {
              value: `Tổng tín chỉ: ${tongtinchi}`,
              colSpan: 18,
              border: false,
            },
          ],
        }
        const diemTBHe10Row: TableRow = {
          cells: [
            {
              value: `Điểm trung bình hệ 10 toàn khoá: ${tongdiemhe10}`,
              colSpan: 18,
              border: false,
            },
          ],
        }
        const diemTBHe4Row: TableRow = {
          cells: [
            {
              value: `Điểm trung bình hệ 4 toàn khoá: ${tongdiemhe4}`,
              colSpan: 18,
              border: false,
            },
          ],
        }
        const xeploai = convertScore(tongdiemhe10).classification
        const xepLoaiRow: TableRow = {
          cells: [{ value: `Xếp loại: ${xeploai}`, colSpan: 18, border: false }],
        }

        const dateSignatureRow: TableRow = {
          cells: [
            { value: null, colSpan: 12, border: false }, // Ô trống bên trái
            {
              value: `Hà Nội, ngày ${new Date().getDate()} tháng ${
                new Date().getMonth() + 1
              } năm ${new Date().getFullYear()}`,
              colSpan: 6,
              border: false,
              align: "center",
            },
          ],
        }

        const titleSignatureRow: TableRow = {
          cells: [
            { value: null, colSpan: 12, border: false },
            {
              value: "  KT. TRƯỞNG PHÒNG \n PHÓ TRƯỞNG PHÒNG",
              colSpan: 6,
              border: false,
              align: "center",
              bold: true,
            },
          ],
        }
        const nameSignatureRow: TableRow = {
          cells: [
            { value: null, colSpan: 12, border: false }, // Ô trống bên trái
            {
              value: "Đại tá, TS Nguyễn Văn Bình												",
              colSpan: 6,
              border: false,
              align: "center",
              bold: true,
            },
          ],
        }
        return {
          sheet: `${sampleStudentData.maSV} - ${sampleStudentData.fullname}`,
          data: {
            fullname: sampleStudentData.fullname,
            dateOfBirth: sampleStudentData.dateOfBirth,
            htdt: sampleStudentData.htdt,
            maSV: sampleStudentData.maSV,
            nganh: sampleStudentData.nganh,
            lop: sampleStudentData.lop,
          },
          tableStartCell: { row: 11, col: 1 },
          rows: [
            ...tableRows,
            gapRow,
            gapRow,
            dateSignatureRow,
            titleSignatureRow,
            nameSignatureRow,
          ],
          hiddenColumns: ["H", "M", "N", "R", "J", "K", "L"],
        }
      })
      exportFromTemplate({
        templateUrl: getMinioUrl("/mta/template/quatrinh.xlsx"),
        sheets: allSheetOptions,
        fileName: "BDQT.xlsx",
        mergeSheetsToOne: true,
        sheetName: "BDQT",
      })
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  // ─── handleExportBangDiem ─────────────────────────────────────────────────────
  // Sửa: dùng convertScoreWithGraduation thay vì convertScore trực tiếp
  // Sửa: gọi convert 1 lần duy nhất trên mỗi điểm thay vì 2-3 lần
  const handleExportBangDiem = async () => {
    const result: any[] = []
    showSpinner()
    try {
      const tasks = data.map(async (item) => {
        const res = await sqlTransaction([
          {
            model: "Semester",
            operation: "findMany",
            data: {
              where: {
                subjectClasses: {
                  some: {
                    subjectClassStudent: {
                      some: {
                        studentId: item.id,
                      },
                    },
                  },
                },
              },
              include: {
                subjectClasses: {
                  where: {
                    subjectClassStudent: {
                      some: {
                        studentId: item.id,
                      },
                    },
                  },
                  include: {
                    subjectClassStudent: {
                      where: {
                        studentId: item.id,
                      },
                      include: {
                        subjectVersion: {
                          include: {
                            trainingBlocks: {
                              select: { graduation: true },
                              take: 1,
                            },
                          },
                        },
                        certificates: {
                          include: {
                            archivedCertificate: true,
                          },
                        },
                        awards: {
                          where: {
                            status: $Enums.ArchivedCertificateStatus.APPROVED,
                          },
                          include: {
                            archivedAward: true,
                          },
                        },
                      },
                    },
                  },
                },
                trainingCoursesStart: {
                  where: {
                    id: item.fixedClass?.trainingCourseId ?? undefined,
                  },
                  include: {
                    scoreConverts: true,
                  },
                },
                schoolYear: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        ])

        return { item, res }
      })
      const allResults = await Promise.all(tasks)
      for (const { item, res } of allResults) {
        if (res.status === 200) {
          const hocKis: IHocKi[] = []
          if ((res.data[0] as any[]).length) {
            const rawData = res.data[0] as any[]

            rawData.forEach((semester) => {
              const monhoc: IMonHoc[] = []
              semester.subjectClasses.forEach((subjectClass: any) => {
                subjectClass.subjectClassStudent.forEach((subjectClassStudent: any) => {
                  const rawScore =
                    subjectClassStudent?.manualFinalScore ||
                    Number(subjectClassStudent?.finalScore) ||
                    0
                  const isGraduation =
                    subjectClassStudent.subjectVersion?.trainingBlocks?.[0]?.graduation === true
                  const converted = convertScoreWithGraduation(rawScore, isGraduation)

                  monhoc.push({
                    TenMonhoc: subjectClassStudent.subjectVersion.name,
                    MaMH: subjectClassStudent.subjectVersion.code?.slice(0, 2) ?? "",
                    soTC: subjectClassStudent.subjectVersion.credit,
                    diemhe10: rawScore,
                    diemhe4: converted?.base4 ?? 0,
                    diemchu: converted?.letter ?? "",
                    ghichu: subjectClassStudent.description ?? "",
                  })
                })
              })

              const tongSoTinChi = monhoc.reduce((acc, curr) => acc + (curr.soTC ?? 0), 0)

              const tongDiemNhanTinChiHe10 = monhoc.reduce(
                (acc, curr) => acc + (curr.diemhe10 ?? 0) * (curr.soTC ?? 0),
                0
              )
              const tongDiemNhanTinChiHe4 = monhoc.reduce(
                (acc, curr) => acc + (curr.diemhe4 ?? 0) * (curr.soTC ?? 0),
                0
              )

              const diemTBHe10_Raw = tongSoTinChi === 0 ? 0 : tongDiemNhanTinChiHe10 / tongSoTinChi
              const diemTBHe4_Raw = tongSoTinChi === 0 ? 0 : tongDiemNhanTinChiHe4 / tongSoTinChi

              const diemTBHe10 = Number.parseFloat(diemTBHe10_Raw.toFixed(1))
              const diemTBHe4 = Number.parseFloat(diemTBHe4_Raw.toFixed(1))

              hocKis.push({
                TenHocKi: semester.code + "-" + semester.name + "-" + semester.schoolYear?.name,
                SoTinChiKy: tongSoTinChi,
                DiemTBKyHe10: diemTBHe10,
                DiemTBKyHe4: diemTBHe4,
                monHocs: monhoc,
              })
            })
          }
          const sampleStudentData = {
            fullname: item.userProfile?.fullname,
            dateOfBirth: ((dateInput) => {
              if (!dateInput) {
                return ""
              }
              try {
                const date = new Date(dateInput)
                if (Number.isNaN(date.getTime())) {
                  return ""
                }
                return date.toLocaleDateString("vi-VN")
              } catch (e) {
                return "" // Trả về rỗng nếu có lỗi
              }
            })(item.userProfile?.dateOfBirth),
            maSV: item.code,
            nganh: item.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name,
            soChungChi: "0",
            ngaynhaphoc: item.fixedClass?.trainingCourse?.admissionStartDate,
            thoigian: item.curriculumVersion?.trainingTime?.name,
            khoa: item.fixedClass?.trainingCourse?.name,
            ctdt: item?.fixedClass?.trainingCourse?.trainingObjectType?.name,
            ngonngu: item.curriculumVersion?.trainingLanguage?.name,
            hocKis: hocKis,
          }
          result.push(sampleStudentData)
        }
      }
      let globalCounter = 1
      const allSheetOptions = result.map((sampleStudentData) => {
        const tableRows = sampleStudentData.hocKis.flatMap((hocKi: IHocKi) => {
          const monHocRows: TableRow[] =
            hocKi?.monHocs?.map((monHoc: IMonHoc) => ({
              cells: [
                { value: globalCounter++ },
                { value: monHoc.TenMonhoc ?? "", colSpan: 8, border: true },
                { value: monHoc.soTC, align: "center" },
                { value: monHoc.diemhe10 ?? 0, align: "right" },
              ],
            })) ?? []
          return [...monHocRows]
        })

        const gapRow: TableRow = {
          cells: [{ value: null, colSpan: 18, border: false }],
        }
        const allMonHocs = sampleStudentData.hocKis.flatMap((hocKi: IHocKi) => hocKi.monHocs)

        const { tongDiemCoTrongSo, tongTrongSo } = allMonHocs.reduce(
          (acc: { tongDiemCoTrongSo: number; tongTrongSo: number }, mon: IMonHoc) => {
            const diem = mon.diemhe10 ?? 0
            const tc = mon.soTC ?? 0

            acc.tongDiemCoTrongSo += diem * tc
            acc.tongTrongSo += tc

            return acc
          },
          { tongDiemCoTrongSo: 0, tongTrongSo: 0 } // Giá trị khởi tạo là một object
        )

        // 3. Tính điểm TB (đã sửa lỗi cú pháp)
        const diemTB =
          tongTrongSo > 0 ? Math.round((tongDiemCoTrongSo / tongTrongSo) * 100) / 100 : 0

        let hang = ""
        if (diemTB >= 9.0) {
          hang = "Xuất sắc"
        } else if (diemTB >= 8.0) {
          hang = "Giỏi"
        } else if (diemTB >= 7.0) {
          hang = "Khá"
        } else if (diemTB >= 6.0) {
          hang = "Trung bình"
        } else if (diemTB >= 5.0) {
          hang = "Trung bình yếu"
        } else {
          hang = "Yếu"
        }
        const totalRow: TableRow = {
          cells: [
            {
              value: `Điểm trung bình chung tốt nghiệp: ${diemTB}`,
              border: false,
              colSpan: 7,
              bold: true,
            },
            {
              value: `Hạng tốt nghiệp: ${hang}`,
              border: false,
              colSpan: 10,
              bold: true,
            },
          ],
        }
        const dateSignatureRow: TableRow = {
          cells: [
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            {
              value: `Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
              colSpan: 5,
              border: false,
              align: "center",
            },
          ],
        }
        const titleSignatureRow: TableRow = {
          cells: [
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            {
              value: "TL. GIÁM ĐỐC ",
              colSpan: 5,
              border: false,
              align: "center",
              bold: true,
            },
          ],
        }
        const nameSignatureRow: TableRow = {
          cells: [
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            {
              value: "TRƯỞNG PHÒNG SAU ĐẠI HỌC",
              colSpan: 5,
              border: false,
              align: "center",
              bold: true,
            },
          ],
        }
        return {
          sheet: `${sampleStudentData.maSV} - ${sampleStudentData.fullname}`,
          data: {
            soChungChi: sampleStudentData.soChungChi,
            fullname: sampleStudentData.fullname,
            maSV: sampleStudentData.maSV,
            dateOfBirth: sampleStudentData.dateOfBirth,
            khoa: sampleStudentData.khoa,
            ngaynhaphoc: sampleStudentData.ngaynhaphoc,
            ctdt: sampleStudentData.ctdt,
            nganh: sampleStudentData.nganh,
            thoigian: sampleStudentData.thoigian,
            ngonngu: sampleStudentData.ngonngu,
          },
          tableStartCell: { row: 15, col: 1 },
          rows: [
            ...tableRows,
            gapRow,
            totalRow,
            gapRow,
            dateSignatureRow,
            titleSignatureRow,
            nameSignatureRow,
          ],
        }
      })
      exportFromTemplate({
        templateUrl: getMinioUrl("/mta/template/bang-diem-ngan-dai-han.xlsx"),
        sheets: allSheetOptions,
        fileName: "BangDiemNganHan%2cDaiHan",
        mergeSheetsToOne: true,
      })
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      console.error("Error exporting template:", error)
    } finally {
      hideSpinner()
    }
  }

  return (
    <div>
      <Divider orientation="left" orientationMargin={0}>
        {[
          fixedClass?.trainingCourse?.trainingObjectType?.name,
          fixedClass?.trainingCourse?.name,
          fixedClass?.curriculumVersion?.name,
          fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name,
          fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name,
        ]
          .filter(Boolean)
          .join(" - ")}
      </Divider>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          {/* Row nút thêm */}
          <Row gutter={[16, 0]} align="middle" justify="space-between">
            {/* Chú thích màu cán bộ lớp */}
            <Col flex="auto">
              <Flex gap={24} wrap align="center" className="px-1">
                {canBoRoles.map((r) => (
                  <span key={r.label} className="inline-flex items-center gap-1.5">
                    <span className={cn("inline-block h-4 w-4 shrink-0 rounded", r.className)} />
                    <span className="leading-4">{r.label}</span>
                  </span>
                ))}
              </Flex>
            </Col>

            {/* Hàng chứa các button */}
            <Col flex="none">
              <Flex justify="end" wrap="wrap" gap="8px" className="mt-1">
                <Dropdown
                  menu={{
                    items: [
                      {
                        label: "CTTK dài hạn",
                        key: "CTTK-dai-han",
                        onClick: async () => {
                          const res = await loadFile(
                            getMinioUrl("/lms/templates/chuong-trinh-dao-tao/CTTK-dai-han.docx")
                          )
                          const doc = new Docxtemplater(res, {
                            linebreaks: true,
                            paragraphLoop: true,
                          })
                          await doc.renderAsync({
                            d: dayjs().format("DD"),
                            m: dayjs().format("MM"),
                            y: dayjs().format("YYYY"),
                            TEN_CTDT: fixedClass?.curriculumVersion?.name?.toUpperCase(),
                            KHOA_HOC: fixedClass?.trainingCourse?.name?.toUpperCase(),
                            lop_quan_ly: fixedClass?.name,
                            mon_hoc: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .map((e, index) => ({
                                tt: index + 1,
                                ten_mon: e.subject.name,
                                trong_so: e.subject.credit,
                                so_tiet: e.subject.period,
                                dv_phu_trach: e.subject?.managementOrganization?.sMa ?? "",
                                ghi_chu:
                                  e.trainingBlockOnCurriculumVersion?.trainingBlock?.name?.firstCase() ??
                                  "",
                                ky_1: e.semester === 1 && e.subject.period ? e.subject.period : "",
                                ky_2: e.semester === 2 && e.subject.period ? e.subject.period : "",
                                ky_3: e.semester === 3 && e.subject.period ? e.subject.period : "",
                              })),
                            tong_trong_so: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce((total, curr) => total + (curr.subject.credit || 0), 0),
                            tong_so_tiet: fixedClass?.curriculumVersion?.trainingBlocks
                              ?.flatMap((e) => e.subjects)
                              .reduce((total, curr) => total + (curr.subject.period || 0), 0),
                            tong_ky_1: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce(
                                (total, curr) =>
                                  total + (curr.semester === 1 ? curr.subject.period || 0 : 0),
                                0
                              ),
                            tong_ky_2: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce(
                                (total, curr) =>
                                  total + (curr.semester === 2 ? curr.subject.period || 0 : 0),
                                0
                              ),
                            tong_ky_3: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce(
                                (total, curr) =>
                                  total + (curr.semester === 3 ? curr.subject.period || 0 : 0),
                                0
                              ),
                          })
                          const blob = exportFile(doc.getZip())
                          saveAs(blob, `CTTK-dai-han.${dayjs().format("DDMMYY")}.docx`)
                        },
                      },
                      {
                        label: "CTTK ngắn hạn",
                        key: "CTTK-ngan-han",
                        onClick: async () => {
                          const res = await loadFile(
                            getMinioUrl("/lms/templates/chuong-trinh-dao-tao/CTTK-ngan-han.docx")
                          )
                          const doc = new Docxtemplater(res, {
                            linebreaks: true,
                            paragraphLoop: true,
                          })
                          await doc.renderAsync({
                            d: dayjs().format("DD"),
                            m: dayjs().format("MM"),
                            y: dayjs().format("YYYY"),
                            TEN_CTDT: fixedClass?.curriculumVersion?.name?.toUpperCase(),
                            KHOA_HOC: fixedClass?.trainingCourse?.name?.toUpperCase(),
                            lop_quan_ly: fixedClass?.name,
                            mon_hoc: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .map((e, index) => ({
                                tt: index + 1,
                                ten_mon: e.subject.name,
                                trong_so: e.subject.credit,
                                so_tiet: e.subject.period,
                                dv_phu_trach: e.subject?.managementOrganization?.sMa ?? "",
                                ghi_chu:
                                  e.trainingBlockOnCurriculumVersion?.trainingBlock?.name?.firstCase() ??
                                  "",
                                ky_1: e.semester === 1 && e.subject.period ? e.subject.period : "",
                                ky_2: e.semester === 2 && e.subject.period ? e.subject.period : "",
                              })),
                            tong_trong_so: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce((total, curr) => total + (curr.subject.credit || 0), 0),
                            tong_so_tiet: fixedClass?.curriculumVersion?.trainingBlocks
                              ?.flatMap((e) => e.subjects)
                              .reduce((total, curr) => total + (curr.subject.period || 0), 0),
                            tong_ky_1: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce(
                                (total, curr) =>
                                  total + (curr.semester === 1 ? curr.subject.period || 0 : 0),
                                0
                              ),
                            tong_ky_2: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce(
                                (total, curr) =>
                                  total + (curr.semester === 2 ? curr.subject.period || 0 : 0),
                                0
                              ),
                          })
                          const blob = exportFile(doc.getZip())
                          saveAs(blob, `CTTK-ngan-han.${dayjs().format("DDMMYY")}.docx`)
                        },
                      },
                      {
                        label: "KHTK định hướng nghiên cứu",
                        key: "KHTK-ding-huong-nghien-cuu",
                        onClick: async () => {
                          const res = await loadFile(
                            getMinioUrl(
                              "/lms/templates/chuong-trinh-dao-tao/KHTK-ding-huong-nghien-cuu.docx"
                            )
                          )
                          const doc = new Docxtemplater(res, {
                            linebreaks: true,
                            paragraphLoop: true,
                          })
                          await doc.renderAsync({
                            d: dayjs().format("DD"),
                            m: dayjs().format("MM"),
                            y: dayjs().format("YYYY"),
                            HE: getLabelTrainingObjectType(
                              fixedClass?.trainingCourse.trainingObjectType.type
                            ).toUpperCase(),
                            KHOA_HOC: fixedClass?.trainingCourse?.name?.toUpperCase(),
                            ten_lop: fixedClass?.name,
                            chuyen_nganh:
                              fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ?? "",
                            ma_nganh:
                              fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.code ?? "",
                            quan_so: fixedClass?._count.students ?? 0,
                            mon_hoc: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .map((e, index) => ({
                                tt: index + 1,
                                ten_mon: e.subject.name,
                                trong_so: e.subject.credit,
                                so_tiet: e.subject.period,
                                dv_phu_trach: e.subject?.managementOrganization?.sMa ?? "",
                                ghi_chu:
                                  e.trainingBlockOnCurriculumVersion?.trainingBlock?.name?.firstCase() ??
                                  "",
                                ky_1: e.semester === 1 && e.subject.period ? e.subject.period : "",
                                ky_2: e.semester === 2 && e.subject.period ? e.subject.period : "",
                                ky_3: e.semester === 3 && e.subject.period ? e.subject.period : "",
                                ky_4: e.semester === 4 && e.subject.period ? e.subject.period : "",
                              })),
                            tong_trong_so: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce((total, curr) => total + (curr.subject.credit || 0), 0),
                            tong_so_tiet: fixedClass?.curriculumVersion?.trainingBlocks
                              ?.flatMap((e) => e.subjects)
                              .reduce((total, curr) => total + (curr.subject.period || 0), 0),
                            tong_ky_1: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce(
                                (total, curr) =>
                                  total + (curr.semester === 1 ? curr.subject.period || 0 : 0),
                                0
                              ),
                            tong_ky_2: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce(
                                (total, curr) =>
                                  total + (curr.semester === 2 ? curr.subject.period || 0 : 0),
                                0
                              ),
                            tong_ky_3: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce(
                                (total, curr) =>
                                  total + (curr.semester === 3 ? curr.subject.period || 0 : 0),
                                0
                              ),
                            tong_ky_4: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce(
                                (total, curr) =>
                                  total + (curr.semester === 4 ? curr.subject.period || 0 : 0),
                                0
                              ),
                          })
                          const blob = exportFile(doc.getZip())
                          saveAs(
                            blob,
                            `KHTK-ding-huong-nghien-cuu.${dayjs().format("DDMMYY")}.docx`
                          )
                        },
                      },
                      {
                        label: "KHTK định hướng ứng dụng",
                        key: "KHTK-ding-huong-ung-dung",
                        onClick: async () => {
                          const res = await loadFile(
                            getMinioUrl(
                              "/mta/template/chuong-trinh-dao-tao/KHTK-ding-huong-ung-dung.docx"
                            )
                          )
                          const doc = new Docxtemplater(res, {
                            linebreaks: true,
                            paragraphLoop: true,
                          })
                          await doc.renderAsync({
                            d: dayjs().format("DD"),
                            m: dayjs().format("MM"),
                            y: dayjs().format("YYYY"),
                            HE: getLabelTrainingObjectType(
                              fixedClass?.trainingCourse.trainingObjectType.type
                            ).toUpperCase(),
                            KHOA_HOC: fixedClass?.trainingCourse?.name?.toUpperCase(),
                            ten_lop: fixedClass?.name,
                            chuyen_nganh:
                              fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ?? "",
                            ma_nganh:
                              fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.code ?? "",
                            quan_so: fixedClass?._count.students ?? 0,
                            mon_hoc: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .map((e, index) => ({
                                tt: index + 1,
                                ten_mon: e.subject.name,
                                trong_so: e.subject.credit,
                                so_tiet: e.subject.period,
                                dv_phu_trach: e.subject?.managementOrganization?.sMa ?? "",
                                ghi_chu:
                                  e.trainingBlockOnCurriculumVersion?.trainingBlock?.name?.firstCase() ??
                                  "",
                                ky_1: e.semester === 1 && e.subject.period ? e.subject.period : "",
                                ky_2: e.semester === 2 && e.subject.period ? e.subject.period : "",
                                ky_3: e.semester === 3 && e.subject.period ? e.subject.period : "",
                                ky_4: e.semester === 4 && e.subject.period ? e.subject.period : "",
                              })),
                            tong_trong_so: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce((total, curr) => total + (curr.subject.credit || 0), 0),
                            tong_so_tiet: fixedClass?.curriculumVersion?.trainingBlocks
                              ?.flatMap((e) => e.subjects)
                              .reduce((total, curr) => total + (curr.subject.period || 0), 0),
                            tong_ky_1: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce(
                                (total, curr) =>
                                  total + (curr.semester === 1 ? curr.subject.period || 0 : 0),
                                0
                              ),
                            tong_ky_2: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce(
                                (total, curr) =>
                                  total + (curr.semester === 2 ? curr.subject.period || 0 : 0),
                                0
                              ),
                            tong_ky_3: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce(
                                (total, curr) =>
                                  total + (curr.semester === 3 ? curr.subject.period || 0 : 0),
                                0
                              ),
                            tong_ky_4: fixedClass?.curriculumVersion?.trainingBlocks
                              .flatMap((e) => e.subjects)
                              .reduce(
                                (total, curr) =>
                                  total + (curr.semester === 4 ? curr.subject.period || 0 : 0),
                                0
                              ),
                          })
                          const blob = exportFile(doc.getZip())
                          saveAs(blob, `KHTK-ding-huong-ung-dung.${dayjs().format("DDMMYY")}.docx`)
                        },
                      },
                    ],
                  }}
                >
                  <Button type="primary">Xuất mẫu</Button>
                </Dropdown>
                <Popconfirm
                  title="Xác nhận xóa dữ liệu?"
                  description="Bạn có chắc chắn muốn xoá những sinh viên đã chọn ra khỏi lớp này không?"
                  open={open}
                  onConfirm={handleDeleteMulti}
                  onCancel={handleCancel}
                >
                  <Button
                    disabled={selectedRowKeys?.length <= 0}
                    onClick={showPopconfirm}
                    type="primary"
                  >
                    {selectedRowKeys?.length > 0 && <span>({selectedRowKeys?.length})</span>}
                    Xoá SV khỏi lớp
                  </Button>
                </Popconfirm>
                <ExportStudentInFixedClass
                  data={data}
                  fixedClassName={`${fixedClass?.name}_${fixedClass?.trainingCourse?.name}`}
                />

                <Button onClick={handleModalPrint} type="primary">
                  In danh sách
                </Button>
                <Dropdown
                  menu={{
                    items: [
                      {
                        label: "Bảng điểm quá trình",
                        key: "export-bang-diem-qua-trinh",
                        onClick: async () => await handleExportQuaTrinh(),
                      },
                      {
                        label: "Bảng điểm cá nhân",
                        key: "export-bang-diem-ca-nhan",
                        onClick: async () => await handleExportCaNhan(),
                      },
                      {
                        label: "Bảng điểm ngắn hạn, dài hạn",
                        key: "export-bang-diem-ngan-han-dai-han",
                        onClick: async () => await handleExportBangDiem(),
                      },
                      {
                        label: "Bảng điểm theo lớp, kết quả đào tạo toàn khoá",
                        key: "export-bang-diem-theo-lop-ket-qua-dao-tao-toan-khoa",
                        onClick: async () => await handleExportDiemLop(),
                      },
                    ],
                  }}
                >
                  <Button type="primary" icon={<DownloadOutlined />}>
                    Xuất bảng điểm
                  </Button>
                </Dropdown>

                <Button onClick={() => onOpenGanCanBo({ id: fixedClassId })} type="primary">
                  Cán bộ lớp
                </Button>

                <Tooltip title="Thêm Học viên/Sinh viên">
                  <Button onClick={handleModal} type="primary">
                    Thêm HV/SV
                  </Button>
                </Tooltip>
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            rowKey="id"
            rowClassName={(record: any) => roleByStudentId[record.id] ?? ""}
            rowSelection={{
              selectedRowKeys,
              onChange: (selectedKeys: any) => setSelectedRowKeys(selectedKeys),
            }}
            filters={filters}
            setFilters={setFilters}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Mã SV",
                dataIndex: "code",
                fixed: "left",
                width: 100,
                align: "center",
                type: "input",
              },
              {
                title: "Họ và tên",
                width: 150,
                fixed: "left",
                align: "left",
                type: "input",
                dataIndex: "name",
                render: (__, record) =>
                  record.userProfile
                    ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                    : "",
              },
              {
                title: "Ngày sinh",
                align: "center",
                width: 100,
                dataIndex: "dateOfBirth",
                type: "date",
                render: (__, record) =>
                  record.userProfile?.dateOfBirth
                    ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
                    : "",
              },
              {
                title: "Giới tính",
                align: "center",
                width: 100,
                type: "select",
                dataIndex: "gender",
                options: genderData.map((i) => ({
                  label: i.sTen,
                  value: i.Id,
                })),
                render: (__, record) => record?.userProfile?.gender?.sTen,
              },
              {
                title: "CCCD",
                align: "center",
                width: 100,
                dataIndex: "idCardNumber",
                type: "input",
                render: (__, record) =>
                  record.userProfile?.idCardNumber ? record.userProfile?.idCardNumber : "",
              },
              {
                title: "SĐT",
                align: "center",
                width: 100,
                dataIndex: "phone",
                type: "input",
                render: (__, record) =>
                  record.userProfile?.phoneNumber ? record.userProfile?.phoneNumber : "",
              },
              {
                title: "Cấp bậc",
                align: "center",
                width: 120,
                dataIndex: "rank",
                type: "input",
                render: (__, record) => {
                  return record.userProfile?.rank?.sTen
                },
              },
              {
                title: "Ngành",
                width: 150,
                align: "center",
                type: "select",
                dataIndex: "trainingField",
                options: trainingFieldData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record) => {
                  return (
                    record?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name ||
                    record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField
                      ?.name ||
                    ""
                  )
                },
              },
              {
                title: "Chuyên ngành",
                width: 180,
                align: "center",
                type: "select",
                dataIndex: "trainingMajors",
                options: trainingMajorData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record) => {
                  return (
                    record?.curriculumVersion?.curriculum?.trainingMajor?.name ||
                    record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ||
                    ""
                  )
                },
              },
              {
                title: "Chương trình đào tạo",
                width: 250,
                align: "center",
                dataIndex: "curriculumVersion",
                type: "select",
                options: curriculumVersionData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record) => {
                  const curriculum =
                    record.curriculumVersion || record.fixedClass?.curriculumVersion
                  return curriculum ? curriculum.name : ""
                },
              },
              {
                title: "CTĐT song song",
                width: 200,
                align: "center",
                dataIndex: "curriculumVersionParallel",
                type: "select",
                options: curriculumVersionData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record) => {
                  const curriculum = record.curriculumVersionParallel
                  return curriculum ? curriculum.name : ""
                },
              },
              {
                title: "KQHT (TBHK - TBTL)",
                width: 140,
                align: "center",
                dataIndex: "studentSemesterResult",
                render: (__, record) => {
                  return record.studentSemesterResult?.length ? (
                    <TextTruncate
                      arr={record.studentSemesterResult.map(
                        (
                          r: StudentSemesterResult & {
                            semester: Semester
                          }
                        ) => {
                          return {
                            key: r?.id,
                            label: `${r.semester.code}: ${r.gpaBase10} - ${r.cumulativeGpaBase10}`,
                          }
                        }
                      )}
                      key="studentSemesterResult"
                    />
                  ) : (
                    ""
                  )
                },
              },
              {
                title: "Trạng thái",
                align: "center",
                width: 120,
                type: "select",
                dataIndex: "status",
                options: Object.entries(FIXED_CLASS_STUDENT_STATUS).map(([value, item]) => ({
                  label: item.label,
                  value,
                })),
                render: (_, record) => {
                  const statusInfo =
                    FIXED_CLASS_STUDENT_STATUS[
                      record.status as keyof typeof FIXED_CLASS_STUDENT_STATUS
                    ]
                  return statusInfo ? (
                    <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                  ) : (
                    <Tag color="default">Không xác định</Tag>
                  )
                },
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    <Tooltip title="Kết quả học tập">
                      <BookCheckIcon
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(
                            ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_KET_QUA_HOC_TAP_ID.replace(
                              "[id]",
                              id
                            )
                          )
                        }}
                        size={16}
                      />
                    </Tooltip>
                    <Tooltip title="Chuẩn đầu ra">
                      <SafetyCertificateOutlined onClick={() => onOpenStandardOutput(id)} />
                    </Tooltip>
                    <DeleteIcon
                      popConfirm={{
                        onConfirm: () => handleDelete(id),
                      }}
                    />
                  </Row>
                ),
              },
            ]}
            data={data}
            scroll={{ x: "max-content" }}
            pagination={false}
          />
        </Col>
      </Row>
    </div>
  )
}

StudentFixedClassPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Danh mục" },
        {
          title: "Lớp quản lý",
          href: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE,
        },
        { title: "Chi tiết lớp quản lý" },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
