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
import { sqlTransaction } from "@workspace/libs/api/model"
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
import { useCallback, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
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

  const { data = [], refetch } = useFindManyStudent(
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
          include: { semester: true },
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
  const handleTest = () => {
    const testRows: TableRow[] = [
      {
        cells: [
          { value: "Test", colSpan: 10, rowSpan: 2, border: true },
          { value: "Test", border: true },
          { value: "Test", border: true },
        ],
      },
      {
        cells: [
          { value: "Test", border: true },
          { value: "Test", border: true },
          { value: "Test", border: true },
        ],
      },
    ]
    exportFromTemplate({
      templateUrl: getMinioUrl("/mta/template/Bangdiemtheolop.xlsx"),
      sheets: [
        {
          sheet: "BaoCaoDiem",
          rows: testRows,
          tableStartCell: { row: 9, col: 1 },
        },
      ],
      fileName: "Test.xlsx",
    })
  }
  const handleExportDiemLop = async () => {
    showSpinner()
    try {
      const subjectsInOrder = fixedClass?.curriculumVersion?.trainingBlocks
        .flatMap((block) => block.subjects)
        .sort((a, b) => (a.semester || 0) - (b.semester || 0))
      const tongSoHP = subjectsInOrder?.length
      const tongSoTC = subjectsInOrder?.reduce((sum, s) => sum + (s.subject.credit || 0), 0)

      const chuthichMonHoc = subjectsInOrder?.map((s, index) => `M${index + 1}. ${s.subject.name}`)

      const studentRows = data.map((student, index) => {
        const diem: (string | number | null)[] = (subjectsInOrder || []).map((subjectInfo) => {
          const scoreData = (student as any).subjectClassStudent?.find(
            (score: any) => score.subjectVersion?.subject?.id === subjectInfo.subject.id
          )
          if (scoreData) {
            return scoreData.manualFinalScore ?? scoreData.finalScore
          }
          return null
        })
        const ccta = (student as any).englishCertificate || null
        const tbc = (student as any).gpa || null

        // !!! TODO: Lấy ĐLV (Điểm luận văn)
        const dlv = null
        return {
          cells: [
            { value: index + 1, align: "center" as const, border: true },
            { value: student.userProfile.fullname, border: true },
            {
              value: student.userProfile.dateOfBirth
                ? dayjs(student.userProfile.dateOfBirth).format("DD/MM/YYYY")
                : "",
              align: "center" as const,
              border: true,
            },
            {
              value: student.fixedClass?.trainingCourse?.trainingObjectType?.name || "",
              align: "center" as const,
              border: true,
            },
            ...diem.map((d) => ({
              value: d !== null ? String(d) : null,
              align: "right" as const,
              border: true,
            })),
            {
              value: ccta !== null ? String(ccta) : null,
              align: "right" as const,
              border: true,
            },
            {
              value: tbc !== null ? String(tbc) : null,
              align: "right" as const,
              border: true,
              bold: true,
            },
            {
              value: dlv !== null ? String(dlv) : null,
              align: "right" as const,
              border: true,
              bold: true,
            },
          ],
        }
      })

      const columnFooterRows: TableRow[] = []
      const maxRowsPerColumn = 9

      for (let i = 0; i < maxRowsPerColumn; i++) {
        const cell1 = chuthichMonHoc?.[i]
          ? { value: chuthichMonHoc[i], border: false, colSpan: 10 }
          : { value: null, border: false, colSpan: 10 }
        const cell2 = chuthichMonHoc?.[i + 9]
          ? { value: chuthichMonHoc[i + 9], border: false, colSpan: 10 }
          : { value: null, border: false, colSpan: 10 }
        const cell3 = chuthichMonHoc?.[i + 18]
          ? { value: chuthichMonHoc[i + 18], border: false, colSpan: 10 }
          : { value: null, border: false, colSpan: 10 }

        columnFooterRows.push({ cells: [cell1, cell2, cell3] })
      }

      const ghiChuRows: TableRow[] = [
        { cells: [{ value: null, border: false }] },
        { cells: [{ value: "GHI CHÚ:", border: false, bold: true, colSpan: 10 }] },
        {
          cells: [
            {
              value:
                "1. 'Null': Môn đã lên danh sách thi nhưng chưa thi hoặc giảng viên chưa nhập điểm",
              border: false,
              colSpan: 20,
            },
          ],
        },
        {
          cells: [{ value: "2. ' ': Môn chưa lên danh sách thi", border: false, colSpan: 20 }],
        },
        { cells: [{ value: "3. 'Miễn': Môn miễn học", border: false, colSpan: 20 }] },
        { cells: [{ value: "4. 'HT': Môn hoãn thi", border: false, colSpan: 20 }] },
        { cells: [{ value: "4. 'CT': Môn cấm thi", border: false, colSpan: 20 }] },
        { cells: [{ value: "5. 'ĐCT': Môn đình chỉ thi", border: false, colSpan: 20 }] },
        {
          cells: [
            {
              value:
                "6. Điểm TBC: Tính điểm trung bình cộng của tất cả các môn đã có điểm ở thời điểm xuất file excel điểm (Không tính điểm môn chưa thi, không tính điểm môn hoãn thi, miễn thi)",
              border: false,
              colSpan: 30,
            },
          ],
        },
      ]

      exportFromTemplate({
        templateUrl: getMinioUrl("/mta/template/Bangdiemtheolop.xlsx"),
        sheets: [
          {
            sheet: "BaoCaoDiem",
            data: {
              khoa: `KẾT QUẢ ĐÀO TẠO TOÀN ${fixedClass?.trainingCourse.name?.toUpperCase()}`,
              chuyenNganh: `${fixedClass?.curriculumVersion?.curriculum.trainingMajor.code} - ${fixedClass?.curriculumVersion?.curriculum.trainingMajor.name}`,
              lop: fixedClass?.name || null,
              tongSoHP: tongSoHP || null,
              tongSoTC: tongSoTC || null,
            },
            tableStartCell: { row: 9, col: 1 },
            rows: [...studentRows, ...columnFooterRows, ...ghiChuRows],
          },
        ],
        fileName: `BangDiem-${fixedClass?.name}.xlsx`,
      })
    } catch (error) {
      console.error("Export failed:", error)
      message.error("Xuất file thất bại, vui lòng thử lại!")
    } finally {
      hideSpinner()
    }
  }

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
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

  // TODO!: anh TUẤN sửa
  // const { onOpen: onOpenUpdate } = useDisclosure<{
  //     tag?: string
  //     preSelectedValues?: {
  //         trainingObjectTypeId?: string
  //         trainingCourseId?: string
  //         fixedClassId?: string
  //     }
  //     id: string | null
  // }>({
  //     tag: 'PutStudentModal',
  // })

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
                        subjectVersion: true,
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
                  // scs = subjectClassStudent
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
                    const diemchu: string = convertScore(currentScore).letter ?? ""

                    if (diemchu.toUpperCase() < "F") {
                      monhoc.push({
                        TenMonhoc: subjectClassStudent.subjectVersion.name,
                        MaMH: subjectClassStudent.subjectVersion.code?.slice(0, 2) ?? "",
                        soTC: subjectClassStudent.subjectVersion.credit,
                        diemhe10: currentScore,
                        diemhe4: convertScore(currentScore).base4 ?? 0,
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
                { value: null },
                { value: null },
                { value: monHoc.diemhe10 ?? 0, align: "right" },
                { value: monHoc.diemhe4 ?? 0, align: "right" },
                { value: monHoc.diemchu ?? "", align: "center" },
                { value: null },
                { value: monHoc.ghichu ?? "" },
              ],
            })) ?? []

          // Dòng trung bình học kỳ
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
                        subjectVersion: true,
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
                  monhoc.push({
                    TenMonhoc: subjectClassStudent.subjectVersion.name,
                    MaMH: subjectClassStudent.subjectVersion.code?.slice(0, 2) ?? "",
                    soTC: subjectClassStudent.subjectVersion.credit,
                    diemhe10:
                      subjectClassStudent?.manualFinalScore ||
                      Number(subjectClassStudent?.finalScore) ||
                      0,
                    diemhe4:
                      convertScore(
                        subjectClassStudent?.manualFinalScore ||
                          Number(subjectClassStudent?.finalScore) ||
                          0
                      ).base4 ?? 0,
                    diemchu:
                      convertScore(
                        subjectClassStudent?.manualFinalScore ||
                          Number(subjectClassStudent?.finalScore) ||
                          0
                      ).letter ?? "",
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
          sheet: `${sampleStudentData.maSV} - ${sampleStudentData.fullname}`, // Tên sheet tạm duy nhất
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
                        subjectVersion: true,
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
                  monhoc.push({
                    TenMonhoc: subjectClassStudent.subjectVersion.name,
                    MaMH: subjectClassStudent.subjectVersion.code?.slice(0, 2) ?? "",
                    soTC: subjectClassStudent.subjectVersion.credit,
                    diemhe10:
                      subjectClassStudent?.manualFinalScore ||
                      Number(subjectClassStudent?.finalScore) ||
                      0,
                    diemhe4:
                      convertScore(
                        subjectClassStudent?.manualFinalScore ||
                          Number(subjectClassStudent?.finalScore) ||
                          0
                      ).base4 ?? 0,
                    diemchu:
                      convertScore(
                        subjectClassStudent?.manualFinalScore ||
                          Number(subjectClassStudent?.finalScore) ||
                          0
                      ).letter ?? "",
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
          console.log("item", item)
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
  const { convertScore } = useScoreConverter(data?.[0]?.fixedClass?.trainingCourse?.scoreConverts)

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
          <Row gutter={[16, 0]} align="top" justify="space-between">
            {/* <Col span={12} /> */}

            {/* Hàng chứa các button */}
            <Col span={24}>
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
                      // {
                      //     label: 'Test',
                      //     key: 'test',
                      //     onClick: async () => await handleTest(),
                      // },
                    ],
                  }}
                >
                  <Button type="primary" icon={<DownloadOutlined />}>
                    Xuất bảng điểm
                  </Button>
                </Dropdown>

                <Tooltip title="Thêm Học viên/Sinh viên">
                  <Button onClick={handleModal} type="primary">
                    Thêm HV/SV
                  </Button>
                </Tooltip>
                {/* <Dropdown overlay={menuDownload} trigger={['hover']}>
                                    <Button type="primary" icon={<DownloadOutlined />}>
                                        Tải file mẫu
                                    </Button>
                                </Dropdown>
                                <Dropdown overlay={menuUpload} trigger={['hover']}>
                                    <Button type="primary" icon={<UploadOutlined />}>
                                        Nhập file
                                    </Button>
                                </Dropdown> */}
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            rowKey="id"
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
                  console.log(record.userProfile?.rank?.sTen)
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
