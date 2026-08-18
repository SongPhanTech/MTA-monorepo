import { DownloadOutlined, SafetyCertificateOutlined } from "@ant-design/icons"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import TableCollapse from "@components/commons/tableCollapse"
import type { FilterProps } from "@constants/type"
import { useScoreConverter } from "@hooks/scoreConverter"
import DefaultLayout from "@layouts/default-layout"
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
  useFindUniqueStudent,
} from "@workspace/db/hooks"
import { exportFromTemplate, type TableRow } from "@workspace/libs/template-excel"
import { getMinioUrl } from "@workspace/libs/utils"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { Button, Col, Divider, Dropdown, Flex, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import _ from "lodash"
import { Check, X } from "lucide-react"
import { useRouter } from "next/router"
import { useCallback, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

dayjs.locale("vi")

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

export default function StudentScoreClassPage() {
  const router = useRouter()
  const { can } = useAbility()
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
        studentYearResult: {
          include: {
            rank: true,
          },
        },
      },
    },
    { enabled: !!studentId }
  )

  const { convertScore } = useScoreConverter(student?.fixedClass?.trainingCourse?.scoreConverts)
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

      const isFailByConfig =
        (attendanceScore != null && scoreToTakeExam != null && attendanceScore < scoreToTakeExam) ||
        (midtermScore != null && scoreToTakeExam != null && midtermScore < scoreToTakeExam) ||
        (examScore != null && examScoreToPass != null && examScore < examScoreToPass)

      const failGraduation = isGraduation && score < scoreToPassGraduation
      const failConditional = isConditional && score < scoreToPassConditional
      const failNormal = !isGraduation && !isConditional && score < scoreToPass

      if (failGraduation || failConditional || failNormal || isFailByConfig) {
        return { base4: 0, letter: "F", pass: false, classification: undefined }
      }
      return convertScore(score)
    },
    [
      convertScore,
      scoreToPassGraduation,
      scoreToPassConditional,
      scoreToPass,
      scoreToTakeExam,
      examScoreToPass,
    ]
  )

  const { data: manualScoreData = [] } = useFindManyStudentSubjectScore(
    {
      where: {
        studentId: studentId,
        manualFinalScore: { gt: 0 },
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
      studentSemesterResult: { where: { studentId } },
      trainingCoursesStart: {
        where: { id: student?.fixedClass?.trainingCourseId ?? undefined },
        include: { scoreConverts: true },
      },
      schoolYear: true,
    },
    orderBy: { startDate: "asc" },
  })

  const dataWithSummary = useMemo(() => {
    return data
      .filter((s) => !semesterId || semesterId === s.id)
      .map((semester) => {
        const result = semester.studentSemesterResult[0]
        if (!result) return semester
        return {
          ...semester,
          subjectClasses: [
            ...semester.subjectClasses,
            {
              id: `summary-${semester.id}`,
              $isSummary: true,
              semesterResult: result,
              subjectClassStudent: [],
            },
          ],
        }
      })
  }, [data, semesterId])

  const exportTemplate = async () => {
    const hocKis: IHocKi[] = []
    if (data.length > 0) {
      data.forEach((item) => {
        const monhoc: IMonHoc[] = []
        item.subjectClasses.forEach((subjectClass) => {
          subjectClass.subjectClassStudent.forEach((subjectClassStudent) => {
            const rawScore =
              subjectClassStudent?.manualFinalScore != null
                ? Number(subjectClassStudent.manualFinalScore)
                : subjectClassStudent?.finalScore != null
                  ? Number(subjectClassStudent.finalScore)
                  : 0

            const isGraduation = subjectClass?.subject?.trainingBlocks?.[0]?.graduation === true
            const isConditional =
              subjectClass?.subject?.trainingBlocks?.[0]?.useForFinalScore === false
            const converted = convertScoreWithGraduation(
              rawScore,
              isGraduation,
              isConditional,
              subjectClassStudent?.attendanceScore != null
                ? Number(subjectClassStudent.attendanceScore)
                : undefined,
              subjectClassStudent?.midtermScore != null
                ? Number(subjectClassStudent.midtermScore)
                : undefined,
              subjectClassStudent?.examScore != null
                ? Number(subjectClassStudent.examScore)
                : undefined
            )

            monhoc.push({
              TenMonhoc: subjectClass.subject.name,
              MaMH: subjectClass.subject.code ?? "",
              soTC: subjectClass.subject.credit,
              diem01:
                subjectClassStudent?.attendanceScore != null
                  ? Number(subjectClassStudent.attendanceScore)
                  : undefined,
              diem02:
                subjectClassStudent?.midtermScore != null
                  ? Number(subjectClassStudent.midtermScore)
                  : undefined,
              diem07:
                subjectClassStudent?.examScore != null
                  ? Number(subjectClassStudent.examScore)
                  : undefined,
              diemhe10: rawScore,
              diemhe4: converted?.base4 ?? 0,
              diemchu: converted?.letter ?? "",
              ghichu: subjectClassStudent.description ?? "",
            })
          })
        })

        const semesterResult = item.studentSemesterResult?.[0]

        const tongSoTinChi =
          semesterResult?.registeredCredits ??
          monhoc.reduce((acc, curr) => acc + (curr.soTC ?? 0), 0)
        const tongDiemNhanTinChiHe10 = monhoc.reduce(
          (acc, curr) => acc + (curr.diemhe10 ?? 0) * (curr.soTC ?? 0),
          0
        )
        const tongDiemNhanTinChiHe4 = monhoc.reduce(
          (acc, curr) => acc + (curr.diemhe4 ?? 0) * (curr.soTC ?? 0),
          0
        )
        const diemTBHe10 =
          semesterResult?.gpaBase10 != null
            ? Number(semesterResult.gpaBase10)
            : Number.parseFloat(
                (tongSoTinChi === 0 ? 0 : tongDiemNhanTinChiHe10 / tongSoTinChi).toFixed(2)
              )
        const diemTBHe4 =
          semesterResult?.gpaBase4 != null
            ? Number(semesterResult.gpaBase4)
            : Number.parseFloat(
                (tongSoTinChi === 0 ? 0 : tongDiemNhanTinChiHe4 / tongSoTinChi).toFixed(2)
              )

        hocKis.push({
          TenHocKi: `${item.name}`,
          SoTinChiKy: tongSoTinChi,
          DiemTBKyHe10: diemTBHe10,
          DiemTBKyHe4: diemTBHe4,
          monHocs: monhoc,
        })
      })
    }

    const sampleStudentData = {
      fullname: student?.userProfile?.fullname,
      dateOfBirth: student?.userProfile?.dateOfBirth,
      maSV: student?.code,
      htdt: student?.fixedClass?.trainingCourse.trainingObjectType.name,
      nganh:
        student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name ||
        student?.fixedClass?.curriculumVersion?.curriculum?.trainingField?.name,
      lop: student?.fixedClass?.trainingCourse?.name,
      hocKis,
    }

    const TABLE_START_ROW = 11
    let cursor = TABLE_START_ROW
    const tableRows: TableRow[] = []

    for (const hocKi of sampleStudentData.hocKis) {
      tableRows.push({
        cells: [
          { value: hocKi.TenHocKi ?? "", colSpan: 19, bold: true, align: "left", border: true },
        ],
      })
      cursor += 1

      const firstMonRow = cursor
      const monHocs = hocKi?.monHocs ?? []
      monHocs.forEach((monHoc: IMonHoc, index: number) => {
        tableRows.push({
          cells: [
            { value: index + 1, align: "center" },
            { value: monHoc.TenMonhoc ?? "", colSpan: 6, border: true },
            { value: monHoc.MaMH ?? "" },
            { value: monHoc.soTC, align: "center" },
            { value: monHoc.diem01 ?? null, align: "right", numFmt: "0.00" },
            { value: monHoc.diem02 ?? null, align: "right", numFmt: "0.00" },
            { value: monHoc.diem07 ?? null, align: "right", numFmt: "0.00" },
            { value: null },
            { value: null },
            { value: monHoc.diemhe10 ?? null, align: "right", numFmt: "0.00" },
            { value: monHoc.diemhe4 ?? null, align: "right", numFmt: "0.00" },
            { value: monHoc.diemchu ?? "", align: "center" },
            { value: null },
            { value: monHoc.ghichu ?? "" },
          ],
        })
        cursor += 1
      })
      const lastMonRow = cursor - 1
      const hasMon = monHocs.length > 0 && lastMonRow >= firstMonRow
      const sumStcFormula = `SUM(I${firstMonRow}:I${lastMonRow})`
      const tbHe10Formula = `IFERROR(SUMPRODUCT(I${firstMonRow}:I${lastMonRow},O${firstMonRow}:O${lastMonRow})/${sumStcFormula},0)`
      const tbHe4Formula = `IFERROR(SUMPRODUCT(I${firstMonRow}:I${lastMonRow},P${firstMonRow}:P${lastMonRow})/${sumStcFormula},0)`

      tableRows.push({
        cells: [
          { value: null },
          { value: "Điểm trung bình học kỳ:", colSpan: 6, bold: true, align: "center" },
          { value: null },
          {
            value: hasMon ? (hocKi.SoTinChiKy ?? 0) : 0,
            bold: true,
            align: "center",
          },
          { value: null },
          { value: null },
          { value: null },
          { value: null },
          { value: null },
          {
            value: hasMon ? (hocKi.DiemTBKyHe10 ?? 0) : 0,
            bold: true,
            align: "right",
            numFmt: "0.00",
          },
          {
            value: hasMon ? (hocKi.DiemTBKyHe4 ?? 0) : 0,
            bold: true,
            align: "right",
            numFmt: "0.00",
          },
          { value: null },
          { value: null },
          { value: null },
        ],
      })
      cursor += 1
    }

    const gapRow: TableRow = { cells: [{ value: null, colSpan: 19, border: false }] }

    const sortedYearResults = student?.studentYearResult
      ? [...student.studentYearResult].sort((a, b) => {
          return (a.schoolYearId || "").localeCompare(b.schoolYearId || "")
        })
      : []

    const lastYearResult = sortedYearResults.length > 0
      ? sortedYearResults[sortedYearResults.length - 1]
      : null

    const tongtinchi =
      lastYearResult?.accumulatedCredits ??
      sampleStudentData.hocKis.reduce((acc, curr) => acc + (curr.SoTinChiKy ?? 0), 0)
    const tongDiemNhanTinChiHe10 = sampleStudentData.hocKis.reduce(
      (acc, curr) => acc + (curr.DiemTBKyHe10 ?? 0) * (curr.SoTinChiKy ?? 0),
      0
    )
    const tongDiemNhanTinChiHe4 = sampleStudentData.hocKis.reduce(
      (acc, curr) => acc + (curr.DiemTBKyHe4 ?? 0) * (curr.SoTinChiKy ?? 0),
      0
    )
    const tongdiemhe10 =
      lastYearResult?.cumulativeGpaBase10 != null
        ? Number(lastYearResult.cumulativeGpaBase10)
        : tongtinchi === 0
          ? 0
          : Number.parseFloat((tongDiemNhanTinChiHe10 / tongtinchi).toFixed(2))
    const tongdiemhe4 =
      lastYearResult?.cumulativeGpaBase4 != null
        ? Number(lastYearResult.cumulativeGpaBase4)
        : tongtinchi === 0
          ? 0
          : Number.parseFloat((tongDiemNhanTinChiHe4 / tongtinchi).toFixed(2))

    const xeploai = lastYearResult?.rank?.classification ?? convertScore(tongdiemhe10).classification

    exportFromTemplate({
      templateUrl: getMinioUrl("/mta/template/BangDiemCaNhan(P2).xlsx"),
      sheets: [
        {
          sheet: "BaoCaoDiem",
          data: {
            fullname: sampleStudentData.fullname ?? "",
            dateOfBirth: sampleStudentData.dateOfBirth
              ? dayjs(sampleStudentData.dateOfBirth).format("DD/MM/YYYY")
              : "",
            htdt: sampleStudentData.htdt ?? "",
            maSV: sampleStudentData.maSV ?? "",
            nganh: sampleStudentData.nganh ?? "",
            lop: sampleStudentData.lop ?? "",
          },
          tableStartCell: { row: 14, col: 1 },
          rows: [
            ...tableRows,
            gapRow,
            gapRow,
            { cells: [{ value: `Tổng tín chỉ tích luỹ: ${tongtinchi}`, colSpan: 19, border: false }] },
            {
              cells: [
                {
                  value: `Điểm trung bình tích luỹ hệ 10 toàn khoá: ${tongdiemhe10}`,
                  colSpan: 19,
                  border: false,
                },
              ],
            },
            {
              cells: [
                {
                  value: `Điểm trung bình tích luỹ hệ 4 toàn khoá: ${tongdiemhe4}`,
                  colSpan: 19,
                  border: false,
                },
              ],
            },
            { cells: [{ value: `Xếp loại: ${xeploai}`, colSpan: 19, border: false }] },
            {
              cells: [
                { value: null, colSpan: 8, border: false },
                {
                  value: `Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
                  colSpan: 11,
                  border: false,
                  align: "center",
                },
              ],
            },
            {
              cells: [
                { value: null, colSpan: 8, border: false },
                {
                  value: "  KT. TRƯỞNG PHÒNG",
                  colSpan: 11,
                  border: false,
                  align: "center",
                  bold: true,
                },
              ],
            },
            {
              cells: [
                { value: null, colSpan: 8, border: false },
                {
                  value: "  PHÓ TRƯỞNG PHÒNG",
                  colSpan: 11,
                  border: false,
                  align: "center",
                  bold: true,
                },
              ],
            },
            {
              cells: [
                { value: null, colSpan: 8, border: false },
                {
                  value: "Đại tá, TS Nguyễn Văn Bình",
                  colSpan: 11,
                  border: false,
                  align: "center",
                  bold: true,
                },
              ],
            },
          ],
          hiddenColumns: ["M", "N", "R", "J", "K", "L"],
        },
      ],
      fileName: `BDCN-${sampleStudentData.maSV}-${sampleStudentData.fullname}.xlsx`,
    })
  }

  const exportTemplateP7 = async () => {
    const hocKis: IHocKi[] = []
    if (data.length > 0) {
      data.forEach((item) => {
        const monhoc: IMonHoc[] = []
        item.subjectClasses.forEach((subjectClass) => {
          subjectClass.subjectClassStudent.forEach((subjectClassStudent) => {
            const rawScore =
              subjectClassStudent?.manualFinalScore != null
                ? Number(subjectClassStudent.manualFinalScore)
                : subjectClassStudent?.finalScore != null
                  ? Number(subjectClassStudent.finalScore)
                  : 0

            const isGraduation = subjectClass?.subject?.trainingBlocks?.[0]?.graduation === true
            const isConditional =
              subjectClass?.subject?.trainingBlocks?.[0]?.useForFinalScore === false
            const converted = convertScoreWithGraduation(
              rawScore,
              isGraduation,
              isConditional,
              subjectClassStudent?.attendanceScore != null
                ? Number(subjectClassStudent.attendanceScore)
                : undefined,
              subjectClassStudent?.midtermScore != null
                ? Number(subjectClassStudent.midtermScore)
                : undefined,
              subjectClassStudent?.examScore != null
                ? Number(subjectClassStudent.examScore)
                : undefined
            )

            monhoc.push({
              TenMonhoc: subjectClass.subject.name,
              MaMH: subjectClass.subject.code ?? "",
              soTC: subjectClass.subject.credit,
              diem01:
                subjectClassStudent?.attendanceScore != null
                  ? Number(subjectClassStudent.attendanceScore)
                  : undefined,
              diem02:
                subjectClassStudent?.midtermScore != null
                  ? Number(subjectClassStudent.midtermScore)
                  : undefined,
              diem07:
                subjectClassStudent?.examScore != null
                  ? Number(subjectClassStudent.examScore)
                  : undefined,
              diemhe10: rawScore,
              diemhe4: converted?.base4 ?? 0,
              diemchu: converted?.letter ?? "",
              ghichu: subjectClassStudent.description ?? "",
            })
          })
        })

        const semesterResult = item.studentSemesterResult?.[0]

        const tongSoTinChi =
          semesterResult?.registeredCredits ??
          monhoc.reduce((acc, curr) => acc + (curr.soTC ?? 0), 0)
        const tongDiemNhanTinChiHe10 = monhoc.reduce(
          (acc, curr) => acc + (curr.diemhe10 ?? 0) * (curr.soTC ?? 0),
          0
        )
        const tongDiemNhanTinChiHe4 = monhoc.reduce(
          (acc, curr) => acc + (curr.diemhe4 ?? 0) * (curr.soTC ?? 0),
          0
        )
        const diemTBHe10 =
          semesterResult?.gpaBase10 != null
            ? Number(semesterResult.gpaBase10)
            : Number.parseFloat(
                (tongSoTinChi === 0 ? 0 : tongDiemNhanTinChiHe10 / tongSoTinChi).toFixed(2)
              )
        const diemTBHe4 =
          semesterResult?.gpaBase4 != null
            ? Number(semesterResult.gpaBase4)
            : Number.parseFloat(
                (tongSoTinChi === 0 ? 0 : tongDiemNhanTinChiHe4 / tongSoTinChi).toFixed(2)
              )

        hocKis.push({
          TenHocKi: `${item.name}`,
          SoTinChiKy: tongSoTinChi,
          DiemTBKyHe10: diemTBHe10,
          DiemTBKyHe4: diemTBHe4,
          monHocs: monhoc,
        })
      })
    }

    const sampleStudentData = {
      fullname: student?.userProfile?.fullname,
      dateOfBirth: student?.userProfile?.dateOfBirth,
      maSV: student?.code,
      htdt: student?.fixedClass?.trainingCourse.trainingObjectType.name,
      nganh:
        student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name ||
        student?.fixedClass?.curriculumVersion?.curriculum?.trainingField?.name,
      lop: student?.fixedClass?.trainingCourse?.name,
      hocKis,
    }

    const TABLE_START_ROW = 11
    let cursor = TABLE_START_ROW
    const tableRows: TableRow[] = []

    for (const hocKi of sampleStudentData.hocKis) {
      tableRows.push({
        cells: [
          { value: hocKi.TenHocKi ?? "", colSpan: 19, bold: true, align: "left", border: true },
        ],
      })
      cursor += 1

      const firstMonRow = cursor
      const monHocs = hocKi?.monHocs ?? []
      monHocs.forEach((monHoc: IMonHoc, index: number) => {
        tableRows.push({
          cells: [
            { value: index + 1, align: "center" },
            { value: monHoc.TenMonhoc ?? "", colSpan: 6, border: true },
            { value: monHoc.MaMH ?? "" },
            { value: monHoc.soTC, align: "center" },
            { value: monHoc.diem01 ?? null, align: "right", numFmt: "0.00" },
            { value: monHoc.diem02 ?? null, align: "right", numFmt: "0.00" },
            { value: monHoc.diem07 ?? null, align: "right", numFmt: "0.00" },
            { value: null },
            { value: null },
            { value: monHoc.diemhe10 ?? null, align: "right", numFmt: "0.00" },
            { value: monHoc.diemhe4 ?? null, align: "right", numFmt: "0.00" },
            { value: monHoc.diemchu ?? "", align: "center" },
            { value: null },
            { value: monHoc.ghichu ?? "" },
          ],
        })
        cursor += 1
      })
      const lastMonRow = cursor - 1
      const hasMon = monHocs.length > 0 && lastMonRow >= firstMonRow
      const sumStcFormula = `SUM(I${firstMonRow}:I${lastMonRow})`
      const tbHe10Formula = `IFERROR(SUMPRODUCT(I${firstMonRow}:I${lastMonRow},O${firstMonRow}:O${lastMonRow})/${sumStcFormula},0)`
      const tbHe4Formula = `IFERROR(SUMPRODUCT(I${firstMonRow}:I${lastMonRow},P${firstMonRow}:P${lastMonRow})/${sumStcFormula},0)`

      tableRows.push({
        cells: [
          { value: null },
          { value: "Điểm trung bình học kỳ:", colSpan: 6, bold: true, align: "center" },
          { value: null },
          {
            value: hasMon ? (hocKi.SoTinChiKy ?? 0) : 0,
            bold: true,
            align: "center",
          },
          { value: null },
          { value: null },
          { value: null },
          { value: null },
          { value: null },
          {
            value: hasMon ? (hocKi.DiemTBKyHe10 ?? 0) : 0,
            bold: true,
            align: "right",
            numFmt: "0.00",
          },
          {
            value: hasMon ? (hocKi.DiemTBKyHe4 ?? 0) : 0,
            bold: true,
            align: "right",
            numFmt: "0.00",
          },
          { value: null },
          { value: null },
          { value: null },
        ],
      })
      cursor += 1
    }

    const gapRow: TableRow = { cells: [{ value: null, colSpan: 19, border: false }] }

    const lastSemesterResult = [...data].reverse().find((d) => d.studentSemesterResult?.length > 0)
      ?.studentSemesterResult?.[0]

    const tongtinchi =
      lastSemesterResult?.accumulatedCredits ??
      sampleStudentData.hocKis.reduce((acc, curr) => acc + (curr.SoTinChiKy ?? 0), 0)
    const tongDiemNhanTinChiHe10 = sampleStudentData.hocKis.reduce(
      (acc, curr) => acc + (curr.DiemTBKyHe10 ?? 0) * (curr.SoTinChiKy ?? 0),
      0
    )
    const tongDiemNhanTinChiHe4 = sampleStudentData.hocKis.reduce(
      (acc, curr) => acc + (curr.DiemTBKyHe4 ?? 0) * (curr.SoTinChiKy ?? 0),
      0
    )
    const tongdiemhe10 =
      lastSemesterResult?.cumulativeGpaBase10 != null
        ? Number(lastSemesterResult.cumulativeGpaBase10)
        : tongtinchi === 0
          ? 0
          : Number.parseFloat((tongDiemNhanTinChiHe10 / tongtinchi).toFixed(2))
    const tongdiemhe4 =
      lastSemesterResult?.cumulativeGpaBase4 != null
        ? Number(lastSemesterResult.cumulativeGpaBase4)
        : tongtinchi === 0
          ? 0
          : Number.parseFloat((tongDiemNhanTinChiHe4 / tongtinchi).toFixed(2))

    const xeploai = convertScore(tongdiemhe10).classification

    exportFromTemplate({
      templateUrl: getMinioUrl("/mta/luan-van/BangDiemCaNhan(P7).xlsx"),
      sheets: [
        {
          sheet: "BaoCaoDiem",
          data: {
            fullname: sampleStudentData.fullname ?? "",
            dateOfBirth: sampleStudentData.dateOfBirth
              ? dayjs(sampleStudentData.dateOfBirth).format("DD/MM/YYYY")
              : "",
            htdt: sampleStudentData.htdt ?? "",
            maSV: sampleStudentData.maSV ?? "",
            nganh: sampleStudentData.nganh ?? "",
            lop: sampleStudentData.lop ?? "",
          },
          tableStartCell: { row: 14, col: 1 },
          rows: [
            ...tableRows,
            gapRow,
            gapRow,
            { cells: [{ value: `Tổng tín chỉ tích luỹ: ${tongtinchi}`, colSpan: 19, border: false }] },
            {
              cells: [
                {
                  value: `Điểm trung bình tích luỹ hệ 10 toàn khoá: ${tongdiemhe10}`,
                  colSpan: 19,
                  border: false,
                },
              ],
            },
            {
              cells: [
                {
                  value: `Điểm trung bình tích luỹ hệ 4 toàn khoá: ${tongdiemhe4}`,
                  colSpan: 19,
                  border: false,
                },
              ],
            },
            { cells: [{ value: `Xếp loại: ${xeploai}`, colSpan: 19, border: false }] },
            {
              cells: [
                { value: null, colSpan: 8, border: false },
                {
                  value: `Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
                  colSpan: 11,
                  border: false,
                  align: "center",
                },
              ],
            },
            // {
            //   cells: [
            //     { value: null, colSpan: 13, border: false },
            //     {
            //       value: "  KT. TRƯỞNG PHÒNG",
            //       colSpan: 6,
            //       border: false,
            //       align: "center",
            //       bold: true,
            //     },
            //   ],
            // },
            // {
            //   cells: [
            //     { value: null, colSpan: 13, border: false },
            //     {
            //       value: "  PHÓ TRƯỞNG PHÒNG",
            //       colSpan: 6,
            //       border: false,
            //       align: "center",
            //       bold: true,
            //     },
            //   ],
            // },
            // {
            //   cells: [
            //     { value: null, colSpan: 13, border: false },
            //     {
            //       value: "Đại tá, TS Nguyễn Văn Bình",
            //       colSpan: 6,
            //       border: false,
            //       align: "center",
            //       bold: true,
            //     },
            //   ],
            // },
          ],
          hiddenColumns: ["M", "N", "R", "J", "K", "L"],
        },
      ],
      fileName: `BDCN-${sampleStudentData.maSV}-${sampleStudentData.fullname}.xlsx`,
    })
  }

  const handleExportQuaTrinh = async () => {
    let stt = 1
    const monhocList: IMonHoc[] = []

    // Thứ tự giống màn hình (học kỳ → tên môn); điểm lấy lần học mới nhất.
    const latestSubjectClassesMap = new Map<string, any>()
    data.forEach((semester) => {
      semester.subjectClasses.forEach((subjectClass: any) => {
        if (subjectClass.$isSummary) return

        const subjectId = subjectClass?.subject?.id
        if (subjectId) {
          latestSubjectClassesMap.set(subjectId, subjectClass)
        }
      })
    })

    const orderedSubjectClasses = Array.from(latestSubjectClassesMap.values())

    orderedSubjectClasses.forEach((subjectClass) => {
      subjectClass.subjectClassStudent.forEach((subjectClassStudent: any) => {
        const rawScore =
          subjectClassStudent?.manualFinalScore != null
            ? Number(subjectClassStudent.manualFinalScore)
            : subjectClassStudent?.finalScore != null
              ? Number(subjectClassStudent.finalScore)
              : null

        const isGraduation = subjectClass?.subject?.trainingBlocks?.[0]?.graduation === true
        const isConditional = subjectClass?.subject?.trainingBlocks?.[0]?.useForFinalScore === false
        const converted = convertScoreWithGraduation(
          rawScore,
          isGraduation,
          isConditional,
          subjectClassStudent?.attendanceScore != null
            ? Number(subjectClassStudent.attendanceScore)
            : undefined,
          subjectClassStudent?.midtermScore != null
            ? Number(subjectClassStudent.midtermScore)
            : undefined,
          subjectClassStudent?.examScore != null ? Number(subjectClassStudent.examScore) : undefined
        )

        let tenMonHoc = subjectClass.subject.name
        if (subjectClass.type === $Enums.SubjectClassType.RETAKE) {
          tenMonHoc += " (Học lại)"
        } else if (subjectClass.type === $Enums.SubjectClassType.REEXAM) {
          tenMonHoc += " (Thi lại)"
        }

        monhocList.push({
          TenMonhoc: tenMonHoc,
          soTC: subjectClass.subject.credit,
          diemhe10: rawScore,
          diemhe4: converted?.base4 ?? null,
          diemchu: converted?.letter ?? null,
          pass: converted?.pass ?? null,
        })
      })
    })

    const sampleStudentData = {
      hoVaTen: student?.userProfile?.fullname,
      ngaySinh: student?.userProfile?.dateOfBirth,
      maSinhVien: student?.code,
      ngayNhapHoc: student?.fixedClass?.trainingCourse.admissionStartDate,
      ngonNguDaoTao: student?.fixedClass?.curriculumVersion?.trainingLanguage?.name,
      thoiGianDaoTao: student?.fixedClass?.curriculumVersion?.trainingTime?.name,
      nganhDaoTao: student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name || student?.fixedClass?.curriculumVersion?.curriculum?.trainingField?.name,
      trinhDoDaoTao: student?.fixedClass?.curriculumVersion?.trainingLevel?.name,
      chuyenNganh:
        student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ??
        student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name,
      hinhThucDaoTao: student?.fixedClass?.curriculumVersion?.trainingType?.name,
    }

    const scoredMonhocs = monhocList.filter(
      (monHoc) => monHoc.diemhe10 != null || monHoc.diemhe4 != null || monHoc.diemchu != null
    )

    const tableRows: TableRow[] = scoredMonhocs.map((monHoc: IMonHoc) => {
      const hasScore = monHoc.diemhe10 != null || monHoc.diemhe4 != null || monHoc.diemchu != null
      const isFail = hasScore && monHoc.pass === false
      const cellStyle = isFail ? { bgColor: "FFFFC7CE", color: "FFFF0000" } : {}
      return {
        cells: [
          { value: stt++, align: "center", ...cellStyle },
          { value: monHoc.TenMonhoc ?? "", colSpan: 6, border: true, ...cellStyle },
          { value: monHoc.soTC, align: "center", ...cellStyle },
          { value: monHoc.diemhe10 ?? null, align: "right", ...cellStyle },
          { value: monHoc.diemhe4 ?? null, align: "right", ...cellStyle },
          { value: monHoc.diemchu ?? null, align: "center", ...cellStyle },
        ],
      }
    })

    const gapRow: TableRow = { cells: [{ value: null, colSpan: 9, border: false }] }

    exportFromTemplate({
      templateUrl: getMinioUrl("/mta/template/BangDiemQuaTrinh.xlsx"),
      sheets: [
        {
          sheet: "BaoCaoDiem",
          data: {
            hoVaTen: sampleStudentData.hoVaTen ?? "",
            ngaySinh: sampleStudentData.ngaySinh
              ? dayjs(sampleStudentData.ngaySinh).format("DD/MM/YYYY")
              : "",
            maSinhVien: sampleStudentData.maSinhVien ?? "",
            ngayNhapHoc: sampleStudentData.ngayNhapHoc
              ? dayjs(sampleStudentData.ngayNhapHoc).format("DD/MM/YYYY")
              : "",
            ngonNguDaoTao: sampleStudentData.ngonNguDaoTao ?? "",
            thoiGianDaoTao: sampleStudentData.thoiGianDaoTao ?? "",
            nganhDaoTao: sampleStudentData.nganhDaoTao ?? "",
            trinhDoDaoTao: sampleStudentData.trinhDoDaoTao ?? "",
            chuyenNganh: sampleStudentData.chuyenNganh ?? "",
            hinhThucDaoTao: sampleStudentData.hinhThucDaoTao ?? "",
          },
          boldDataKeys: ["hoVaTen"],
          tableStartCell: { row: 14, col: 1 },
          rows: [
            ...tableRows,
            gapRow,
            gapRow,
            {
              cells: [
                { value: null, colSpan: 5, border: false },
                {
                  value: `Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
                  colSpan: 6,
                  border: false,
                  align: "center",
                },
              ],
            },
            {
              cells: [
                { value: null, colSpan: 5, border: false },
                {
                  value: "  TL. GIÁM ĐỐC",
                  colSpan: 6,
                  border: false,
                  align: "center",
                  bold: true,
                },
              ],
            },
            {
              cells: [
                { value: null, colSpan: 5, border: false },
                {
                  value: "  KT. TRƯỞNG PHÒNG ĐÀO TẠO",
                  colSpan: 6,
                  border: false,
                  align: "center",
                  bold: true,
                },
              ],
            },
            {
              cells: [
                { value: null, colSpan: 5, border: false },
                {
                  value: "  PHÓ TRƯỞNG PHÒNG",
                  colSpan: 6,
                  border: false,
                  align: "center",
                  bold: true,
                },
              ],
            },
          ],
        },
      ],
      fileName: `BDQT-${sampleStudentData.maSinhVien}-${sampleStudentData.hoVaTen}.xlsx`,
    })
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
            student?.code,
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
                    const { code, name, schoolYear } = semester
                    const r = semester.studentSemesterResult?.[0]
                    return (
                      <div className="flex items-center gap-20">
                        <p className="font-medium text-base">
                          {[code, name, schoolYear?.name].filter(Boolean).join(" - ")}
                        </p>
                        {r && (
                          <span className="font-semibold text-xs text-black-500">
                            TBTL10: {r.cumulativeGpaBase10?.toFixed(2)} | TBTL4:{" "}
                            {r.cumulativeGpaBase4?.toFixed(2)}
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
                          TBHK10: {r.gpaBase10?.toFixed(2)} | TBHK4: {r.gpaBase4?.toFixed(2)}
                        </span>
                      )
                    }
                    return (
                      <Tooltip title={value}>
                        <span className="line-clamp-2">{value}</span>
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
                  render: (_, record) => record?.subjectVersion?.name,
                },
                {
                  title: "Điểm",
                  dataIndex: "manualFinalScore",
                  align: "center",
                  width: 150,
                },
                {
                  title: "Ghi chú",
                  dataIndex: "description",
                  align: "center",
                  width: 250,
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
