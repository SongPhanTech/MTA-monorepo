import { formatDateInSlash, formatNgayThangNamIn } from "@workspace/libs/timezone"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import TableCollapse from "@components/commons/tableCollapse"
import type { FilterProps } from "@constants/type"
import { useScoreConverter } from "@hooks/scoreConverter"
import DefaultLayout from "@layouts/default-layout"
import { useSession } from "@workspace/auth/react"
import {
  $Enums,
  type ArchivedAward,
  type ArchivedCertificate,
  type Prisma,
} from "@workspace/db/client"
import {
  useFindManyArchivedCertificate,
  useFindManySemester,
  useFindManyStudentSemesterResult,
  useFindManyStudentSubjectScore,
  useFindManySubjectVersion,
  useFindManyTrainingBlockSubject,
  useFindUniqueStudent,
  useFindUniqueUserProfile,
} from "@workspace/db/hooks"
import { exportAndDownloadFromTemplate } from "@workspace/libs/download-excel"
import type { TableRow } from "@workspace/libs/template-excel"
import { baoLuuRowProps, isBaoLuuScoreDescription, visibleScoreNote } from "@workspace/libs/bao-luu-diem"
import { courseScoreConfigFrom } from "@workspace/libs/utils"
import { Button, Col, Flex, Row, Tooltip } from "antd"
import dayjs from "dayjs"
import { Check, X } from "lucide-react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

dayjs.locale("vi")
export interface IMonHoc {
  TenMonhoc: string
  MaMH?: string
  soTC?: number
  diem01?: number
  diem02?: number
  diem07?: number
  diemhe10?: number
  diemhe4?: number
  diemchu?: string
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
  const { data: me } = useSession()
  const id = me?.sDM_NhanVienId || ""
  const { data: userProfile } = useFindUniqueUserProfile({
    where: {
      id,
    },
    select: {
      educationAndTraining: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
        },
      },
    },
  })

  const { data: manualScoreData = [] } = useFindManyStudentSubjectScore(
    {
      where: {
        student: {
          userProfileId: id,
        },
        manualFinalScore: {
          gt: 0,
        },
        deletedAt: null,
      },
      include: {
        subjectVersion: true,
      },
    },
    {
      enabled: !!id,
    }
  )

  const { data: archivedCertificates = [] } = useFindManyArchivedCertificate(
    {
      where: {
        student: {
          userProfileId: id,
        },
        status: $Enums.ArchivedCertificateStatus.APPROVED,
        deletedAt: null,
      },
      include: {
        certificate: true,
      },
    },
    {
      enabled: !!id,
    }
  )

  const studentId = userProfile?.educationAndTraining?.[0]?.id

  const [semesterId, setSemesterId] = useState<string>()
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
  })

  const { onOpen } = useDisclosure<{
    dataTable: any
    dataStudent: any
  }>({
    tag: "ModalPrintToKQHT",
  })
  const exportTemplate = async () => {
    const monhocAll: IMonHoc[] = []
    if (displaySemesters.length > 0) {
      displaySemesters.forEach((item) => {
        item.subjectClasses.forEach((subjectClass) => {
          subjectClass.subjectClassStudent.forEach((subjectClassStudent) => {
            monhocAll.push({
              TenMonhoc: subjectClassStudent.subjectVersion.name,
              MaMH: subjectClassStudent.subjectVersion.code?.slice(0, 2) ?? "",
              soTC: subjectClassStudent.subjectVersion.credit,
              diemhe10:
                subjectClassStudent?.manualFinalScore ||
                subjectClassStudent?.finalScore?.toNumber() ||
                0,
              diemhe4:
                convertScore(
                  subjectClassStudent?.manualFinalScore ||
                    subjectClassStudent?.finalScore?.toNumber() ||
                    0,
                  courseScoreConfigFrom(student?.fixedClass?.trainingCourse, subjectClassStudent)
                ).base4 ?? 0,
              diemchu:
                convertScore(
                  subjectClassStudent?.manualFinalScore ??
                    subjectClassStudent?.finalScore?.toNumber() ??
                    0,
                  courseScoreConfigFrom(student?.fixedClass?.trainingCourse, subjectClassStudent)
                ).letter ?? "",

              ghichu: visibleScoreNote(subjectClassStudent.description),
            })
          })
        })
      })
    }

    // Cá nhân: lấy điểm tốt nhất mỗi môn, không chia theo kỳ
    const bestBySubject = new Map<string, IMonHoc>()
    for (const monHoc of monhocAll) {
      const key = `${monHoc.MaMH}|${monHoc.TenMonhoc}`
      const existing = bestBySubject.get(key)
      if (!existing || (monHoc.diemhe10 ?? 0) >= (existing.diemhe10 ?? 0)) {
        bestBySubject.set(key, monHoc)
      }
    }
    const monHocs = [...bestBySubject.values()]

    const sampleStudentData = {
      fullname: student?.userProfile?.fullname,
      dateOfBirth: student?.userProfile?.dateOfBirth,
      maSV: student?.userProfile?.code,
      // TODO: check htdt
      htdt: student?.fixedClass?.trainingCourse.trainingObjectType?.name || "",
      nganh: student?.curriculumVersion?.curriculum.trainingMajor?.name || "",
      lop: student?.fixedClass?.name || "",
    }

    const monHocRows: TableRow[] = monHocs.map((monHoc: IMonHoc, index: number) => ({
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
    }))

    const gapRow: TableRow = {
      cells: [{ value: null, colSpan: 18, border: false }],
    }
    const tongtinchi = monHocs.reduce((acc, curr) => acc + (curr.soTC ?? 0), 0)
    const tongDiemNhanTinChiHe10 = monHocs.reduce(
      (acc, curr) => acc + (curr.diemhe10 ?? 0) * (curr.soTC ?? 0),
      0
    )
    const tongDiemNhanTinChiHe4 = monHocs.reduce(
      (acc, curr) => acc + (curr.diemhe4 ?? 0) * (curr.soTC ?? 0),
      0
    )

    const tongdiemhe10 =
      tongtinchi === 0 ? 0 : Number.parseFloat((tongDiemNhanTinChiHe10 / tongtinchi).toFixed(1))
    const tongdiemhe4 =
      tongtinchi === 0 ? 0 : Number.parseFloat((tongDiemNhanTinChiHe4 / tongtinchi).toFixed(1))
    const totalRow: TableRow = {
      cells: [{ value: `Tổng tín chỉ: ${tongtinchi}`, colSpan: 18, border: false }],
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
          value: `Hà Nội, ${formatNgayThangNamIn(new Date())}`,
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
    await exportAndDownloadFromTemplate({
      templatePath: "/mta/template/quatrinh.xlsx",
      sheets: [
        {
          sheet: "BaoCaoDiem",
          data: {
            fullname: sampleStudentData.fullname ?? "",
            dateOfBirth: sampleStudentData.dateOfBirth
              ? formatDateInSlash(sampleStudentData.dateOfBirth)
              : "",
            htdt: sampleStudentData.htdt ?? "",
            maSV: sampleStudentData.maSV ?? "",
            nganh: sampleStudentData.nganh ?? "",
            lop: sampleStudentData.lop ?? "",
          },
          tableStartCell: { row: 11, col: 1 },
          rows: [
            ...monHocRows,
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
          hiddenColumns: ["M", "N", "R", "J", "K", "L"],
        },
      ],
      fileName: `BDCN-${sampleStudentData.maSV}-${sampleStudentData.fullname}.xlsx`,
    })
  }

  const { data: student } = useFindUniqueStudent(
    {
      where: { id: studentId },
      include: {
        userProfile: true,
        curriculumVersion: {
          include: {
            trainingLevel: true,
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
        fixedClass: {
          include: {
            trainingCourse: {
              include: {
                trainingObjectType: true,
                scoreConverts: true,
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
    {
      enabled: !!studentId,
    }
  )

  const subjectVersionWhere: Prisma.SubjectVersionWhereInput = useMemo(() => {
    return {
      ...(filters.code
        ? {
            code: {
              contains: filters.code,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.name
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.creditCmp
        ? {
            credit: {
              ...(filters.creditCmp.gte
                ? {
                    gte: Number(filters.creditCmp.gte),
                  }
                : {}),
              ...(filters.creditCmp.lte
                ? {
                    lte: Number(filters.creditCmp.lte),
                  }
                : {}),
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
                ? {
                    gte: Number(filters.attendanceScoreCmp.gte),
                  }
                : {}),
              ...(filters.attendanceScoreCmp.lte
                ? {
                    lte: Number(filters.attendanceScoreCmp.lte),
                  }
                : {}),
            },
          }
        : {}),
      ...(filters.midtermScoreCmp
        ? {
            midtermScore: {
              ...(filters.midtermScoreCmp.gte
                ? {
                    gte: Number(filters.midtermScoreCmp.gte),
                  }
                : {}),
              ...(filters.midtermScoreCmp.lte
                ? {
                    lte: Number(filters.midtermScoreCmp.lte),
                  }
                : {}),
            },
          }
        : {}),
      ...(filters.examScoreCmp
        ? {
            examScore: {
              ...(filters.examScoreCmp.gte
                ? {
                    gte: Number(filters.examScoreCmp.gte),
                  }
                : {}),
              ...(filters.examScoreCmp.lte
                ? {
                    lte: Number(filters.examScoreCmp.lte),
                  }
                : {}),
            },
          }
        : {}),
      ...(filters.finalScoreCmp
        ? {
            finalScore: {
              ...(filters.finalScoreCmp.gte
                ? {
                    gte: Number(filters.finalScoreCmp.gte),
                  }
                : {}),
              ...(filters.finalScoreCmp.lte
                ? {
                    lte: Number(filters.finalScoreCmp.lte),
                  }
                : {}),
            },
          }
        : {}),
      subjectVersion: subjectVersionWhere,
    }
  }, [filters, studentId, subjectVersionWhere])

  const { data = [] } = useFindManySemester({
    where: {
      subjectClasses: {
        some: {
          subject: subjectVersionWhere,
          subjectClassStudent: {
            some: subjectScoreWhere,
          },
        },
      },
    },
    include: {
      subjectClasses: {
        where: {
          subjectClassStudent: {
            some: subjectScoreWhere,
          },
        },
        include: {
          subjectClassStudent: {
            where: subjectScoreWhere,
            include: {
              subjectVersion: true,
              certificates: {
                include: {
                  archivedCertificate: true,
                },
              },
              awards: {
                where: {
                  status: "APPROVED",
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
          id: student?.fixedClass?.trainingCourseId ?? undefined,
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
  })

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
  const { data: semesterResults = [] } = useFindManyStudentSemesterResult(
    {
      where: { studentId, deletedAt: null },
      include: { semester: { include: { schoolYear: true } } },
    },
    { enabled: !!studentId }
  )

  const displaySemesters = useMemo(() => {
    const plannedBySubject = new Map<string, number | null>()
    for (const block of plannedSubjects) {
      if (!plannedBySubject.has(block.subjectId) || plannedBySubject.get(block.subjectId) == null) {
        plannedBySubject.set(block.subjectId, block.semester ?? null)
      }
    }
    const semesterByIndex = new Map(semesterResults.map((item) => [item.semesterIndexInCourse, item]))
    const baoLuuBySemester = new Map<string, any[]>()
    const extraSemesters: any[] = []

    for (const score of manualScoreData) {
      if (score.subjectClassId || !isBaoLuuScoreDescription(score.description)) continue
      const planned = plannedBySubject.get(score.subjectVersionId)
      const mapped = planned != null ? semesterByIndex.get(planned) : undefined
      const row = {
        id: `bao-luu-${score.id}`,
        key: `bao-luu-${score.id}`,
        baoLuu: true,
        subjectClassStudent: [
          {
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
            name: mapped.semester.name,
            code: mapped.semester.code,
            schoolYear: mapped.semester.schoolYear,
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
            name: `Học kỳ ${planned}`,
            code: "",
            schoolYear: null,
            subjectClasses: [],
          })
        }
      }
    }

    return [...data, ...extraSemesters].map((semester) => {
      const existingIds = new Set(
        (semester.subjectClasses ?? [])
          .flatMap((item: { subjectClassStudent?: { subjectVersionId?: string }[] }) =>
            (item.subjectClassStudent ?? []).map((score) => score.subjectVersionId)
          )
          .filter(Boolean)
      )
      const baoLuuRows = (baoLuuBySemester.get(semester.id) ?? []).filter(
        (row) => !existingIds.has(row.subjectClassStudent?.[0]?.subjectVersion?.id)
      )
      if (!baoLuuRows.length) return semester
      return {
        ...semester,
        subjectClasses: [...(semester.subjectClasses ?? []), ...baoLuuRows],
      }
    })
  }, [data, manualScoreData, plannedSubjects, semesterResults])

  const { convertScore } = useScoreConverter(
    student?.fixedClass?.trainingCourse.scoreConverts || []
  )

  return (
    <div className="animate-page-enter">
      <Row gutter={[8, 8]}>
        <Col span={24}>
          {/* Row nút thêm */}
          <Row gutter={[8, 8]} align="top" justify="space-between">
            {/* Hàng chứa các button */}
            <Col xs={24} className="w-full">
              <Flex justify="space-between" wrap="wrap" gap="8px" className="mt-1 w-full">
                <Select
                  value={semesterId}
                  onChange={(v) => {
                    setSemesterId(v)
                  }}
                  className="w-64"
                  placeholder="Chọn kỳ học"
                  options={data.map((s) => ({
                    label: `${s.code} - ${s.name} - ${s.schoolYear.name}`,
                    value: s.id,
                  }))}
                />
                <Col className="flex flex-row gap-2.5">
                  <Button
                    type="primary"
                    onClick={() =>
                      onOpen({
                        dataTable: data,
                        dataStudent: student,
                      })
                    }
                  >
                    In kết quả học tập
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      exportTemplate()
                    }}
                  >
                    Xuất bảng điểm cá nhân
                  </Button>
                </Col>
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <TableCollapse
            rowKey="key"
            onRow={(record: any) => baoLuuRowProps(!!record?.baoLuu)}
            header={<div className="text-sm font-semibold uppercase">Kết quả học tập theo kỳ</div>}
            currentPage={1}
            headerTitleKey={({ name, schoolYear }) => (
              <p className="font-medium text-base">
                {[name, schoolYear?.name].filter(Boolean).join(" - ")}
              </p>
            )}
            scrollable
            maxHeight={"calc(100vh - 250px)"}
            headerColumn={[
              {
                colSpan: 1,
              },
              {
                render: (_, { name, schoolYear }) => (
                  <p className="font-bold text-base">
                    {[name, schoolYear?.name].filter(Boolean).join(" - ")}
                  </p>
                ),
                colSpan: 13,
              },
            ]}
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
            }}
            childrenFieldName="subjectClasses"
            defaultExpandAll
            columns={[
              {
                title: "Mã môn học",
                align: "center",
                dataIndex: "code",
                type: "input",
                width: 120,
                render: (_, record) => record?.subjectClassStudent?.[0]?.subjectVersion.code,
              },
              {
                title: "Tên môn học",
                dataIndex: "name",
                type: "input_search",
                options: trainingSubjectVersions.map((item) => ({
                  label: item.name,
                  value: item.name,
                })),
                width: 200,
                render: (_, record) => record?.subjectClassStudent?.[0]?.subjectVersion.name,
              },
              {
                title: "Điểm TX",
                align: "center",
                dataIndex: "attendanceScoreCmp",
                type: "cmp",
                width: 100,
                render: (_, record) => record?.subjectClassStudent?.[0]?.attendanceScore,
              },
              {
                title: "Điểm ĐK",
                align: "center",
                dataIndex: "midtermScoreCmp",
                type: "cmp",
                width: 100,
                render: (_, record) => record?.subjectClassStudent?.[0]?.midtermScore,
              },
              {
                title: "Điểm thi",
                align: "center",
                dataIndex: "examScoreCmp",
                type: "cmp",
                width: 100,
                render: (_, record) => record?.subjectClassStudent?.[0]?.examScore,
              },
              {
                title: <Tooltip title="Số tín chỉ">STC</Tooltip>,
                align: "center",
                dataIndex: "creditCmp",
                type: "cmp",
                width: 80,
                render: (_, record) => record?.subjectClassStudent?.[0]?.subjectVersion.credit,
              },
              {
                title: "Điểm hệ 10",
                align: "center",
                dataIndex: "finalScoreCmp",
                type: "cmp",
                width: 100,
                render: (_, record) => {
                  const subjectClassStudent = record?.subjectClassStudent?.[0]
                  return (
                    subjectClassStudent?.manualFinalScore ??
                    subjectClassStudent?.finalScore?.toNumber() ??
                    ""
                  )
                },
              },
              {
                title: "Điểm hệ 4",
                align: "center",
                dataIndex: "finalScore4",
                width: 100,
                render: (_, record) => {
                  const subjectClassStudent = record?.subjectClassStudent?.[0]
                  const score =
                    subjectClassStudent?.manualFinalScore ||
                    subjectClassStudent?.finalScore?.toNumber()
                  if (score === undefined || score === null) return null
                  return convertScore(
                    score,
                    courseScoreConfigFrom(student?.fixedClass?.trainingCourse, subjectClassStudent)
                  ).base4
                },
              },
              {
                title: "Điểm hệ chữ",
                align: "center",
                width: 120,
                render: (_, record) => {
                  const subjectClassStudent = record?.subjectClassStudent?.[0]

                  const score =
                    subjectClassStudent?.manualFinalScore ??
                    subjectClassStudent?.finalScore?.toNumber()

                  if (score === null || score === undefined) return null

                  return convertScore(
                    score,
                    courseScoreConfigFrom(student?.fixedClass?.trainingCourse, subjectClassStudent)
                  ).letter
                },
              },
              {
                title: "Kết quả",
                align: "center",
                width: 100,
                render: (_: any, record: any) => {
                  const subjectClassStudent = record.subjectClassStudent?.[0]
                  const score =
                    subjectClassStudent?.manualFinalScore ??
                    subjectClassStudent?.finalScore?.toNumber()

                  if (score === undefined || score === null) return null
                  const result = convertScore(
                    score,
                    courseScoreConfigFrom(student?.fixedClass?.trainingCourse, subjectClassStudent)
                  )

                  return (
                    <div className="flex items-center justify-center">
                      {result.pass ? (
                        <Check size={18} color="green" />
                      ) : (
                        <X size={18} color="red" />
                      )}
                    </div>
                  )
                },
              },
              {
                title: "Điểm cộng",
                align: "center",
                width: 100,
                render: (_, { id, subjectClassStudent }) =>
                  subjectClassStudent?.[0]?.awards.reduce(
                    (
                      acc: number,
                      curr: {
                        archivedAward: ArchivedAward
                      }
                    ) => acc + (curr?.archivedAward?.bonusScore ?? 0),
                    0
                  ),
              },
              {
                title: "Chứng chỉ",
                align: "center",
                width: 150,
                render: (_, { id, subjectClassStudent }) =>
                  subjectClassStudent?.[0]?.certificates
                    .map(
                      (i: { archivedCertificate: ArchivedCertificate }) =>
                        i?.archivedCertificate?.code
                    )
                    .join(", "),
              },
              {
                title: "Ghi chú",
                align: "center",
                dataIndex: ["subjectClassStudent", "0", "description"],
                width: 200,
                render: (value: string) => {
                  return <span className="line-clamp-1">{visibleScoreNote(value)}</span>
                },
              },
            ]}
            data={displaySemesters.filter((s) => !semesterId || semesterId === s.id)}
            pagination={{
              hideOnSinglePage: true,
            }}
          />
        </Col>
        <Col span={24}>
          <Table
            header={<div className="text-sm font-semibold uppercase">Danh sách điểm chứng chỉ</div>}
            columns={[
              {
                title: "STT",
                width: 50,
                align: "center",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Chứng chỉ",
                width: 150,
                align: "center",
                render: (_, record) => record?.certificate?.name || "",
              },
              {
                title: "Điểm",
                align: "center",
                width: 80,
                render: (__, record) => record?.score ?? "",
              },
              {
                title: "Nơi cấp",
                align: "center",
                width: 120,
                render: (__, record) => record?.issuedBy || "",
              },
              {
                title: "Số QĐ",
                align: "center",
                width: 120,
                render: (__, record) => record?.decisionNumber || "",
              },
              {
                title: "Ngày cấp",
                align: "center",
                width: 110,
                render: (__, record) =>
                  record?.issuedDate ? dayjs(record.issuedDate).format("DD/MM/YYYY") : "",
              },
              {
                title: "Ngày hết hạn",
                align: "center",
                width: 110,
                render: (__, record) =>
                  record?.expiredDate ? dayjs(record.expiredDate).format("DD/MM/YYYY") : "",
              },
            ]}
            data={archivedCertificates}
            pagination={false}
          />
        </Col>
        <Col span={24}>
          <Table
            header={<div className="text-sm font-semibold uppercase">Danh sách điểm phiên</div>}
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
                render: (value: string) => visibleScoreNote(value),
              },
            ]}
            pagination={false}
          />
        </Col>
      </Row>
    </div>
  )
}

StudentScoreClassPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout breadcrumbList={[{ title: "Kết quả học tập" }]}>{page}</DefaultLayout>
}
