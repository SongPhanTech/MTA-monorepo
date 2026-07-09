import FormItem from "@components/commons/form-item"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import TableCollapse from "@components/commons/tableCollapse"
import { ExportDiplomaAppendix } from "@components/ui/export-button"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { buildOrgTree, formatDateVN } from "@lib/utils"
import type { Semester, Student } from "@workspace/db"
import type {
  CurriculumVersion,
  FixedClass,
  GraduationDecision,
  ScoreConvert,
  StudentSubjectScore,
  SubjectClass,
  SubjectVersion,
  TrainingCourse,
  TrainingLanguage,
  TrainingField,
  TrainingTime,
  TrainingLevel,
  UserProfile,
} from "@workspace/db/client"
import {
  useCountStudent,
  useFindManyDM_DonVi,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindManyThesisSession,
  useFindManyTrainingCourse,
  useFindManyTrainingObjectType,
} from "@workspace/db/hooks"
import {
  exportGraduationRegisterMaster,
  exportPhoiBangCaoHoc,
  exportPhoiBangNganHan,
  exportPhuLucVanBangCaoHoc,
  exportPhuLucVanBangNganHan,
} from "@workspace/libs/api/training"
import { whereOrganization } from "@workspace/libs/constants"
import { exportFromTemplate, TableRow } from "@workspace/libs/template-excel"
import { fuzzyMatch, getMinioUrl } from "@workspace/libs/utils"
import { docxTemplate } from "../../../utils/docx-template"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  notification,
  Radio,
  TreeSelect,
} from "antd"
import { useWatch } from "antd/es/form/Form"
import dayjs, { Dayjs } from "dayjs"
import { saveAs } from "file-saver"
import type React from "react"
import { useEffect, useMemo, useState } from "react"

type TSubjectItem = StudentSubjectScore & {
  subjectVersion: SubjectVersion
  subjectClass:
    | (SubjectClass & {
        semester: Semester
      })
    | null
}

type TTrainingCourse = TrainingCourse & {
  scoreConverts: ScoreConvert[]
  academicRankingConvert?: any[]
  trainingLanguage: TrainingLanguage | null
  trainingObjectType: {
    trainingForm: {
      name: string
    } | null
  } | null
  semesterStart?: Semester | null
}

type TFixedClass = {
  fixedClass: FixedClass & {
    trainingCourse: TTrainingCourse
    curriculumVersion: CurriculumVersion & {
      curriculum: {
        trainingMajor: {
          name: string
          trainingField: TrainingField | null
        }
      }
    }
  }
}

type TUserProfile = {
  userProfile: UserProfile
}

type TGraduationDecision = {
  graduationDecision?:
    | (Pick<GraduationDecision, "diplomaNumber" | "originalDiplomaNumber"> & {
        finalRanking?: {
          classification?: string
        }
      })
    | null
}

type TExportPayload = {
  trainingObjectTypeId: string
  trainingCourseIds?: string[]
  fixedClassIds?: string[]
  thesisSessionIds?: string[]
  managementOrganizationId?: string
  printDate?: string
  signerName?: string
}

type TExportApi = (payload: TExportPayload) => Promise<any>

type TExportConfig = {
  api: TExportApi
  fileName: string
}

export interface ISemesterGroup {
  id: string
  name: string
  subjects: TSubjectItem[]
}

export type TStudentWithSubjects = Student &
  TFixedClass &
  TUserProfile &
  TGraduationDecision & {
    subjectClassStudent: (StudentSubjectScore & {
      subjectVersion: SubjectVersion & {
        trainingBlocks?: Array<{
          semester?: number | null
          trainingBlockOnCurriculumVersion?: {
            curriculumVersionId: string
          } | null
        }>
      }
      subjectClass?: SubjectClass & {
        semester?: Semester
      }
    })[]
    curriculumVersion?: CurriculumVersion & {
      trainingTime?: TrainingTime | null
      trainingLevel?: TrainingLevel | null
    }
  }

export type TStudentWithSemesters = TStudentWithSubjects & {
  semesters: Array<{
    id: string
    name: string
    subjects: Array<{
      id: string
      key: string
      stt: number
      tenHocPhan: string
      soTinChi: number
      thangDiem10: string
      thangDiem4: string
      thangDiemChu: string | null
    }>
  }>
}

const formItemLayout = {
  labelCol: { flex: "0 0 100px" },
  wrapperCol: { flex: "1" },
}

const initialPagination = {
  page: 1,
  pageSize: 10,
}

export type StudentGradeSystemForm = {
  trainingObjectTypeId: string[]
  fixedClassIds: string[]
  thesisSessionIds: string[]
  trainingCourseIds: string[]
  managementOrganizationIds: string[]
  recordsPerPage: string
  date: string
  signer: string
  imageUrl: string
}
const exportHandlers: Record<string, TExportConfig> = {
  soGoc: {
    api: exportGraduationRegisterMaster,
    fileName: "SoGocCapPhatVanBangCaoHoc.xlsx",
  },
  phoiBangCaoHoc: {
    api: exportPhoiBangCaoHoc,
    fileName: "PhoiBangCaoHoc.xlsx",
  },
  phoiBangNganHan: {
    api: exportPhoiBangNganHan,
    fileName: "PhoiBangNganHan.xlsx",
  },
  phuLucVanBangNganHan: {
    api: exportPhuLucVanBangNganHan,
    fileName: "PhuLucVanBangNganHan.docx",
  },
  phuLucVanBangCaoHoc: {
    api: exportPhuLucVanBangCaoHoc,
    fileName: "PhuLucVanBangCaoHoc.docx",
  },
}

export default function StudentGradeSystem() {
  const [form] = Form.useForm<StudentGradeSystemForm>()
  const { showSpinner, hideSpinner } = useSpinner()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const trainingCourseIds: string[] = useWatch("trainingCourseIds", form)
  const fixedClassIds: string[] = useWatch("fixedClassIds", form)
  const thesisSessionIds: string[] = useWatch("thesisSessionIds", form)
  const managementOrganizationIds: string[] = useWatch("managementOrganizationIds", form)
  const signerName: string = useWatch("signer", form)
  const printDate: string = useWatch("date", form)
  const [page, setPage] = useState(initialPagination.page)
  const [pageSize, setPageSize] = useState(initialPagination.pageSize)
  const [viewResult, setViewResult] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<TStudentWithSemesters | null>(null)
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [signRole, setSignRole] = useState<"chief" | "deputy">("deputy")
  const [signingDate, setSigningDate] = useState<Dayjs>(dayjs())
  const { data: trainingObjectTypes = [] } = useFindManyTrainingObjectType({
    where: { active: true },
  })

  const { data: trainingCourseData = [] } = useFindManyTrainingCourse(
    {
      orderBy: {
        semesterStart: {
          startDate: "desc",
        },
      },
      where: {
        active: true,
        deletedAt: null,
        ...(trainingObjectTypeId && {
          trainingObjectTypeId,
        }),
      },
    },
    {
      enabled: !!trainingObjectTypeId || trainingObjectTypes?.length > 0,
    }
  )

  const { data: fixedClasses = [] } = useFindManyFixedClass(
    {
      where: {
        active: true,
        deletedAt: null,
        ...(trainingCourseIds?.length && {
          trainingCourseId: {
            in: trainingCourseIds,
          },
        }),
      },
    },
    {
      enabled: trainingCourseIds?.length > 0,
    }
  )

  const { data: thesisSessionData = [] } = useFindManyThesisSession(
    {
      where: {
        active: true,
        trainingObjectTypeId,
        ...(trainingCourseIds?.length && {
          trainingCourses: {
            some: {
              id: {
                in: trainingCourseIds,
              },
            },
          },
        }),
      },
    },
    {
      enabled: !!trainingObjectTypeId || trainingCourseData?.length > 0,
    }
  )

  const selectedThesisSession = useMemo(() => {
    const selectedSessionId = thesisSessionIds?.[0]
    return thesisSessionData.find((s) => s.id === selectedSessionId)
  }, [thesisSessionIds, thesisSessionData])

  const { data: dm_DonVi = [] } = useFindManyDM_DonVi({
    where: {
      ...whereOrganization,
      ...(fixedClassIds?.length && {
        fixedClass: {
          some: {
            id: {
              in: fixedClassIds,
            },
          },
        },
      }),
    },
  })

  const treeData = buildOrgTree(dm_DonVi)

  const where = {
    active: true,
    fixedClass: {
      ...(fixedClassIds?.length > 0 && {
        id: {
          in: fixedClassIds,
        },
      }),
      ...(trainingCourseIds?.length > 0 && {
        trainingCourseId: {
          in: trainingCourseIds,
        },
      }),
      ...(managementOrganizationIds?.length > 0 && {
        managementOrganizationId: {
          in: managementOrganizationIds,
        },
      }),
    },
  }

  const { data: count } = useCountStudent(
    {
      where: { ...where },
    },
    {
      enabled: viewResult,
    }
  )

  const {
    data: students,
    isLoading: isLoadingStudents,
    isFetching: isFetchingStudents,
  } = useFindManyStudent(
    {
      where: { ...where },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        userProfile: {
          include: {
            gender: true,
            ethnicity: true,
            nationality: true,
          },
        },
        graduationDecision: {
          include: {
            finalRanking: true,
          },
        },
        thesisRegistrations: {
          include: {
            council: true,
            thesisProject: {
              include: {
                defenseRecord: true,
              },
            },
          },
        },
        fixedClass: {
          include: {
            managementOrganization: true,
            trainingCourse: {
              include: {
                scoreConverts: true,
                academicRankingConvert: true,
                trainingLanguage: true,
                trainingObjectType: {
                  include: {
                    trainingForm: true,
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
              },
            },
          },
        },
        subjectClassStudent: {
          include: {
            subjectVersion: {
              include: {
                trainingBlocks: {
                  include: {
                    trainingBlockOnCurriculumVersion: {
                      select: {
                        curriculumVersionId: true,
                      },
                    },
                  },
                },
              },
            },
            subjectClass: {
              include: {
                semester: true,
              },
            },
          },
        },
        curriculumVersion: {
          include: {
            trainingTime: true,
            trainingLevel: true,
          },
        },
      },
    },
    {
      enabled: viewResult,
    }
  )

  const studentsWithSemesters = useMemo(() => {
    return (students || []).map((student) => {
      const { scoreConverts } = student?.fixedClass?.trainingCourse || {}
      const curriculumVersionId =
        student?.fixedClass?.curriculumVersion?.id || student?.curriculumVersion?.id

      const sortedSubjectClassStudent = [...(student.subjectClassStudent || [])].sort((a, b) => {
        const getPlannedSemester = (item: (typeof student.subjectClassStudent)[number]) => {
          const matchedTrainingBlock = item?.subjectVersion?.trainingBlocks?.find(
            (trainingBlock) =>
              trainingBlock?.trainingBlockOnCurriculumVersion?.curriculumVersionId ===
              curriculumVersionId
          )

          return matchedTrainingBlock?.semester ?? Number.MAX_SAFE_INTEGER
        }

        const plannedSemesterA = getPlannedSemester(a)
        const plannedSemesterB = getPlannedSemester(b)

        if (plannedSemesterA !== plannedSemesterB) {
          return plannedSemesterA - plannedSemesterB
        }

        const semesterNameA = a?.subjectClass?.semester?.name || ""
        const semesterNameB = b?.subjectClass?.semester?.name || ""
        const semesterCompare = semesterNameA.localeCompare(semesterNameB, "vi")
        if (semesterCompare !== 0) {
          return semesterCompare
        }

        return (a?.subjectVersion?.name || "").localeCompare(b?.subjectVersion?.name || "", "vi")
      })

      const semesterMap = new Map()

      sortedSubjectClassStudent.forEach((item) => {
        const semester = item.subjectClass?.semester
        if (!semester) return

        if (!semesterMap.has(semester.id)) {
          semesterMap.set(semester.id, {
            id: semester.id,
            name: semester.name,
            subjects: [],
          })
        }
        const semesterGroup = semesterMap.get(semester.id)

        const scoreConvert = scoreConverts?.find(
          (s) => s.base10Min <= Number(item.finalScore) && s.base10Max >= Number(item.finalScore)
        )

        semesterGroup.subjects.push({
          id: item.id,
          key: item.id,
          stt: semesterGroup.subjects.length + 1,
          tenHocPhan: item.subjectVersion?.name || "",
          soTinChi: item.subjectVersion?.credit || "",
          thangDiem10: item?.finalScore ? Number(item?.finalScore).toFixed(2) : "-",
          thangDiem4: scoreConvert?.base4 || "",
          thangDiemChu: scoreConvert?.letter,
        })
      })

      return {
        ...student,
        semesters: Array.from(semesterMap.values()),
      }
    }) as TStudentWithSemesters[]
  }, [students])

  const studentTableData = useMemo(() => {
    return (studentsWithSemesters || []).map((student, index) => ({
      key: student.id,
      stt: (page - 1) * pageSize + index + 1,
      maSinhVien: student.code,
      hoTen: student.userProfile?.fullname || "",
      lop: student.fixedClass?.name || "",
      khoa: student.fixedClass?.trainingCourse?.name || "",
      semesters: student.semesters,
    }))
  }, [studentsWithSemesters, page, pageSize])

  const selectedStudentGradeData = useMemo(() => {
    if (!selectedStudent) return []

    return (selectedStudent.semesters || []).map((semester) => ({
      id: semester.id,
      key: semester.id,
      tenHocPhan: semester.name,
      $type: "parent" as const,
      subjects: semester.subjects.map((subject, index) => ({
        ...subject,
        stt: index + 1,
        $type: "child" as const,
      })),
    }))
  }, [selectedStudent])

  const getScoreClassification = (finalScore: number, scoreConverts: ScoreConvert[] = []) => {
    const matched = scoreConverts.find(
      (range) => finalScore >= range.base10Min && finalScore <= range.base10Max
    )

    return matched?.classification ?? ""
  }

  const getGraduationClassification = (
    finalScoreBase10: number,
    finalScoreBase4: number,
    academicRankingConvert: any[] = []
  ) => {
    const graduationRankingData = academicRankingConvert.filter(
      (item) => item?.context === "GRADUATION" && item?.graduated
    )

    if (!graduationRankingData.length) return ""

    const graduationBaseScore =
      graduationRankingData.find((item) => item?.base4Min != null)?.baseScore ??
      graduationRankingData[0]?.baseScore

    const matched = graduationRankingData.find((range) => {
      if (graduationBaseScore === "Base4") {
        return finalScoreBase4 >= range.base4Min && finalScoreBase4 <= range.base4Max
      }
      return finalScoreBase10 >= range.base10Min && finalScoreBase10 <= range.base10Max
    })

    return matched?.classification ?? ""
  }

  const buildScoreSystemNoteRows = (scoreConverts: ScoreConvert[] = [], totalColumns: number) => {
    const sortedData = [...scoreConverts].sort((a, b) => b.base4 - a.base4)

    const labelColSpan = 2
    const valueColumnCount = Math.max(totalColumns - labelColSpan, 1)

    const toBase10Range = (item: ScoreConvert) =>
      item.base10Min === 0
        ? `< ${Number(item.base10Max) + 0.1}`
        : `${item.base10Min}${item.base10Max != null ? ` - ${item.base10Max}` : ""}`

    const buildGridRow = (label: string, values: string[]) => {
      const normalizedValues = values.slice(0, valueColumnCount)
      while (normalizedValues.length < valueColumnCount) {
        normalizedValues.push("")
      }

      return {
        cells: [
          {
            value: label,
            colSpan: labelColSpan,
            fontSize: 10,
            border: false,
          },
          ...normalizedValues.map((value) => ({
            value,
            colSpan: 1,
            align: "center" as const,
            fontSize: 10,
            border: false,
          })),
        ],
      } as TableRow
    }

    const letters = sortedData.map((item) => item.letter ?? "")
    const base4Values = sortedData.map((item) => String(item.base4 ?? ""))
    const base10Values = sortedData.map(toBase10Range)

    return {
      noteRow1: {
        cells: [
          {
            value: "Ghi chú:  - Hệ thống điểm được quy định theo:",
            colSpan: totalColumns,
            fontSize: 10,
            border: false,
          },
        ],
      } as TableRow,
      noteRow2: {
        ...buildGridRow("Thang điểm chữ", letters),
      },
      noteRow3: {
        ...buildGridRow("Thang điểm 4", base4Values),
      },
      noteRow4: {
        ...buildGridRow("Thang điểm 10", base10Values),
      },
    }
  }

  const buildGraduationRankingNote = (academicRankingConvert: any[] = []) => {
    const graduationRankingData = academicRankingConvert.filter(
      (item) => item?.context === "GRADUATION" && item?.graduated
    )

    const graduationBaseScore =
      graduationRankingData.find((item) => item?.base4Min != null)?.baseScore ??
      graduationRankingData[0]?.baseScore

    const formatNumber = (num: number | null | undefined) => {
      if (num == null) return "-"
      if (Number.isInteger(num)) return num.toFixed(1)
      const decimalPart = (num.toString().split(".")[1] || "").length
      if (decimalPart === 1) return num.toFixed(2)
      return num.toString()
    }

    const sortedRankings = graduationRankingData.sort((a, b) =>
      graduationBaseScore === "Base4" ? b.base4Min - a.base4Min : b.base10Min - a.base10Min
    )

    const rankingText = sortedRankings
      .map((item) => {
        const range =
          graduationBaseScore === "Base4"
            ? `${formatNumber(item.base4Min)} - ${formatNumber(item.base4Max)}`
            : `${formatNumber(item.base10Min)} - ${formatNumber(item.base10Max)}`

        return `${item.classification}: ${range}`
      })
      .join("; ")

    if (!rankingText) {
      return " - Phân hạng tốt nghiệp theo thang điểm 10: -"
    }

    return ` - Phân hạng tốt nghiệp theo thang điểm ${graduationBaseScore === "Base4" ? "4" : "10"}: ${rankingText}. (Hạng tốt nghiệp có thể bị hạ mức theo quy chế đào tạo đại học của HVKTQS được áp dụng tại thời điểm xét tốt nghiệp).`
  }

  const handleExportPLVB2Col = () => {
    if (!students?.length) {
      notification.info({ message: "Không có dữ liệu để xuất!" })
      return
    }
    const TOTAL_COLUMNS = 12
    const SIGN_COL = 6
    const MAX_ROWS = 500

    const allSheetOptions = studentsWithSemesters.map((student) => {
      const scoreConverts = student.fixedClass?.trainingCourse?.scoreConverts || []
      const academicRankingConvert =
        student.fixedClass?.trainingCourse?.academicRankingConvert || []
      let stt = 0
      const tableRows = student.semesters
        .flatMap((semester) => {
          const subjectRows: TableRow[] = []

          const subjects = semester?.subjects ?? []
          for (let i = 0; i < subjects.length; i += 2) {
            const s1 = subjects[i]
            const s2 = subjects[i + 1]
            const hasSecondSubject = !!s2
            const sttFirst = stt + 1
            const sttSecond = hasSecondSubject ? stt + 2 : null
            stt += hasSecondSubject ? 2 : 1

            subjectRows.push({
              cells: [
                { value: sttFirst, align: "center" },

                {
                  value: s1?.tenHocPhan ?? "",
                  colSpan: 1,
                  border: true,
                },
                { value: s1?.soTinChi ?? 0, align: "center" },
                { value: Number(s1?.thangDiem10 ?? 0), align: "right" },
                { value: Number(s1?.thangDiem4 ?? 0), align: "right" },
                { value: s1?.thangDiemChu ?? "", align: "center" },

                { value: sttSecond, align: "center" },
                {
                  value: s2?.tenHocPhan ?? "",
                  colSpan: 1,
                  border: true,
                },
                { value: s2?.soTinChi ?? "", align: "center" },
                {
                  value: s2?.thangDiem10 ? Number(s2.thangDiem10) : "",
                  align: "right",
                },
                {
                  value: s2?.thangDiem4 ? Number(s2.thangDiem4) : "",
                  align: "right",
                },
                { value: s2?.thangDiemChu ?? "", align: "center" },
              ],
            })
          }

          return subjectRows
        })
        .slice(0, MAX_ROWS)

      const tongTinChi = student.semesters.reduce(
        (acc, semester) =>
          acc + (semester.subjects?.reduce((s, sub) => s + Number(sub.soTinChi ?? 0), 0) ?? 0),
        0
      )

      const tongDiemNhanTinChiHe10 = student.semesters.reduce(
        (acc, semester) =>
          acc +
          (semester.subjects?.reduce(
            (s, sub) => s + (Number(sub?.thangDiem10) || 0) * Number(sub.soTinChi ?? 0),
            0
          ) ?? 0),
        0
      )

      const tongDiemNhanTinChiHe4 = student.semesters.reduce(
        (acc, semester) =>
          acc +
          (semester.subjects?.reduce(
            (s, sub) => s + (Number(sub?.thangDiem4) || 0) * Number(sub.soTinChi ?? 0),
            0
          ) ?? 0),
        0
      )

      const diemTBHe10 =
        tongTinChi === 0 ? 0 : Number((tongDiemNhanTinChiHe10 / tongTinChi).toFixed(2))

      const diemTBHe4 =
        tongTinChi === 0 ? 0 : Number((tongDiemNhanTinChiHe4 / tongTinChi).toFixed(2))

      const xepLoai =
        student.graduationDecision?.finalRanking?.classification ??
        getGraduationClassification(diemTBHe10, diemTBHe4, academicRankingConvert || [])

      const gapRow: TableRow = {
        cells: [{ value: null, colSpan: TOTAL_COLUMNS, border: false }],
      }

      const tongTinChiRow: TableRow = {
        cells: [
          {
            value: {
              richText: [
                { text: "Tổng số tín chỉ: " },
                { text: String(tongTinChi), font: { bold: true } },
              ],
            },
            colSpan: TOTAL_COLUMNS,
            fontSize: 12,
            border: false,
          },
        ],
      }

      const diemHe10Row: TableRow = {
        cells: [
          {
            value: {
              richText: [
                {
                  text: "Điểm trung bình chung tích lũy toàn khoá (Thang điểm 10): ",
                },
                { text: String(diemTBHe10), font: { bold: true } },
              ],
            },
            colSpan: TOTAL_COLUMNS,
            fontSize: 12,
            border: false,
          },
        ],
      }

      const xepLoaiRow: TableRow = {
        cells: [
          {
            value: {
              richText: [
                { text: "Xếp hạng tốt nghiệp: " },
                { text: xepLoai, font: { bold: true } },
              ],
            },
            colSpan: TOTAL_COLUMNS,
            fontSize: 12,
            border: false,
          },
        ],
      }

      const today = new Date()

      const dateSignatureRow: TableRow = {
        cells: [
          { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL, border: false },
          {
            value: `Hà Nội, ngày ${today.getDate()} tháng ${
              today.getMonth() + 1
            } năm ${today.getFullYear()}`,
            colSpan: SIGN_COL,
            align: "center",
            fontSize: 12,
            italic: true,
            border: false,
          },
        ],
      }

      const titleSignatureRow1: TableRow = {
        cells: [
          { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL, border: false },
          {
            value: "KT. TRƯỞNG PHÒNG",
            colSpan: SIGN_COL,
            align: "center",
            bold: true,
            fontSize: 13,
            border: false,
          },
        ],
      }

      const titleSignatureRow2: TableRow = {
        cells: [
          { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL, border: false },
          {
            value: "PHÓ TRƯỞNG PHÒNG",
            colSpan: SIGN_COL,
            align: "center",
            bold: true,
            fontSize: 13,
            border: false,
          },
        ],
      }

      const nameSignatureRow: TableRow = {
        cells: [
          { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL, border: false },
          {
            value: "Đại tá, TS Nguyễn Văn Bình",
            colSpan: SIGN_COL,
            align: "center",
            bold: true,
            fontSize: 13,
            border: false,
          },
        ],
      }

      const { noteRow1, noteRow2, noteRow3, noteRow4 } = buildScoreSystemNoteRows(
        scoreConverts || [],
        TOTAL_COLUMNS
      )

      const noteRow5: TableRow = {
        cells: [
          {
            value: buildGraduationRankingNote(academicRankingConvert),
            colSpan: TOTAL_COLUMNS,
            fontSize: 10,
            rowSpan: 2,
            border: false,
          },
        ],
      }

      return {
        sheet: `${student.userProfile.code} - ${student.userProfile.fullname}`,
        data: {
          ho_ten: student.userProfile.fullname,
          ma_hoc_vien: student.userProfile.code,
          ngay_sinh: formatDateVN(student.userProfile.dateOfBirth ?? ""),
          ngay_nhap_hoc: formatDateVN(student.fixedClass.createdAt),
          hinh_thuc_dao_tao:
            student.fixedClass?.trainingCourse?.trainingObjectType?.trainingForm?.name || "",
          nganh_hoc:
            student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name ||
            "",
          chuyen_nganh:
            student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "",
          thoi_gian_dao_tao: student.curriculumVersion?.trainingTime?.name || "",
          trinh_do_dao_tao: student.curriculumVersion?.trainingLevel?.name || "",
          ngon_ngu: student.fixedClass?.trainingCourse?.trainingLanguage?.name || "",
          so_ky_hieu: student.fixedClass?.trainingCourse?.code || "",
        },
        tableStartCell: { row: 14, col: 1 },
        rows: [
          ...tableRows,
          gapRow,
          tongTinChiRow,
          diemHe10Row,
          xepLoaiRow,
          gapRow,
          dateSignatureRow,
          titleSignatureRow1,
          titleSignatureRow2,
          ...Array.from({ length: 5 }, () => ({
            cells: [{ value: null, colSpan: TOTAL_COLUMNS, border: false }],
          })),
          nameSignatureRow,
          gapRow,
          noteRow1,
          noteRow2,
          noteRow3,
          noteRow4,
          noteRow5,
        ],
      }
    })

    exportFromTemplate({
      templateUrl: getMinioUrl("/mta/template/phu-luc-van-bang-2-cot.xlsx"),
      sheets: allSheetOptions,
      fileName: "PLVB2C.xlsx",
      fontFamily: "Times New Roman",
      fontSize: 10,
      mergeSheetsToOne: true,
      sheetName: "PLVB",
    })
  }

  const handleExportPLVB1Col = () => {
    if (!students?.length) {
      notification.info({ message: "Không có dữ liệu để xuất!" })
      return
    }
    const TOTAL_COLUMNS = 10
    const SIGN_COL = 6
    const MAX_ROWS = 500

    const allSheetOptions = studentsWithSemesters.map((student) => {
      const scoreConverts = student.fixedClass?.trainingCourse?.scoreConverts || []
      const academicRankingConvert =
        student.fixedClass?.trainingCourse?.academicRankingConvert || []
      let stt = 0
      const tableRows = student.semesters
        .flatMap((semester) => {
          const subjectRows: TableRow[] = []

          const subjects = semester?.subjects ?? []
          for (let i = 0; i < subjects.length; i++) {
            const s1 = subjects[i]
            stt += 1

            subjectRows.push({
              cells: [
                { value: stt - 1, align: "center" },

                {
                  value: s1?.tenHocPhan ?? "",
                  colSpan: 1,
                  border: true,
                  wrapText: true,
                },
                { value: s1?.soTinChi ?? "", colSpan: 2, align: "center" },
                {
                  value: s1?.thangDiem10 ? Number(s1.thangDiem10) : "",
                  colSpan: 2,
                  align: "right",
                },
                {
                  value: s1?.thangDiem4 ? Number(s1.thangDiem4) : "",
                  colSpan: 2,
                  align: "right",
                },
                { value: s1?.thangDiemChu ?? "", colSpan: 2, align: "center" },
              ],
            })
          }

          return subjectRows
        })
        .slice(0, MAX_ROWS)

      const tongTinChi = student.semesters.reduce(
        (acc, semester) =>
          acc + (semester.subjects?.reduce((s, sub) => s + Number(sub.soTinChi ?? 0), 0) ?? 0),
        0
      )

      const tongDiemNhanTinChiHe10 = student.semesters.reduce(
        (acc, semester) =>
          acc +
          (semester.subjects?.reduce(
            (s, sub) => s + (Number(sub?.thangDiem10) || 0) * Number(sub.soTinChi ?? 0),
            0
          ) ?? 0),
        0
      )

      const tongDiemNhanTinChiHe4 = student.semesters.reduce(
        (acc, semester) =>
          acc +
          (semester.subjects?.reduce(
            (s, sub) => s + (Number(sub?.thangDiem4) || 0) * Number(sub.soTinChi ?? 0),
            0
          ) ?? 0),
        0
      )

      const diemTBHe10 =
        tongTinChi === 0 ? 0 : Number((tongDiemNhanTinChiHe10 / tongTinChi).toFixed(2))

      const diemTBHe4 =
        tongTinChi === 0 ? 0 : Number((tongDiemNhanTinChiHe4 / tongTinChi).toFixed(2))

      const xepLoai =
        student.graduationDecision?.finalRanking?.classification ??
        getGraduationClassification(diemTBHe10, diemTBHe4, academicRankingConvert || [])

      const gapRow: TableRow = {
        cells: [{ value: null, colSpan: TOTAL_COLUMNS, border: false }],
      }

      const tongTinChiRow: TableRow = {
        cells: [
          {
            value: {
              richText: [
                { text: "Tổng số tín chỉ: " },
                { text: String(tongTinChi), font: { bold: true } },
              ],
            },
            colSpan: TOTAL_COLUMNS,
            fontSize: 12,
            border: false,
          },
        ],
      }

      const diemHe10Row: TableRow = {
        cells: [
          {
            // value: `Điểm TB hệ 10: ${diemTBHe10}`,
            value: {
              richText: [
                {
                  text: "Điểm trung bình chung tích lũy toàn khoá (Thang điểm 10): ",
                },
                { text: String(diemTBHe10), font: { bold: true } },
              ],
            },
            colSpan: TOTAL_COLUMNS,
            fontSize: 12,
            border: false,
          },
        ],
      }

      const xepLoaiRow: TableRow = {
        cells: [
          {
            value: {
              richText: [
                { text: "Xếp hạng tốt nghiệp: " },
                { text: xepLoai, font: { bold: true } },
              ],
            },
            colSpan: TOTAL_COLUMNS,
            fontSize: 12,
            border: false,
          },
        ],
      }

      const today = new Date()

      const dateSignatureRow: TableRow = {
        cells: [
          { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL, border: false }, // 7
          {
            value: `Hà Nội, ngày ${today.getDate()} tháng ${
              today.getMonth() + 1
            } năm ${today.getFullYear()}`,
            colSpan: SIGN_COL,
            align: "center",
            italic: true,
            fontSize: 12,
            border: false,
          },
        ],
      }

      const titleSignatureRow1: TableRow = {
        cells: [
          { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL, border: false },
          {
            value: "KT. TRƯỞNG PHÒNG",
            colSpan: SIGN_COL,
            align: "center",
            bold: true,
            fontSize: 13,
            border: false,
          },
        ],
      }

      const titleSignatureRow2: TableRow = {
        cells: [
          { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL, border: false },
          {
            value: "PHÓ TRƯỞNG PHÒNG",
            colSpan: SIGN_COL,
            align: "center",
            bold: true,
            fontSize: 13,
            border: false,
          },
        ],
      }

      const nameSignatureRow: TableRow = {
        cells: [
          { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL, border: false },
          {
            value: "Đại tá, TS Nguyễn Văn Bình",
            colSpan: SIGN_COL,
            align: "center",
            bold: true,
            fontSize: 13,
            border: false,
          },
        ],
      }

      const { noteRow1, noteRow2, noteRow3, noteRow4 } = buildScoreSystemNoteRows(
        scoreConverts || [],
        TOTAL_COLUMNS
      )

      const noteRow5: TableRow = {
        cells: [
          {
            value: buildGraduationRankingNote(academicRankingConvert),
            colSpan: TOTAL_COLUMNS,
            fontSize: 10,
            rowSpan: 2,
            border: false,
          },
        ],
      }

      return {
        sheet: `${student.userProfile.code} - ${student.userProfile.fullname}`,
        data: {
          ho_ten: student.userProfile.fullname,
          ma_hoc_vien: student.userProfile.code,
          ngay_sinh: formatDateVN(student.userProfile.dateOfBirth ?? ""),
          ngay_nhap_hoc: formatDateVN(student.fixedClass.createdAt),
          hinh_thuc_dao_tao:
            student.fixedClass?.trainingCourse?.trainingObjectType?.trainingForm?.name || "",
          ngon_ngu_dao_tao: student.fixedClass?.trainingCourse?.trainingLanguage?.name || "",
          nganh_hoc:
            student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name ||
            "",
          chuyen_nganh:
            student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "",
          thoi_gian_dao_tao: student.curriculumVersion?.trainingTime?.name || "",
          trinh_do_dao_tao: student.curriculumVersion?.trainingLevel?.name || "",
          ngon_ngu: student.fixedClass?.trainingCourse?.trainingLanguage?.name || "",
          so_ky_hieu: student.fixedClass?.trainingCourse?.code || "",
        },
        tableStartCell: { row: 14, col: 1 },
        rows: [
          ...tableRows,
          gapRow,
          tongTinChiRow,
          diemHe10Row,
          xepLoaiRow,
          gapRow,
          dateSignatureRow,
          titleSignatureRow1,
          titleSignatureRow2,
          ...Array.from({ length: 5 }, () => ({
            cells: [{ value: null, colSpan: TOTAL_COLUMNS, border: false }],
          })),
          nameSignatureRow,
          gapRow,
          noteRow1,
          noteRow2,
          noteRow3,
          noteRow4,
          noteRow5,
        ],
      }
    })

    exportFromTemplate({
      templateUrl: getMinioUrl("/mta/template/phu-luc-van-bang-1-cot.xlsx"),
      sheets: allSheetOptions,
      fileName: "PLVB1C.xlsx",
      fontFamily: "Times New Roman",
      fontSize: 10,
      mergeSheetsToOne: true,
      sheetName: "PLVB",
    })
  }

  const handleCommonExport = async (config: TExportConfig) => {
    if (!trainingObjectTypeId) {
      message.warning("Vui lòng chọn loại đối tượng đào tạo")
      return
    }

    const payload: TExportPayload = {
      trainingObjectTypeId,
      trainingCourseIds,
      fixedClassIds,
      thesisSessionIds,
      managementOrganizationId: managementOrganizationIds?.[0],
      printDate,
      signerName: signerName || "",
    }

    try {
      showSpinner()
      const res = await config.api(payload as any)

      if (res.status === 200) {
        saveAs(res.data, config.fileName)
      } else {
        const errorMsg = res.data?.message || "Đã xảy ra lỗi khi xuất file"
        message.error(errorMsg)
      }
    } catch (error: any) {
      message.error(error.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const formatSpecialDate = (date: dayjs.Dayjs | string | Date | null | undefined) => {
    if (!date) return ""
    const d = dayjs(date)
    const day = d.date()
    const month = d.month() + 1
    const year = d.year()

    let monthStr = String(month)
    if (month === 1 || month === 2) {
      monthStr = "0" + month
    }

    return `${day}/${monthStr}/${year}`
  }

  const handleExportQuyetDinhCongNhan = async () => {
    if (!studentsWithSemesters?.length) {
      notification.info({ message: "Không có dữ liệu để xuất!" })
      return
    }

    const selectedSessionId = thesisSessionIds?.[0]
    const session = thesisSessionData.find((s) => s.id === selectedSessionId)
    if (!session) {
      message.warning("Vui lòng chọn đợt xét trước khi xuất file.")
      return
    }

    setSignRole(session.chief?.trim() ? "chief" : "deputy")
    const sidebarDate = form.getFieldValue("date")
    setSigningDate(sidebarDate ? dayjs(sidebarDate) : dayjs())
    setSignModalOpen(true)
  }

  const handleConfirmSignExport = async () => {
    const selectedSessionId = thesisSessionIds?.[0]
    const session = thesisSessionData.find((s) => s.id === selectedSessionId)
    if (!session) return

    const signerNameTS = signRole === "chief" ? session.chief || "" : session.deputy || ""
    if (!signerNameTS.trim()) {
      message.warning(
        `Chưa có họ tên ${signRole === "chief" ? "Trưởng phòng" : "Phó phòng"} sau đại học trong đợt xét.`
      )
      return
    }

    setSignModalOpen(false)
    form.setFieldValue("date", signingDate)
    await doExportQuyetDinhCongNhan(signerNameTS, signingDate)
  }

  const doExportQuyetDinhCongNhan = async (signerNameTS: string, dateTS: Dayjs) => {
    const selectedSessionId = thesisSessionIds?.[0]
    const session = thesisSessionData.find((s) => s.id === selectedSessionId)

    let effectiveSignerName = signerName
    if (!effectiveSignerName && session?.graduationDecisionMaker) {
      effectiveSignerName = session.graduationDecisionMaker
    }

    const parts = (effectiveSignerName || "").split(",").map((s) => s.trim())
    let titlePart = ""
    let rankPart = ""
    let namePart = ""

    if (parts.length >= 3) {
      titlePart = parts[0]
      rankPart = parts[1]
      namePart = parts[2]
    } else if (parts.length === 2) {
      titlePart = parts[0]
      namePart = parts[1]
    } else {
      const match = (effectiveSignerName || "").match(/^(PGD|GD|GĐ|Phó Giám đốc|Giám đốc)\s+(.*)$/i)
      if (match) {
        titlePart = match[1]
        namePart = match[2]
      } else {
        titlePart = effectiveSignerName?.includes(" ") ? "" : effectiveSignerName || ""
        namePart = effectiveSignerName?.includes(" ") ? effectiveSignerName || "" : ""
      }
    }

    const rawTitle = titlePart.toUpperCase()
    let signerTitle = "GIÁM ĐỐC"
    let signerSubTitle = ""

    if (rawTitle === "PGD" || rawTitle === "PHÓ GIÁM ĐỐC") {
      signerTitle = "KT. GIÁM ĐỐC"
      signerSubTitle = "PHÓ GIÁM ĐỐC"
    } else if (rawTitle === "GD" || rawTitle === "GĐ" || rawTitle === "GIÁM ĐỐC") {
      signerTitle = "GIÁM ĐỐC"
      signerSubTitle = ""
    } else if (rawTitle) {
      signerTitle = rawTitle
    }

    const signerRankName = [rankPart, namePart].filter(Boolean).join(" ")

    const dateQD = session?.graduationDecisionDate ? dayjs(session.graduationDecisionDate) : dayjs()
    const ngayQD = String(dateQD.date())
    const thangQD = String(dateQD.month() + 1)
    const namQD = String(dateQD.year())

    const ngayTS = String(dateTS.date())
    const thangTS = String(dateTS.month() + 1)
    const namTS = String(dateTS.year())

    let soToTrinh = session?.graduationReport || ""
    let ngayToTrinh = ""
    if (soToTrinh.toLowerCase().includes(" ngày ")) {
      const reportParts = soToTrinh.split(/ ngày /i)
      soToTrinh = reportParts[0].trim()
      ngayToTrinh = reportParts[1].trim()
    }

    const items = studentsWithSemesters.map((student) => {
      const course = student.fixedClass?.trainingCourse
      let nienKhoaStr = ""
      if (course?.academicYear) {
        nienKhoaStr = `(${course.academicYear})`
      } else if (course?.startYear) {
        nienKhoaStr = `(${course.startYear}${course.endYear ? ` - ${course.endYear}` : ""})`
      }

      return {
        hoTen: student.userProfile.fullname,
        ngaySinh: formatSpecialDate(student.userProfile.dateOfBirth ?? ""),
        chuyenNganh: student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ?? "",
        tenKhoa: course ? `${course.name} ${nienKhoaStr}`.trim() : "",
        soVanBang:
          student.graduationDecision?.originalDiplomaNumber ??
          student.graduationDecision?.diplomaNumber ??
          "",
      }
    })

    try {
      showSpinner()
      const res = await docxTemplate({
        fileName: "QuyetDinhCongNhanTotNghiep.docx",
        path: "QuyetDinhCongNhanTotNghiep.docx",
        prefix: "/mta/template",
        data: {
          soQD: session?.graduationNumber || "",
          ngayQD,
          thangQD,
          namQD,
          dot: session?.name || "",
          namHoc: "",
          ngayHop: session?.graduationDecisionDate
            ? formatSpecialDate(session.graduationDecisionDate.toString())
            : "",
          soToTrinh,
          ngayToTrinh,
          signerTitle,
          signerSubTitle,
          signerRankName,
          signerNameTS,
          ngayTS,
          thangTS,
          namTS,
          items,
        },
      })
      if (res && res.status >= 200 && res.status < 300) {
        saveAs(res.data, "QuyetDinhCongNhanTotNghiep.docx")
      } else {
        const errorDetail = res ? `Status: ${res.status}` : "No response"
        message.error(`Xuất file thất bại: ${errorDetail}`)
      }
    } catch (error: unknown) {
      console.error("Lỗi xuất file:", error)
      const msg = error instanceof Error ? error.message : JSON.stringify(error)
      message.error(`Lỗi: ${msg}`)
    } finally {
      hideSpinner()
    }
  }

  const subjects: {
    daiHoc: { id: number; name: string; onClick?: () => void }[]
    nganHan: { id: number; name: string; onClick?: () => Promise<void> }[]
    caoHoc: { id: number; name: string; onClick?: () => Promise<void> }[]
  } = {
    daiHoc: [
      { id: 1, name: "Phụ lục VB (1 cột)", onClick: handleExportPLVB1Col },
      { id: 2, name: "Phụ lục VB (2 cột)", onClick: handleExportPLVB2Col },
      // { id: 3, name: "Phụ lục VB (2 cột - 1 trang)" },
      // { id: 4, name: "Bảng điểm Ngân hạn (P2)" },
    ],
    nganHan: [
      // { id: 5, name: "Bảng điểm ngắn hạn SDH" },
      {
        id: 6,
        name: "In phôi bằng ngắn hạn SĐH",
        onClick: () => handleCommonExport(exportHandlers.phoiBangNganHan),
      },
      {
        id: 7,
        name: "Phụ lục văn bằng ngắn hạn",
        onClick: () => handleCommonExport(exportHandlers.phuLucVanBangNganHan),
      },
      // { id: 7, name: "In phôi bảng ngắn/DÀI hạn SDH (Mỹ)" },
      // { id: 8, name: "In quyết định tốt nghiệp ngắn hạn (ĐẠI HÀN) SDH" },
      // { id: 9, name: "Bảng điểm ĐẠI HÀN SDH (2 cột)" },
      // { id: 10, name: "Bảng điểm ĐẠI HÀN SDH (1 cột)" },
      // { id: 12, name: "Danh sách đề nghị TN - ĐẠI HÀN" },
    ],
    caoHoc: [
      // { id: 14, name: "PL Đề nghị công nhận tốt nghiệp" },
      // { id: 15, name: "Xác nhận thông tin HV làm văn bằng" },
      // { id: 16, name: "PL Quyết định tốt nghiệp CAO HỌC" },
      {
        id: 17,
        name: "Quyết định công nhận tốt nghiệp",
        onClick: handleExportQuyetDinhCongNhan,
      },
      // { id: 18, name: "In PL văn bằng CAO HỌC (2 cột)" },
      // { id: 19, name: "In PL văn bằng CAO HỌC (1 cột)" },
      {
        id: 20,
        name: "In phôi bằng CAO HỌC",
        onClick: () => handleCommonExport(exportHandlers.phoiBangCaoHoc),
      },
      {
        id: 21,
        name: "Sổ gốc cấp phát văn bằng",
        onClick: () => handleCommonExport(exportHandlers.soGoc),
      },
      {
        id: 22,
        name: "Phụ lục văn bằng cao học",
        onClick: () => handleCommonExport(exportHandlers.phuLucVanBangCaoHoc),
      },
      // { id: 22, name: "Thống kê KQ đào tạo" },
      // { id: 23, name: "Thống kê kết quả bảo vệ luận văn" },
      // { id: 24, name: "In Danh sách trình chiếu CAO HỌC" },
      // { id: 25, name: "Trình chiếu tốt nghiệp (WORD)" },
      // { id: 26, name: "Trình chiếu tốt nghiệp (PDF)" },
    ],
  }
  useEffect(() => {
    if (!form) return

    form.resetFields()
    form.setFieldValue("trainingObjectTypeId", trainingObjectTypeId)
  }, [form, trainingObjectTypeId])

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-68 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-base font-bold color text-primary mb-4 p-2 rounded">
            Bảng điểm học viên
          </h2>

          <Form
            form={form}
            onValuesChange={(changed) => {
              if ("trainingCourseIds" in changed) {
                form.setFieldsValue({
                  fixedClassIds: [],
                  managementOrganizationIds: [],
                })
              }

              if ("fixedClassIds" in changed) {
                form.setFieldValue("managementOrganizationIds", [])
              }
            }}
            className="space-y-4"
            initialValues={{ trainingObjectTypeId: trainingObjectTypeId }}
          >
            <div className="flex items-center">
              <FormItem
                form={form}
                name="trainingObjectTypeId"
                labelAlign="left"
                label="ĐTĐT"
                {...formItemLayout}
              >
                <Select
                  className="flex-1 w-64"
                  placeholder="Chọn ĐTĐT"
                  options={trainingObjectTypes?.map((e) => ({
                    label: e.name,
                    value: e.id,
                  }))}
                  disabled
                />
              </FormItem>
            </div>
            <div className="flex items-center">
              <FormItem
                form={form}
                name="trainingCourseIds"
                labelAlign="left"
                label="Khoá"
                {...formItemLayout}
              >
                <Select
                  mode="multiple"
                  className="flex-1 w-64"
                  placeholder="Chọn Khoá"
                  maxTagCount={2}
                  maxTagPlaceholder={(omittedValues) => `+${omittedValues?.length}`}
                  options={trainingCourseData?.map((e) => ({
                    label: e.name,
                    value: e.id,
                  }))}
                  disabled={!trainingObjectTypeId || !trainingObjectTypes.length}
                />
              </FormItem>
            </div>

            <div className="flex items-center">
              <FormItem
                form={form}
                name="fixedClassIds"
                label="Lớp"
                labelAlign="left"
                {...formItemLayout}
              >
                <Select
                  mode="multiple"
                  className="flex-1 w-64"
                  maxTagCount={2}
                  maxTagPlaceholder={(omittedValues) => `+${omittedValues?.length}`}
                  placeholder="Chọn lớp quản lí"
                  options={fixedClasses?.map((e) => ({
                    label: e.name,
                    value: e.id,
                  }))}
                  disabled={!trainingCourseIds?.length}
                />
              </FormItem>
            </div>

            <div className="flex items-center">
              <FormItem
                form={form}
                name="thesisSessionIds"
                label="Đợt xét"
                labelAlign="left"
                {...formItemLayout}
              >
                <Select
                  mode="multiple"
                  className="flex-1 w-64"
                  placeholder="Chọn Đợt xét"
                  maxTagCount={2}
                  maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                  options={thesisSessionData?.map((e) => ({
                    label: e.name,
                    value: e.id,
                  }))}
                  disabled={!trainingCourseIds?.length || !trainingObjectTypeId}
                />
              </FormItem>
            </div>

            <div className="flex items-center">
              <FormItem
                form={form}
                name="managementOrganizationIds"
                label="Khoa quản lý"
                labelAlign="left"
                {...formItemLayout}
              >
                <TreeSelect
                  multiple
                  className="flex-1 w-64"
                  maxTagCount={2}
                  maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                  treeData={treeData}
                  placeholder="Chọn khoa quản lý"
                  allowClear
                  showSearch
                  disabled={!fixedClassIds?.length}
                  treeDefaultExpandAll
                  filterTreeNode={(input, treeNode) =>
                    fuzzyMatch(input, treeNode.label?.toString() || "")
                  }
                />
              </FormItem>
            </div>

            <Button
              type="primary"
              onClick={() => {
                setSelectedStudent(null)
                setViewResult(true)
                setPage(initialPagination.page)
              }}
              className="w-full h-8 text-xs text-white"
            >
              Xem kết quả
            </Button>

            <div className="flex items-center w-full">
              <FormItem
                form={form}
                name="date"
                label="Ngày in"
                labelAlign="left"
                className="w-full"
                {...formItemLayout}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  placeholder={`${dayjs().format("DD/MM/YYYY")}`}
                  className="h-8 text-xs flex-1 w-full"
                />
              </FormItem>
            </div>

            <div className="flex items-center w-full gap-2">
              <FormItem
                form={form}
                name="signer"
                className="w-full"
                label="Người ký"
                labelAlign="left"
                {...formItemLayout}
              >
                <Input
                  type="text"
                  className="h-8 text-xs flex-1 w-full"
                  placeholder="Giám đốc, Trung tướng, GS.TS Lê Minh Thái"
                />
              </FormItem>
            </div>
          </Form>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-sm font-bold color text-primary mb-3">I. Đại học</h3>
          <div className="grid grid-cols-4 gap-3">
            {subjects.daiHoc.map((subject, index) => {
              return (
                <ExportDiplomaAppendix
                  onClick={subject?.onClick}
                  key={subject?.id}
                  title={`${index + 1}. ${subject.name}`}
                  type="primary"
                  className="h-auto px-3 text-xs justify-start text-white"
                />
              )
            })}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold color text-primary mb-3">
            II. Ngắn hạn - Dài hạn sau đại học
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {subjects.nganHan.map((subject, index) => (
              <Button
                key={index}
                onClick={subject?.onClick}
                type="primary"
                className="h-auto py-2 px-3 text-xs justify-start text-white"
              >
                {index + 1}. {subject.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold color text-primary mb-3">III. Cao học</h3>
          <div className="grid grid-cols-4 gap-3">
            {subjects.caoHoc.map((subject, index) => (
              <Button
                key={index}
                onClick={subject?.onClick}
                type="primary"
                className="h-auto py-2 px-3 text-xs justify-start text-white"
              >
                {index + 1}. {subject.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-md font-semibold mb-2">Danh sách sinh viên</h3>
          <Table
            loading={isLoadingStudents || isFetchingStudents}
            columns={[
              {
                title: "STT",
                dataIndex: "stt",
                key: "stt",
                width: 60,
              },
              {
                title: "Mã sinh viên",
                dataIndex: "maSinhVien",
                key: "maSinhVien",
                width: 60,
              },
              {
                title: "Họ tên",
                dataIndex: "hoTen",
                key: "hoTen",
                width: 120,
              },
              {
                title: "Lớp",
                dataIndex: "lop",
                key: "lop",
                width: 150,
              },
              {
                title: "Khoá",
                dataIndex: "khoa",
                key: "khoa",
                width: 100,
              },
            ]}
            data={studentTableData}
            pagination={{
              pageSize,
              total: count,
              onChange(newPage, newPageSize) {
                if (newPageSize !== pageSize) {
                  setPage(initialPagination.page)
                  setPageSize(pageSize)
                  return
                }
                setPage(newPage)
                setPageSize(pageSize)
              },
            }}
            onRow={(record) => ({
              onClick: () => {
                const student = studentsWithSemesters?.find((s) => s.id === record.key)
                setSelectedStudent(student || null)
              },
              className:
                selectedStudent?.id === record.key
                  ? "bg-blue-100 cursor-pointer"
                  : "cursor-pointer",
            })}
            bordered
          />
        </div>

        {selectedStudent && (
          <div>
            <h3 className="text-md font-semibold mb-2">
              Bảng điểm: {selectedStudent.userProfile?.fullname} - {selectedStudent.code}
            </h3>
            <TableCollapse
              data={selectedStudentGradeData}
              columns={[
                {
                  title: "Tên học phần",
                  dataIndex: "tenHocPhan",
                  key: "tenHocPhan",
                },
                {
                  title: "Số tín chỉ",
                  dataIndex: "soTinChi",
                  key: "soTinChi",
                  width: 100,
                },
                {
                  title: "Thang điểm 10",
                  dataIndex: "thangDiem10",
                  key: "thangDiem10",
                  width: 120,
                  render: (value: string) => value || "-",
                },
                {
                  title: "Thang điểm 4",
                  dataIndex: "thangDiem4",
                  key: "thangDiem4",
                  width: 120,
                },
                {
                  title: "Thang điểm chữ",
                  dataIndex: "thangDiemChu",
                  key: "thangDiemChu",
                  width: 120,
                },
              ]}
              headerTitleKey="tenHocPhan"
              childrenFieldName="subjects"
              bordered
              pagination={{
                pageSize: initialPagination.pageSize,
              }}
              rowKey="id"
            />
          </div>
        )}
      </div>

      <Modal
        title="Tham số xuất file"
        open={signModalOpen}
        onCancel={() => setSignModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setSignModalOpen(false)}>
            Hủy
          </Button>,
          <Button key="ok" type="primary" onClick={() => void handleConfirmSignExport()}>
            Xác nhận
          </Button>,
        ]}
        destroyOnClose
        maskClosable={false}
      >
        <p className="mb-3 text-gray-600">
          Đợt xét hiện tại: {selectedThesisSession?.name ?? "—"}.
        </p>
        <Radio.Group
          value={signRole}
          onChange={(e) => setSignRole(e.target.value)}
          className="flex flex-col gap-3"
        >
          <Radio value="chief">
            Trưởng phòng sau đại học:{" "}
            <strong>{selectedThesisSession?.chief?.trim() || "(chưa nhập)"}</strong>
          </Radio>
          <Radio value="deputy">
            Phó phòng sau đại học:{" "}
            <strong>{selectedThesisSession?.deputy?.trim() || "(chưa nhập)"}</strong>
          </Radio>
        </Radio.Group>
        <div className="mt-4">
          <div className="mb-2 text-gray-700">Ngày in</div>
          <DatePicker
            className="w-full h-8"
            format="DD/MM/YYYY"
            value={signingDate}
            onChange={(value) => setSigningDate(value || dayjs())}
            placeholder="Chọn thời gian ký"
          />
        </div>
      </Modal>
    </div>
  )
}

StudentGradeSystem.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
