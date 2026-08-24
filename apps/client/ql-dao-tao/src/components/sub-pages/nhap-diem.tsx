import { queryClient } from "@api/index"
import ImportScoreModal, { type ImportScoreData } from "@components/commons/print/nhap-diem-tu-file"
import ExportScoreTemplate from "@components/commons/print/xuat-mau-nhap-diem"
import ScoreInputCell from "@components/commons/score-input"
import Table from "@components/commons/table"
import { examBanReason, examPostponeReason, examSuspendedReason } from "@constants/constants"
import { FilterTable, RowDisplayData, SubjectClassScoreForm } from "@constants/nhap-diem.type"
import { scoreConvert } from "@hooks/scoreConverter"
import useSpinner from "@hooks/spinner"
import { validateExamScore, validateScore } from "@lib/utils"
import {
  type DiemLopMonHocProps,
  diemLopMonHocStore,
} from "@pages/quan-ly-diem/ql-diem-lop-mon-hoc"
import { useStore } from "@tanstack/react-store"
import { useSession } from "@workspace/auth/react"
import { $Enums } from "@workspace/db/client"
import {
  useFindManyStudentSubjectScore,
  useFindUniqueSubjectClass,
  useUpdateSubjectClass,
} from "@workspace/db/hooks"
import { getUrl } from "@workspace/libs/api/custom-instance"
import { sqlTransaction } from "@workspace/libs/api/model"
import type { SqlTransactionBodyItem } from "@workspace/libs/api/schemas/sqlTransactionBodyItem"
import { getExportSubjectClassScoreUrl } from "@workspace/libs/api/training"
import { calcFinalScore, fastIsEqual, getRuntimeEnv, isNullish } from "@workspace/libs/utils"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { cn } from "@workspace/ui/lib/utils"
import {
  AutoComplete,
  Button,
  Checkbox,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  message,
  Row,
  Tag,
  Tooltip,
} from "antd"
import dayjs from "dayjs"
import type Decimal from "decimal.js"
import _ from "lodash"
import { FileUp, Printer, Save } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function NhapDiem({
  role,
  score,
  loadData,
}: DiemLopMonHocProps & {
  loadData: boolean
}) {
  const { can } = useAbility()
  const { showSpinner, hideSpinner } = useSpinner()
  const [form] = Form.useForm<SubjectClassScoreForm>()
  const [rowData, setRowData] = useState<Record<string, RowDisplayData>>({})
  const rowDataRef = useRef(rowData)
  rowDataRef.current = rowData
  const { selectedSubjectClassId } = useStore(diemLopMonHocStore)
  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId
  const [activeCell, setActiveCell] = useState<string | null>(null)
  const skipNextBlurRef = useRef(false)
  const pendingRowUpdatesRef = useRef<Record<string, RowDisplayData>>({})
  const debouncedFlushRowUpdates = useCallback(
    _.debounce(() => {
      setRowData((prev) => {
        const pending = pendingRowUpdatesRef.current
        if (Object.keys(pending).length === 0) return prev
        pendingRowUpdatesRef.current = {}
        return { ...prev, ...pending }
      })
    }, 150),
    []
  )
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [manualEnableLockPrint, setManualEnableLockPrint] = useState(false)
  const [filterTable, setFilterTable] = useState<FilterTable>({
    fullname: "",
    fixedClassCode: "",
    dateOfBirth: undefined,
    attendanceScore: undefined,
    midtermScore: undefined,
    examScore: undefined,
  })
  const { onOpen: onOpenDetailStudent } = useDisclosure<string>({
    tag: "ModalChiTietSinhVien",
  })
  const { onOpen: openScoreDetail } = useDisclosure<{
    id: string
  }>({
    tag: "ModalScoreDetail",
  })

  const { data: dataTable = [], refetch } = useFindManyStudentSubjectScore(
    {
      where: {
        subjectClassId: selectedSubjectClassId || "",
        ...(filterTable.fullname
          ? {
              student: {
                userProfile: {
                  fullname: {
                    contains: filterTable.fullname,
                    mode: "insensitive",
                  },
                },
              },
            }
          : {}),
        ...(filterTable.code
          ? {
              student: {
                userProfile: {
                  code: { contains: filterTable.code, mode: "insensitive" },
                },
              },
            }
          : {}),
        ...(filterTable.fixedClassCode
          ? {
              student: {
                fixedClass: {
                  code: {
                    contains: filterTable.fixedClassCode,
                    mode: "insensitive",
                  },
                },
              },
            }
          : {}),
        ...(filterTable.dateOfBirth?.length === 2
          ? {
              student: {
                userProfile: {
                  dateOfBirth: {
                    gte: dayjs(filterTable.dateOfBirth?.[0], "DD/MM/YYYY").toDate(),
                    lte: dayjs(filterTable.dateOfBirth?.[1], "DD/MM/YYYY").toDate(),
                  },
                },
              },
            }
          : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            code: true,
            userProfile: {
              select: {
                fullname: true,
                lastName: true,
                firstName: true,
                dateOfBirth: true,
              },
            },
            fixedClass: {
              select: {
                code: true,
                name: true,
                trainingCourse: {
                  select: {
                    coef_1: true,
                    coef_2: true,
                    coef_3: true,
                    scoreToTakeExam: true,
                    scoreToPass: true,
                    scoreToPassGraduation: true,
                    maxReExamScore: true,
                    reduceReExamScore: true,
                    examScoreToPass: true,
                    scoreConverts: true,
                  },
                },
              },
            },
          },
        },
        subjectClass: {
          select: {
            code: true,
            type: true,
            semester: {
              select: {
                name: true,
                schoolYear: { select: { name: true } },
              },
            },
            mainLecturer: {
              select: {
                userProfile: { select: { fullname: true } },
              },
            },
            extraLecturer: {
              select: {
                userProfile: { select: { fullname: true } },
              },
            },
            enterGradeLecturer: {
              select: {
                userProfile: { select: { fullname: true } },
              },
            },
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
        certificates: {
          include: {
            archivedCertificate: true,
          },
        },
      },
      orderBy: [
        ...(filterTable.attendanceScore
          ? [
              {
                attendanceScore: filterTable.attendanceScore,
              },
            ]
          : []),
        ...(filterTable.midtermScore
          ? [
              {
                midtermScore: filterTable.midtermScore,
              },
            ]
          : []),
        ...(filterTable.examScore
          ? [
              {
                examScore: filterTable.examScore,
              },
            ]
          : []),
        {
          student: {
            userProfile: {
              firstName: "asc",
            },
          },
        },
      ],
    },
    {
      refetchOnWindowFocus: false,
      enabled: loadData && !!selectedSubjectClassId,
    }
  )

  const enteredScore = useMemo(
    () =>
      dataTable.every(({ id, attendanceScore, midtermScore }) => {
        const f = rowData?.[id]
        return (
          (attendanceScore !== undefined &&
            attendanceScore !== null &&
            attendanceScore <= 1 &&
            !f?.examBanned) ||
          (midtermScore !== undefined &&
            midtermScore !== null &&
            midtermScore <= 1 &&
            !f?.examBanned) ||
          (f?.examBanned && f?.examBannedReason) ||
          (f?.attendanceScore && f?.midtermScore)
        )
      }),
    [dataTable, rowData]
  )
  const enteredExamScore = useMemo(
    () =>
      dataTable.every(({ id }) => {
        const f = rowData?.[id]
        return (
          (f?.examBanned && f?.examBannedReason) ||
          (f?.examPostponed && f?.examPostponedReason) ||
          f?.examScore
        )
      }),
    [dataTable, rowData]
  )

  const handleSave = async () => {
    if (!dataDetailSubjectClass?.subject) {
      message.error("Không tìm thấy thông tin môn học")
      return
    }
    for (const value of Object.values(rowData)) {
      try {
        await validateScore(value.attendanceScore, dataDetailSubjectClass?.subject.onePoint)
        await validateScore(value.midtermScore, dataDetailSubjectClass?.subject.onePoint)
        await validateExamScore(value.examScore)
        if (value.examBanned && !value.examBannedReason) {
          message.error("Vui lòng nhập lý do cấm thi")
          return
        }
        if (value.examPostponed && !value.examPostponedReason) {
          message.error("Vui lòng nhập lý do hoãn thi")
          return
        }
      } catch (_) {
        message.warning("Vui lòng kiểm tra lại điểm")
        return
      }
    }
    Modal.confirm({
      title: "Xác nhận",
      content: "Bạn có chắc chắn muốn lưu điểm không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        handleSaveScores()
      },
    })
  }
  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "SubjectClass"],
      })
    }, 500),
    []
  )

  const handleSaveScores = async () => {
    try {
      showSpinner()

      const listChange = Object.entries(rowData)
        .map(([key, value]) => ({ id: key, ...value }))
        .filter((e) => e.isChanged)

      const listSqlTransaction: SqlTransactionBodyItem[] = []
      if (selectedSubjectClassId) {
        listSqlTransaction.push({
          model: "SubjectClass",
          operation: "update",
          data: {
            where: { id: selectedSubjectClassId },
            data: { enteredScore, enteredExamScore },
          },
        })
      }
      if (listChange.length > 0) {
        const dataWithFinalScore = listChange.map((item) => {
          return {
            attendanceScore: item.attendanceScore,
            midtermScore: item.midtermScore,
            examScore: item.examScore,
            finalScore: isNullish(item.finalScore) ? null : item.finalScore,
            description: item?.description,
            examPostponed: isNullish(item.examPostponed) ? null : item.examPostponed,
            examPostponedReason: isNullish(item.examPostponedReason)
              ? null
              : item.examPostponedReason,
            examBanned: isNullish(item.examBanned) ? null : item.examBanned,
            examBannedReason: isNullish(item.examBannedReason) ? null : item.examBannedReason,
            suspended: isNullish(item.suspended) ? null : item.suspended,
            suspendedReason: isNullish(item.suspendedReason) ? null : item.suspendedReason,
            id: item.id,
          }
        })

        listSqlTransaction.push(
          ...dataWithFinalScore.map(({ id, ...item }) => {
            return {
              model: "StudentSubjectScore" as const,
              operation: "update",
              data: {
                where: { id },
                data: item,
              },
            }
          }),
          {
            model: "StudentSubjectScoreHistory" as const,
            operation: "createMany",
            data: {
              data: dataWithFinalScore.map(({ id, ...item }) => {
                return {
                  ...item,
                  studentSubjectScoreId: id,
                  updatedById: profileId,
                }
              }),
            },
          }
        )
      }

      if (listSqlTransaction?.length > 0) {
        const res = await sqlTransaction(listSqlTransaction)
        if (res?.status === 200) {
          form.resetFields()
          message.success("Đã cập nhật điểm thi thành công!")
          debouncedRefetch()
        }
      }
    } catch (error: any) {
      console.error(error)
      message.error("Đã xảy ra lỗi khi lưu điểm, vui lòng thử lại.")
    } finally {
      hideSpinner()
    }
  }

  const handleImportConfirm = (importedData: ImportScoreData[]) => {
    const changedData = Object.fromEntries(
      importedData.map((item) => {
        const scoreToTakeExam = rowData[item.id]?.scoreToTakeExam
        // TODO: fix not work if directly uncheck exam banned
        const isExamBanned = isGraduation
          ? !!rowData[item.id]?.examBannedReason
          : !!rowData[item.id]?.examBannedReason ||
            (item.attendanceScore !== null &&
              scoreToTakeExam !== null &&
              scoreToTakeExam !== undefined &&
              item.attendanceScore < scoreToTakeExam) ||
            (item.midtermScore !== null &&
              scoreToTakeExam !== null &&
              scoreToTakeExam !== undefined &&
              item.midtermScore < scoreToTakeExam)

        if (dataDetailSubjectClass?.subject.onePoint) {
          item.attendanceScore = item.examScore
          item.midtermScore = item.examScore
        }

        const dataForCalc = dataTable.find((i) => i.id === item.id)

        const defaultCoef = {
          coef_1: 0.1,
          coef_2: 0.3,
          coef_3: 0.6,
          scoreToTakeExam: 1,
          scoreToPass: 4,
          maxReExamScore: 10,
          reduceReExamScore: 0,
          examScoreToPass: 5,
        }
        const finalScore = calcFinalScore(
          dataForCalc?.student?.fixedClass?.trainingCourse || defaultCoef,
          {
            attendanceScore: item.attendanceScore,
            midtermScore: item.midtermScore,
            examScore: item.examScore,
            awards:
              dataForCalc?.awards?.map?.((a) => ({
                status: a.status,
                archivedAward: {
                  bonusScore: a.archivedAward.bonusScore ?? 0,
                },
              })) || [],
            certificates:
              dataForCalc?.certificates?.map?.((c) => ({
                archivedCertificate: {
                  finalScore: c.archivedCertificate.finalScore ?? 0,
                },
              })) || [],
          },
          dataForCalc?.subjectClass?.type || "NORMAL"
        )?.toNumber()

        const scoreConvertResult =
          finalScore !== null && finalScore !== undefined
            ? scoreConvert(
                finalScore,
                dataForCalc?.student?.fixedClass?.trainingCourse?.scoreConverts || []
              )
            : null

        // Graduation: nếu điểm thi < scoreToPassGraduation thì hệ 4 = 0, chữ = F
        const scoreToPassGraduation =
          dataForCalc?.student?.fixedClass?.trainingCourse?.scoreToPassGraduation ?? 5.5
        const failGraduation =
          isGraduation && finalScore != null && finalScore < scoreToPassGraduation

        const finalScoreBase4 = failGraduation ? 0 : scoreConvertResult?.base4
        const letter = failGraduation ? "F" : scoreConvertResult?.letter

        const scoreInfo = !score
          ? {
              attendanceScore: item.attendanceScore,
              midtermScore: item.midtermScore,
              examScore: item.examScore,
            }
          : score === "TX/ĐK"
            ? {
                attendanceScore: item.attendanceScore,
                midtermScore: item.midtermScore,
              }
            : {
                attendanceScore: item.attendanceScore,
                midtermScore: item.midtermScore,
                examScore: item.examScore,
              }

        return [
          item.id,
          {
            ...rowData[item.id],
            isChanged:
              rowData[item.id]?.attendanceScore !== item.attendanceScore ||
              rowData[item.id]?.midtermScore !== item.midtermScore ||
              rowData[item.id]?.examScore !== item.examScore,
            finalScore: isExamBanned ? 0 : finalScore,
            finalScoreBase4,
            letter,
            ...scoreInfo,
            examBanned: isExamBanned,
          },
        ]
      })
    )

    setRowData((prev) => ({ ...prev, ...(changedData as Record<string, RowDisplayData>) }))
    showSpinner()
    try {
      message.success("Nhập điểm từ file thành công!")
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Có lỗi xảy ra khi nhập điểm từ file")
    } finally {
      hideSpinner()
    }
  }

  const { data: dataDetailSubjectClass, refetch: refetchSubjectClass } = useFindUniqueSubjectClass(
    {
      where: {
        id: selectedSubjectClassId,
      },
      select: {
        scoreDeadLineStart: true,
        scoreDeadline: true,
        examScoreDeadline: true,
        isLockScore: true,
        isLockExamScore: true,
        enteredScore: true,
        type: true,
        enteredExamScore: true,
        scoreSubmitted: true,
        subject: {
          select: {
            onePoint: true,
            credit: true,
            type: true,
            managementOrganization: {
              select: {
                sTen: true,
              },
            },
            trainingBlocks: {
              select: {
                graduation: true,
              },
              take: 1,
            },
          },
        },
        semester: {
          select: {
            name: true,
            schoolYear: true,
          },
        },
        code: true,
        name: true,
        mainLecturer: {
          select: {
            userProfile: {
              select: {
                fullname: true,
              },
            },
          },
        },
        extraLecturer: {
          select: {
            userProfile: {
              select: {
                fullname: true,
              },
            },
          },
        },
        examDate: true,
        examType: true,
        exam: {
          select: {
            lockExamSessions: true,
            examRooms: {
              select: {
                examList: {
                  select: {
                    createdExamCode: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      enabled: !!selectedSubjectClassId,
      refetchOnWindowFocus: false,
    }
  )

  const onlyNumberPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (
      !/[0-9]/.test(e.key) &&
      e.key !== "Backspace" &&
      e.key !== "Delete" &&
      e.key !== "Tab" &&
      e.key !== "." &&
      e.key !== ","
    ) {
      e.preventDefault()
    }
  }

  const fieldTypeToName: Record<"cc" | "tx" | "thi", keyof RowDisplayData> = {
    cc: "attendanceScore",
    tx: "midtermScore",
    thi: "examScore",
  }

  const activateCell = useCallback(
    (id: string, field: keyof RowDisplayData) => {
      form.setFieldValue(["list", id, field], rowDataRef.current[id]?.[field])
      setActiveCell(`${id}|${field}`)
    },
    [form]
  )

  const handleCellBlur = useCallback(() => {
    if (skipNextBlurRef.current) {
      skipNextBlurRef.current = false
      return
    }
    setActiveCell(null)
  }, [])

  const dataTableRef = useRef(dataTable)
  dataTableRef.current = dataTable

  const handleScoreCellKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, recordId: string, type: "cc" | "tx" | "thi") => {
      const fieldOrder: ("cc" | "tx" | "thi")[] = ["cc", "tx", "thi"]
      const dt = dataTableRef.current
      const currentRowIndex = dt.findIndex((item) => item.id === recordId)

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault()
        e.stopPropagation()
        const direction = e.key === "ArrowDown" ? 1 : -1
        const targetRow = dt[currentRowIndex + direction]
        if (targetRow) {
          skipNextBlurRef.current = true
          activateCell(targetRow.id!, fieldTypeToName[type])
        }
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault()
        e.stopPropagation()
        const currentColIndex = fieldOrder.indexOf(type)
        const direction = e.key === "ArrowRight" ? 1 : -1
        const targetColIndex = currentColIndex + direction
        if (targetColIndex >= 0 && targetColIndex < fieldOrder.length) {
          const nextType = fieldOrder[targetColIndex]
          skipNextBlurRef.current = true
          activateCell(recordId, fieldTypeToName[nextType])
        }
      }
      onlyNumberPress(e)
    },
    [activateCell]
  )

  const handleScoreDetailOpen = useCallback(
    (id: string) => openScoreDetail({ id }),
    [openScoreDetail]
  )

  const disabledForm: boolean = useMemo(() => {
    if (score === "TX/ĐK") {
      return !(
        can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_CC_TX, "NHAP_DIEM") &&
        dataDetailSubjectClass?.scoreDeadLineStart &&
        dayjs().isAfter(dataDetailSubjectClass?.scoreDeadLineStart) &&
        dataDetailSubjectClass?.scoreDeadline &&
        dayjs().isBefore(dataDetailSubjectClass?.scoreDeadline) &&
        !dataDetailSubjectClass?.isLockScore &&
        !dataDetailSubjectClass?.isLockExamScore &&
        !dataDetailSubjectClass?.scoreSubmitted &&
        !dataDetailSubjectClass?.subject.onePoint &&
        dataDetailSubjectClass?.type !== $Enums.SubjectClassType.REEXAM
      )
    }

    // THI: chỉ enable khi KHÔNG phải kỳ thi đánh phách và chưa khóa điểm
    const laKyThiDanhPhach =
      !!dataDetailSubjectClass?.exam?.lockExamSessions ||
      (dataDetailSubjectClass?.exam?.examRooms?.some((room) =>
        room.examList?.some((el) => el.createdExamCode)
      ) ??
        false)
    const daKhoaDiem =
      !!dataDetailSubjectClass?.isLockExamScore || !!dataDetailSubjectClass?.scoreSubmitted
    const trongHan =
      !!dataDetailSubjectClass?.examScoreDeadline &&
      dayjs().isBefore(dataDetailSubjectClass.examScoreDeadline)

    return !(
      can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_THI, "NHAP_DIEM") &&
      trongHan &&
      !laKyThiDanhPhach &&
      !daKhoaDiem
    )
  }, [dataDetailSubjectClass, can, score])

  const isGraduation = dataDetailSubjectClass?.subject?.trainingBlocks?.[0]?.graduation === true

  const { onOpen: openXemTaiLieu } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string
    mode?: "view" | "edit"
    convertTo?: string
  }>({
    tag: "XemTaiLieu",
  })

  const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()

  const lockExam = async (subjectClassId?: string) => {
    if (!subjectClassId) {
      message.warning("Không tìm thấy ID lớp học")
      return false
    }

    try {
      await updateSubjectClass({
        where: { id: subjectClassId },
        data: {
          isLockScore: true,
          isLockExamScore: true,
          subjectClassHistory: {
            create: {
              isLockExamScore: true,
              isLockScore: true,
              updatedById: profileId,
            },
          },
        },
      })
      message.success("Khoá điểm thành công")
      return true
    } catch (error) {
      message.error("Có lỗi xảy ra khi khoá điểm")
      console.error(error)
      return false
    }
  }
  const handlePrint = () => {
    if (!selectedSubjectClassId) {
      return message.warning("Vui lòng chọn lớp học trước khi in")
    }

    Modal.confirm({
      title: "Xác nhận",
      content: "Bạn có chắc chắn muốn in phiếu điểm và khoá nhập điểm lại không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        const isSuccess = await lockExam(selectedSubjectClassId)
        if (isSuccess) {
          try {
            setManualEnableLockPrint(false)
            await refetchSubjectClass?.()
            queryClient.invalidateQueries({ queryKey: ["zenstack", "SubjectClass"] })
          } catch (e) {
            console.error("Refetch SubjectClass failed", e)
          }

          const baseUrl =
            getRuntimeEnv("NEXT_PUBLIC_API_LMS_BASE_URL") || "https://api.daotao.mta.swantech.vn"
          const exportUrl = getExportSubjectClassScoreUrl({
            id: selectedSubjectClassId,
            role: role || "",
            userId: profileId,
          })

          openXemTaiLieu({
            uri: getUrl(baseUrl, exportUrl),
            name: "Phiếu điểm",
            mimeType: "xlsx",
            // convertTo: "pdf",
          })
        }
      },
    })
  }

  const isLockAndPrintDisabled =
    !selectedSubjectClassId ||
    (!manualEnableLockPrint &&
      (!dataDetailSubjectClass?.enteredExamScore ||
        dataDetailSubjectClass?.isLockExamScore ||
        dataDetailSubjectClass?.scoreSubmitted))

  useEffect(() => {
    if (dataTable.length > 0) {
      form.resetFields()
      const newRowData: Record<string, RowDisplayData> = {}
      for (const cur of dataTable) {
        const scoreConvertResult =
          cur.finalScore != null
            ? scoreConvert(
                Number(cur.finalScore),
                cur.student?.fixedClass?.trainingCourse?.scoreConverts || []
              )
            : null

        const scoreToPassGraduation =
          cur.student?.fixedClass?.trainingCourse?.scoreToPassGraduation ?? 5.5
        const finalScoreNumber = cur.finalScore != null ? Number(cur.finalScore) : null
        const failGraduation =
          isGraduation && finalScoreNumber != null && finalScoreNumber < scoreToPassGraduation
        newRowData[cur.id] = {
          attendanceScore: cur.attendanceScore,
          midtermScore: cur.midtermScore,
          examScore: cur.examScore,
          description: cur.description,
          examBanned: cur.examBanned,
          examBannedReason: cur.examBannedReason,
          examPostponed: cur.examPostponed,
          examPostponedReason: cur.examPostponedReason,
          scoreToTakeExam: cur.student?.fixedClass?.trainingCourse?.scoreToTakeExam,
          finalScore: cur.finalScore,
          finalScoreBase4: failGraduation ? 0 : scoreConvertResult?.base4,
          letter: failGraduation ? "F" : scoreConvertResult?.letter,
          suspended: cur.suspended,
          suspendedReason: cur.suspendedReason,
          isChanged: false,
        }
      }
      setRowData(newRowData)
    }
  }, [dataTable, isGraduation])

  useEffect(() => {
    setManualEnableLockPrint(false)
  }, [selectedSubjectClassId])

  if (!selectedSubjectClassId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-300px)]">
        <Empty description="Vui lòng chọn lớp học phần để nhập điểm" />
      </div>
    )
  }

  return (
    <Row gutter={[8, 8]}>
      <Col span={8} className="flex items-center gap-1">
        {score === "TX/ĐK" && (
          <Tag
            color={enteredScore ? "green" : "yellow"}
            className="w-fit border-none px-2 py-1 text-[12px]"
          >
            {enteredScore ? "Đã hoàn thiện" : "Chưa hoàn thiện"}
          </Tag>
        )}
        {score === "THI" && (
          <Tag
            color={enteredExamScore ? "green" : "yellow"}
            className="w-fit border-none px-2 py-1 text-[12px]"
          >
            {enteredExamScore ? "Đã hoàn thiện" : "Chưa hoàn thiện"}
          </Tag>
        )}
        {!!dataDetailSubjectClass?.subject?.onePoint && (
          <Tag color={"green"} className="w-fit border-none px-2 py-1 text-[12px]">
            Ba đầu điểm bằng nhau. Chỉ nhập điểm thi.
          </Tag>
        )}
        {dataDetailSubjectClass?.type === $Enums.SubjectClassType.REEXAM && (
          <Tag color={"red"} className="w-fit border-none px-2 py-1 text-[12px]">
            Lớp học phần thi lại
          </Tag>
        )}
        <Tag className=" w-fit border-none px-2 py-1 text-[12px] bg-red-100">Cấm thi</Tag>
        <Tag className=" w-fit border-none px-2 py-1 text-[12px] bg-yellow-100">Hoãn thi</Tag>
      </Col>
      <Col span={16} className="flex justify-end">
        <Flex gap={4}>
          {(can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_CC_TX, "NHAP_EXCEL") ||
            can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_THI, "NHAP_EXCEL")) && (
            <>
              <Button
                onClick={() => setImportModalVisible(true)}
                disabled={
                  !selectedSubjectClassId ||
                  role !== "GV" ||
                  (disabledForm && !manualEnableLockPrint)
                }
                className="w-full flex justify-start"
              >
                <FileUp />
                Nhập điểm từ file
              </Button>
              <ImportScoreModal
                visible={importModalVisible}
                onCancel={() => setImportModalVisible(false)}
                onConfirm={handleImportConfirm}
                existingStudents={dataTable}
              />
            </>
          )}
          {(can(
            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC_P13,
            "XUAT_EXCEL"
          ) ||
            can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC, "XUAT_EXCEL") ||
            can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_CC_TX, "XUAT_EXCEL") ||
            can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_THI, "XUAT_EXCEL")) && (
            <ExportScoreTemplate
              selectedSubjectClass={selectedSubjectClassId}
              dataTable={dataTable}
              type={score}
              role={role}
            />
          )}
          {score !== "THI" &&
            (can(
              QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC_P13,
              "IN_DS_THI"
            ) ||
              can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC, "IN_DS_THI") ||
              can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_CC_TX, "IN_DS_THI")) && (
              // <ExportTemplateExam
              //     dataClass={dataDetailSubjectClass}
              //     dataTable={dataTable}
              //     disabled={
              //         !dataDetailSubjectClass?.enteredScore || !selectedSubjectClassId
              //     }
              // />
              <Button
                // onClick={exportTemplate}
                onClick={() => {
                  openXemTaiLieu({
                    uri: getUrl(
                      getRuntimeEnv("NEXT_PUBLIC_API_LMS_BASE_URL") ||
                        "https://api.daotao.mta.swantech.vn",
                      `${getExportSubjectClassScoreUrl({
                        id: selectedSubjectClassId ?? "",
                        type: "DANH-SACH-THI",
                        userId: profileId,
                      })}`
                    ),
                    name: "Danh sách thi",
                    mimeType: "xlsx",
                    convertTo: "pdf",
                  })
                }}
                disabled={!dataDetailSubjectClass?.enteredScore || !selectedSubjectClassId}
              >
                <Printer />
                Danh sách thi
              </Button>
            )}
          {score !== "TX/ĐK" &&
            (can(
              QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC_P13,
              "IN_PHIEU_DIEM"
            ) ||
              can(
                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                "IN_PHIEU_DIEM"
              ) ||
              can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_THI, "IN_PHIEU_DIEM")) && (
              <>
                <Button
                  type={manualEnableLockPrint ? "primary" : "default"}
                  onClick={() => setManualEnableLockPrint((prev) => !prev)}
                  disabled={!selectedSubjectClassId}
                >
                  {manualEnableLockPrint ? "Tắt mở khoá in" : "Bật mở khoá in"}
                </Button>
                <Button disabled={isLockAndPrintDisabled} onClick={() => handlePrint()}>
                  <Printer />
                  Khoá và in phiếu điểm
                </Button>
                <Button
                  disabled={!selectedSubjectClassId}
                  onClick={() =>
                    // openStudentSubjectScore({
                    //     dataTable,
                    //     type: EnumInPhieuDiem.PHIEU_DIEM_NHAP,
                    // })
                    openXemTaiLieu({
                      uri: getUrl(
                        getRuntimeEnv("NEXT_PUBLIC_API_LMS_BASE_URL") ||
                          "https://api.daotao.mta.swantech.vn",
                        getExportSubjectClassScoreUrl({
                          id: selectedSubjectClassId ?? "",
                          type: "NHAP",
                          role: role || "",
                          userId: profileId,
                        })
                      ),
                      name: "Phiếu điểm nháp",
                      mimeType: "xlsx",
                      // convertTo: "pdf",
                    })
                  }
                >
                  <Printer />
                  In phiếu điểm nháp
                </Button>
              </>
            )}
          <Button
            type="primary"
            disabled={disabledForm && !manualEnableLockPrint}
            onClick={handleSave}
          >
            <Save stroke="white" />
            Lưu
          </Button>
        </Flex>
      </Col>
      <Col span={24} className="mb-16">
        <Form
          form={form}
          onValuesChange={(changedValues) => {
            const changedId = Object.keys(changedValues.list || {})?.[0]
            if (changedId) {
              const cur = rowData[changedId] ?? {}
              const changed = changedValues.list[changedId] ?? {}

              const examScore: number | null =
                changed.examScore !== undefined ? changed.examScore : (cur.examScore ?? null)
              const attendanceScore: number | null = dataDetailSubjectClass?.subject.onePoint
                ? examScore
                : changed.attendanceScore !== undefined
                  ? changed.attendanceScore
                  : (cur.attendanceScore ?? null)
              const midtermScore: number | null = dataDetailSubjectClass?.subject.onePoint
                ? examScore
                : changed.midtermScore !== undefined
                  ? changed.midtermScore
                  : (cur.midtermScore ?? null)

              const scoreToTakeExam = cur.scoreToTakeExam ?? null
              const isExamBanned = isGraduation
                ? !!changed.examBannedReason || !!cur.examBannedReason
                : !!changed.examBannedReason ||
                  !!cur.examBannedReason ||
                  (attendanceScore !== null &&
                    scoreToTakeExam !== null &&
                    attendanceScore < scoreToTakeExam) ||
                  (midtermScore !== null &&
                    scoreToTakeExam !== null &&
                    midtermScore < scoreToTakeExam)

              const dataForCalc = dataTable.find((i) => i.id === changedId)
              if (!dataForCalc) return

              const defaultCoef = {
                coef_1: 0.1,
                coef_2: 0.3,
                coef_3: 0.6,
                scoreToTakeExam: 1,
                scoreToPass: 4,
                maxReExamScore: 10,
                reduceReExamScore: 0,
                examScoreToPass: 5,
              }
              const finalScore = calcFinalScore(
                dataForCalc?.student?.fixedClass?.trainingCourse || defaultCoef,
                {
                  attendanceScore,
                  midtermScore,
                  examScore,
                  awards:
                    dataForCalc?.awards?.map?.((a) => ({
                      status: a.status,
                      archivedAward: { bonusScore: a.archivedAward.bonusScore ?? 0 },
                    })) || [],
                  certificates:
                    dataForCalc?.certificates?.map?.((c) => ({
                      archivedCertificate: { finalScore: c.archivedCertificate.finalScore ?? 0 },
                    })) || [],
                },
                dataForCalc.subjectClass?.type || "NORMAL"
              )?.toNumber()

              const scoreConvertResult =
                finalScore != null
                  ? scoreConvert(
                      finalScore,
                      dataForCalc?.student?.fixedClass?.trainingCourse?.scoreConverts || []
                    )
                  : null
              const scoreToPassGraduation =
                dataForCalc?.student?.fixedClass?.trainingCourse?.scoreToPassGraduation ?? 5.5

              const failGraduation =
                isGraduation && finalScore != null && finalScore < scoreToPassGraduation

              const finalScoreBase4 = failGraduation ? 0 : scoreConvertResult?.base4
              const letter = failGraduation ? "F" : scoreConvertResult?.letter
              const newFinalScore = isExamBanned ? 0 : finalScore

              const currentRow = pendingRowUpdatesRef.current[changedId] ?? rowData[changedId] ?? {}
              pendingRowUpdatesRef.current[changedId] = {
                ...currentRow,
                ...changed,
                examBanned: isExamBanned,
                isChanged: !fastIsEqual(currentRow, { ...currentRow, ...changed }),
                attendanceScore,
                midtermScore,
                finalScore: newFinalScore as unknown as Decimal,
                finalScoreBase4,
                letter,
              }
              debouncedFlushRowUpdates()
            }
          }}
        >
          <Table
            rowKey="id"
            className="m-0"
            filters={filterTable}
            setFilters={setFilterTable}
            onRow={(record) => ({
              className: cn(
                !!rowData?.[record.id]?.isChanged &&
                  !rowData?.[record.id]?.examBanned &&
                  !rowData?.[record.id]?.examPostponed &&
                  "bg-yellow-50",

                !!rowData?.[record.id]?.examPostponed && "!bg-yellow-100",
                !!rowData?.[record.id]?.examBanned && "!bg-red-100"
              ),
            })}
            scrollable
            maxHeight={"calc(100vh - 460px)"}
            columns={[
              {
                title: "TT",
                width: 35,
                align: "center",
                render: (_, __, index) => index + 1,
              },
              {
                title: <Tooltip title="Mã sinh viên">MSV</Tooltip>,
                dataIndex: "code",
                align: "center",
                width: 80,
                type: "input",
                render: (_, record) => (
                  <span
                    className="cursor-pointer hover:text-primary"
                    onClick={(e) => {
                      e.preventDefault()
                      onOpenDetailStudent(record.student?.id)
                    }}
                  >
                    {record.student?.code || ""}
                  </span>
                ),
              },
              {
                title: "Họ và tên",
                dataIndex: "fullname",
                width: 150,
                type: "input",
                render: (_, record) => (
                  <span
                    className="cursor-pointer hover:text-primary"
                    onClick={(e) => {
                      e.preventDefault()
                      onOpenDetailStudent(record.student?.id)
                    }}
                  >
                    {record?.student?.userProfile?.fullname || ""}
                  </span>
                ),
              },
              {
                title: "Ngày sinh",
                dataIndex: "dateOfBirth",
                width: 90,
                type: "date",
                align: "center",
                render: (_, record) =>
                  record?.student?.userProfile?.dateOfBirth
                    ? dayjs(record?.student?.userProfile?.dateOfBirth).format("DD/MM/YYYY")
                    : "",
              },
              {
                title: "Lớp",
                dataIndex: "fixedClassCode",
                width: 100,
                align: "center",
                type: "input",
                render: (_, record) => (
                  <Tooltip title={record.student?.fixedClass?.name}>
                    {record.student?.fixedClass?.code}
                  </Tooltip>
                ),
              },
              // #region Điểm TX
              {
                title: "Điểm TX",
                dataIndex: "attendanceScore",
                width: 100,
                align: "center",
                render: (_, record) => {
                  const readOnly =
                    role !== "GV" || score === "THI" || (disabledForm && !manualEnableLockPrint)
                  return (
                    <ScoreInputCell
                      recordId={record.id}
                      field="attendanceScore"
                      fieldType="cc"
                      isActive={activeCell === `${record.id}|attendanceScore`}
                      displayValue={rowData[record.id]?.attendanceScore ?? ""}
                      readOnly={readOnly}
                      step={0.5}
                      formFieldName={["list", record.id, "attendanceScore"]}
                      inputId={`score-cc-${record.id}`}
                      validateRule={{
                        validator: (_: unknown, value: unknown) =>
                          validateScore(
                            value as number,
                            dataDetailSubjectClass?.subject.onePoint || false
                          ),
                      }}
                      onActivate={activateCell}
                      onBlur={handleCellBlur}
                      onKeyDown={handleScoreCellKeyDown}
                      onScoreDetailClick={handleScoreDetailOpen}
                    />
                  )
                },
              },
              // #region Điểm ĐK
              {
                title: "Điểm ĐK",
                dataIndex: "midtermScore",
                width: 100,
                align: "center",
                render: (_, record) => {
                  const readOnly =
                    role !== "GV" || score === "THI" || (disabledForm && !manualEnableLockPrint)
                  return (
                    <ScoreInputCell
                      recordId={record.id}
                      field="midtermScore"
                      fieldType="tx"
                      isActive={activeCell === `${record.id}|midtermScore`}
                      displayValue={rowData[record.id]?.midtermScore ?? ""}
                      readOnly={readOnly}
                      step={0.5}
                      formFieldName={["list", record.id, "midtermScore"]}
                      inputId={`score-tx-${record.id}`}
                      validateRule={{
                        validator: (_: unknown, value: unknown) =>
                          validateScore(
                            value as number,
                            dataDetailSubjectClass?.subject.onePoint || false
                          ),
                      }}
                      onActivate={activateCell}
                      onBlur={handleCellBlur}
                      onKeyDown={handleScoreCellKeyDown}
                      onScoreDetailClick={handleScoreDetailOpen}
                    />
                  )
                },
              },
              {
                title: "Điểm thi",
                dataIndex: "examScore",
                width: 100,
                align: "center",
                render: (_, { id, attendanceScore, midtermScore, examBanned, examScore }) => {
                  const isMissingScore =
                    (attendanceScore == null || midtermScore == null) &&
                    !dataDetailSubjectClass?.subject?.onePoint
                  if (role !== "GV" || score === "TX/ĐK" || !!examBanned || isMissingScore) {
                    return examScore ?? ""
                  }
                  return (
                    <ScoreInputCell
                      recordId={id}
                      field="examScore"
                      fieldType="thi"
                      isActive={activeCell === `${id}|examScore`}
                      displayValue={rowData[id]?.examScore ?? ""}
                      readOnly={disabledForm && !manualEnableLockPrint}
                      formFieldName={["list", id, "examScore"]}
                      inputId={`score-thi-${id}`}
                      validateRule={{
                        validator: (_: unknown, value: unknown) =>
                          validateExamScore(value as number),
                      }}
                      onActivate={activateCell}
                      onBlur={handleCellBlur}
                      onKeyDown={handleScoreCellKeyDown}
                      onScoreDetailClick={handleScoreDetailOpen}
                    />
                  )
                },
              },
              {
                title: "Điểm HP",
                width: 65,
                align: "center",
                render: (_, { id }) => (
                  <span className="text-center block">
                    {rowData[id]?.finalScore != null ? String(rowData[id].finalScore) : ""}
                  </span>
                ),
              },
              {
                title: "Điểm hệ 4",
                align: "center",
                width: 70,
                render: (_, { id }) => (
                  <span className="text-center text-blue-500 block">
                    {rowData[id]?.finalScoreBase4 ?? ""}
                  </span>
                ),
              },
              {
                title: "Điểm chữ",
                align: "center",
                width: 70,
                render: (_, { id }) => (
                  <span className="text-center text-yellow-600 block">
                    {rowData[id]?.letter ?? ""}
                  </span>
                ),
              },
              {
                title: "Cấm thi",
                dataIndex: "examBanned",
                width: 65,
                align: "center",
                render: (_, record) => (
                  <Checkbox
                    checked={!!rowData[record.id]?.examBanned}
                    disabled={score === "THI" || (disabledForm && !manualEnableLockPrint)}
                    onChange={(e) => {
                      setRowData((prev) => ({
                        ...prev,
                        [record.id]: {
                          ...prev[record.id],
                          examBanned: e.target.checked,
                          examBannedReason: e.target.checked
                            ? prev[record.id]?.examBannedReason
                            : undefined,
                          isChanged: true,
                        },
                      }))
                    }}
                  />
                ),
              },
              {
                title: "Lý do cấm thi",
                dataIndex: "examBannedReason",
                width: 150,
                render: (_, record) => {
                  const examBanned = rowData[record.id]?.examBanned
                  const value = rowData[record.id]?.examBannedReason ?? undefined
                  const onChange = (val: string) =>
                    setRowData((prev) => ({
                      ...prev,
                      [record.id]: { ...prev[record.id], examBannedReason: val, isChanged: true },
                    }))
                  if (disabledForm && !manualEnableLockPrint) {
                    return (
                      <Input.TextArea
                        value={value}
                        readOnly
                        autoSize
                        variant="underlined"
                        className="bg-transparent"
                      />
                    )
                  }
                  return (
                    <AutoComplete
                      value={value}
                      onChange={onChange}
                      placeholder="Nhập lý do cấm thi"
                      options={examBanReason.map((s) => ({ label: s, value: s }))}
                      styles={{ popup: { root: { width: "fit" } } }}
                      disabled={!examBanned}
                    >
                      <Input.TextArea autoSize variant="underlined" className="bg-transparent" />
                    </AutoComplete>
                  )
                },
              },
              {
                title: "Hoãn thi",
                dataIndex: "examPostponed",
                width: 65,
                align: "center",
                render: (_, record) => (
                  <Checkbox
                    checked={!!rowData[record.id]?.examPostponed}
                    disabled={
                      (dataDetailSubjectClass?.examType === "OfflineWritten" && role !== "P13") ||
                      score === "TX/ĐK" ||
                      (disabledForm && !manualEnableLockPrint)
                    }
                    onChange={(e) => {
                      setRowData((prev) => ({
                        ...prev,
                        [record.id]: {
                          ...prev[record.id],
                          examPostponed: e.target.checked,
                          examPostponedReason: e.target.checked
                            ? prev[record.id]?.examPostponedReason
                            : undefined,
                          isChanged: true,
                        },
                      }))
                    }}
                  />
                ),
              },
              {
                title: "Lý do hoãn thi",
                dataIndex: "examPostponedReason",
                width: 200,
                render: (_, record) => {
                  const examPostponed = rowData[record.id]?.examPostponed
                  const value = rowData[record.id]?.examPostponedReason ?? undefined
                  const onChange = (val: string) =>
                    setRowData((prev) => ({
                      ...prev,
                      [record.id]: {
                        ...prev[record.id],
                        examPostponedReason: val,
                        isChanged: true,
                      },
                    }))
                  if (disabledForm && !manualEnableLockPrint) {
                    return (
                      <Input.TextArea
                        value={value}
                        readOnly
                        autoSize
                        variant="underlined"
                        className="bg-transparent"
                      />
                    )
                  }
                  return (
                    <AutoComplete
                      value={value}
                      onChange={onChange}
                      placeholder="Nhập lý do hoãn thi"
                      options={examPostponeReason.map((s) => ({ label: s, value: s }))}
                      styles={{ popup: { root: { width: "fit" } } }}
                      disabled={!examPostponed}
                    >
                      <Input.TextArea autoSize variant="underlined" className="bg-transparent" />
                    </AutoComplete>
                  )
                },
              },
              {
                title: "Đình chỉ",
                dataIndex: "suspended",
                width: 65,
                align: "center",
                render: (_, record) => (
                  <Checkbox
                    checked={!!rowData[record.id]?.suspended}
                    disabled={
                      (dataDetailSubjectClass?.examType === "OfflineWritten" && role !== "P13") ||
                      score === "TX/ĐK" ||
                      (disabledForm && !manualEnableLockPrint)
                    }
                    onChange={(e) => {
                      setRowData((prev) => ({
                        ...prev,
                        [record.id]: {
                          ...prev[record.id],
                          suspended: e.target.checked,
                          suspendedReason: e.target.checked
                            ? prev[record.id]?.suspendedReason
                            : undefined,
                          isChanged: true,
                        },
                      }))
                    }}
                  />
                ),
              },
              {
                title: "Lý do đình chỉ",
                dataIndex: "suspendedReason",
                width: 140,
                render: (_, record) => {
                  const suspended = rowData[record.id]?.suspended
                  const value = rowData[record.id]?.suspendedReason ?? undefined
                  const onChange = (val: string) =>
                    setRowData((prev) => ({
                      ...prev,
                      [record.id]: { ...prev[record.id], suspendedReason: val, isChanged: true },
                    }))
                  if (disabledForm && !manualEnableLockPrint) {
                    return (
                      <Input.TextArea
                        value={value}
                        readOnly
                        autoSize
                        variant="underlined"
                        className="bg-transparent"
                      />
                    )
                  }
                  return (
                    <AutoComplete
                      value={value}
                      onChange={onChange}
                      placeholder="Nhập lý do đình chỉ"
                      options={examSuspendedReason.map((s) => ({ label: s, value: s }))}
                      styles={{ popup: { root: { width: "fit" } } }}
                      disabled={!suspended}
                    >
                      <Input.TextArea autoSize variant="underlined" className="bg-transparent" />
                    </AutoComplete>
                  )
                },
              },
              {
                title: "Ghi chú",
                dataIndex: "description",
                width: 150,
                align: "center",
                render: (_, record) => (
                  <Input
                    value={rowData[record.id]?.description ?? undefined}
                    readOnly={disabledForm && !manualEnableLockPrint}
                    variant={disabledForm && !manualEnableLockPrint ? "borderless" : "underlined"}
                    placeholder="Nhập ghi chú"
                    style={{ width: "100%" }}
                    className="bg-transparent"
                    onChange={(e) =>
                      setRowData((prev) => ({
                        ...prev,
                        [record.id]: {
                          ...prev[record.id],
                          description: e.target.value,
                          isChanged: true,
                        },
                      }))
                    }
                  />
                ),
              },
            ]}
            data={dataTable}
            pagination={{
              pageSize: dataTable.length,
              hideOnSinglePage: true,
            }}
          />
        </Form>
      </Col>
      <div className="fixed p-3 z-[10] bottom-[30px] left-0 right-0 w-[100vw] bg-white ">
        <div>
          Bấm Tab: Chuyển ô theo hàng ngang, Mũi tên xuống: Chuyển ô theo hàng dọc, và hàng ngang
        </div>
        <div className="text-red-500 font-bold uppercase text-lg">
          Giảng viên nhập Lý do "Cấm thi", "Ghi chú" với trường hợp điểm 0 hoặc không cho điểm
        </div>
      </div>
    </Row>
  )
}
