import { queryClient } from "@api/index"
import ImportScoreModal, { type ImportScoreData } from "@components/commons/print/nhap-diem-tu-file"
import ExportScoreTemplate from "@components/commons/print/xuat-mau-nhap-diem"
import { XuatDanhSachThiButton } from "@components/commons/print/xuat-danh-sach-thi"
import { examPostponeReason, examSuspendedReason } from "@constants/constants"
import { scoreConvert } from "@hooks/scoreConverter"
import { ROUTER_PATH } from "@workspace/router"
import { isKyThiDanhPhach } from "@workspace/libs/constants"
import { calcFinalScore, getRuntimeEnv } from "@workspace/libs/utils"
import { formatDateVn, nowVn } from "@workspace/libs/timezone"
import { useSession } from "@workspace/auth/react"
import {
  useFindManySchoolYear,
  useFindManyStudentSubjectScore,
  useFindManyStudentSubjectScoreHistory,
  useFindManySubjectClass,
} from "@workspace/db/hooks"
import { $Enums } from "@workspace/db/client"
import { getUrl } from "@workspace/libs/api/custom-instance"
import { sqlTransaction } from "@workspace/libs/api/model"
import type { SqlTransactionBodyItem } from "@workspace/libs/api/schemas/sqlTransactionBodyItem"
import { getExportSubjectClassScoreUrl } from "@workspace/libs/api/training"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import {
  AutoComplete,
  Breadcrumb,
  Button,
  Checkbox,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  message,
} from "antd"
import { cn } from "@workspace/ui/lib/utils"
import dayjs from "dayjs"
import {
  ArrowLeft,
  Ban,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleSlash2,
  ClipboardCheck,
  FileUp,
  GraduationCap,
  Hash,
  History,
  Printer,
  RefreshCcw,
  RotateCcw,
  Save,
} from "lucide-react"
import { useRouter } from "next/router"
import { useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type RowData = {
  id: string
  mssv: string
  hoTen: string
  attendanceScore: number | null
  midtermScore: number | null
  examScore: number | null
  finalScore: number | null
  letter: string
  description: string
  examBanned: boolean
  examBannedReason: string
  examPostponed: boolean
  examPostponedReason: string
  suspended: boolean
  suspendedReason: string
  isChanged: boolean
}

const CHIEU_CAO_HEADER_BANG = 39

const HE_SO_MAC_DINH = {
  coef_1: 0.1,
  coef_2: 0.3,
  coef_3: 0.6,
  scoreToTakeExam: 4,
  scoreToPass: 5,
  maxReExamScore: 5,
  reduceReExamScore: 0,
  examScoreToPass: 4,
} as const

const TheThongKeNgang = ({
  icon,
  tieuDe,
  giaTri,
  tyLe,
  tone = "blue",
  onClick,
}: {
  icon: ReactNode
  tieuDe: string
  giaTri: string
  tyLe?: string
  tone?: "green" | "yellow" | "blue" | "teal" | "red"
  onClick?: () => void
}) => {
  const toneClass =
    tone === "green"
      ? "bg-[#e8f7ef] text-[#16a34a]"
      : tone === "yellow"
        ? "bg-[#fff4dd] text-[#f59e0b]"
        : tone === "teal"
          ? "bg-[#e8faf7] text-[#14b8a6]"
          : tone === "red"
            ? "bg-[#ffe9e9] text-[#ef4444]"
            : "bg-[#eaf3ff] text-[#3b82f6]"

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[84px] items-center gap-2 rounded-lg border border-gray-100 bg-white px-2.5 py-2 text-left",
        onClick && "transition-colors hover:border-cgv-green/35 hover:bg-cgv-green/5"
      )}
    >
      <span
        className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full", toneClass)}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[10px] font-semibold text-gray-500">{tieuDe}</div>
        <div className="mt-1 flex items-end gap-1.5">
          <span className="text-[24px] font-bold leading-[22px] text-cgv-green-dark">{giaTri}</span>
          {tyLe ? (
            <span className="pb-0.5 text-[10px] font-semibold text-gray-500">{tyLe}</span>
          ) : null}
        </div>
      </div>
    </button>
  )
}

const TheThongTinLopHang = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) => (
  <div className="flex items-center gap-2 text-[13px] leading-7">
    <span className="inline-flex h-4 w-4 items-center justify-center text-cgv-green-dark/80">
      {icon}
    </span>
    <span className="shrink-0 text-gray-500">{label}</span>
    <span className="truncate font-semibold text-gray-900">{value}</span>
  </div>
)

const NhapDiemThiGiangDayPage = () => {
  const router = useRouter()
  const lopIdMacDinh = router.query.lopId as string | undefined
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId ?? ""
  const { id: semesterId, onSelect } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const [monHocId, setMonHocId] = useState<string | undefined>()
  const [lopId, setLopId] = useState<string | undefined>(lopIdMacDinh)
  const [rows, setRows] = useState<RowData[]>([])
  const [historyTarget, setHistoryTarget] = useState<{ id: string; hoTen: string } | null>(null)
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [dongFocusIds, setDongFocusIds] = useState<string[]>([])
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoBody, setChieuCaoBody] = useState(320)

  const { onOpen: openXemTaiLieu } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string
    mode?: "view" | "edit"
    convertTo?: string
  }>({
    tag: "XemTaiLieu",
  })

  useEffect(() => {
    const el = vungBangRef.current
    if (!el) return

    const capNhatChieuCao = () => {
      setChieuCaoBody(Math.max(160, el.clientHeight - CHIEU_CAO_HEADER_BANG))
    }

    capNhatChieuCao()
    const observer = new ResizeObserver(capNhatChieuCao)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { data: schoolYears = [], isLoading: dangTaiNamHoc } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
    include: { semesters: { orderBy: { createdAt: "desc" } } },
  })

  const { data: dsLop = [], isLoading: dangTaiLop } = useFindManySubjectClass(
    {
      where: {
        cancelled: false,
        deletedAt: null,
        active: true,
        mainLecturer: { userProfileId: profileId },
        semesterId,
        trainingObjectTypeId,
      },
      include: { subject: { select: { id: true, name: true } } },
      orderBy: [{ code: "asc" }],
    },
    { enabled: !!profileId && !!semesterId && !!trainingObjectTypeId }
  )

  const selectedYearId = useMemo(
    () => schoolYears.find((year) => year.semesters.some((s) => s.id === semesterId))?.id,
    [schoolYears, semesterId]
  )

  const semestersOfYear = useMemo(
    () => schoolYears.find((year) => year.id === selectedYearId)?.semesters ?? [],
    [schoolYears, selectedYearId]
  )

  const monHocOptions = useMemo(() => {
    const map = new Map<string, string>()
    dsLop.forEach((lop) => {
      if (lop.subject?.id) map.set(lop.subject.id, lop.subject.name ?? "")
    })
    return Array.from(map, ([value, label]) => ({ value, label }))
  }, [dsLop])

  const lopOptions = useMemo(
    () =>
      dsLop
        .filter((lop) => !monHocId || lop.subject?.id === monHocId)
        .map((lop) => ({ value: lop.id, label: lop.code ?? "" })),
    [dsLop, monHocId]
  )

  useEffect(() => {
    if (monHocOptions.length === 0) return
    if (monHocId && monHocOptions.some((o) => o.value === monHocId)) return
    const lopMacDinh = lopIdMacDinh ? dsLop.find((lop) => lop.id === lopIdMacDinh) : undefined
    setMonHocId(lopMacDinh?.subject?.id ?? monHocOptions[0]?.value)
  }, [monHocId, monHocOptions, dsLop, lopIdMacDinh])

  useEffect(() => {
    if (lopOptions.length === 0) return
    if (lopId && lopOptions.some((o) => o.value === lopId)) return
    setLopId(lopOptions[0]?.value)
  }, [lopId, lopOptions])

  const { data: subjectClass, refetch: refetchSubjectClass } = useFindManySubjectClass(
    {
      where: { id: lopId },
      include: {
        semester: { include: { schoolYear: true } },
        subject: true,
        mainLecturer: { include: { userProfile: { select: { fullname: true } } } },
        classSchedules: { include: { room: true }, take: 1 },
        _count: { select: { subjectClassStudent: true } },
        exam: {
          select: {
            id: true,
            lockExamSessions: true,
            examRooms: {
              select: {
                examList: {
                  select: {
                    id: true,
                    createdExamCode: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 1,
    },
    { enabled: !!lopId }
  )

  const lopMonHoc = subjectClass?.[0]

  const coTheXuatDanhSachThi =
    !!lopMonHoc?.exam?.id &&
    (lopMonHoc.exam.examRooms?.some((room) => (room.examList?.length ?? 0) > 0) ?? false)

  // Chỉ thi viết đi luồng đánh phách. Vấn đáp / thực hành vẫn khoá DS thi rồi nhập điểm bình thường.
  const laKyThiDanhPhach = useMemo(
    () => isKyThiDanhPhach(lopMonHoc?.examType, lopMonHoc?.exam),
    [lopMonHoc]
  )

  // Chỉ enable nhập khi KHÔNG phải kỳ thi đánh phách và chưa khóa điểm
  const disabledForm = useMemo(() => {
    if (!lopMonHoc) return true
    const daKhoaDiem = !!lopMonHoc.isLockExamScore || !!lopMonHoc.scoreSubmitted
    const quaHan =
      !!lopMonHoc.examScoreDeadline && nowVn().isAfter(dayjs(lopMonHoc.examScoreDeadline))
    return laKyThiDanhPhach || daKhoaDiem || quaHan
  }, [lopMonHoc, laKyThiDanhPhach])

  const khoaNhapDiem = disabledForm

  const daKhoaDiem = !!lopMonHoc?.isLockExamScore || !!lopMonHoc?.scoreSubmitted
  const coTheInPhieuDiem = !!lopId && daKhoaDiem

  const { data: scoreRows = [], refetch } = useFindManyStudentSubjectScore(
    {
      where: { subjectClassId: lopId ?? "" },
      include: {
        subjectClass: { select: { type: true } },
        student: {
          include: {
            userProfile: { select: { fullname: true, dateOfBirth: true } },
            fixedClass: {
              include: {
                trainingCourse: { include: { scoreConverts: true } },
              },
            },
          },
        },
      },
      orderBy: [{ student: { userProfile: { firstName: "asc" } } }],
    },
    { enabled: !!lopId }
  )

  const { data: lichSuDiem = [], isLoading: dangTaiLichSu } = useFindManyStudentSubjectScoreHistory(
    {
      where: { studentSubjectScoreId: historyTarget?.id },
      include: { updatedBy: { select: { fullname: true } } },
      orderBy: { createdAt: "desc" },
    },
    { enabled: !!historyTarget?.id }
  )

  useEffect(() => {
    setDongFocusIds([])
    const mapped: RowData[] = scoreRows.map((r) => ({
      // Khi refetch sau lưu, cần tính lại điểm chữ từ điểm HP hiện có,
      // nếu không cột điểm chữ sẽ bị rỗng do chỉ lưu ở state.
      ...(function () {
        const trainingCourse = r.student?.fixedClass?.trainingCourse
        const finalScore = r.finalScore != null ? Number(r.finalScore) : null
        const convert =
          finalScore != null ? scoreConvert(finalScore, trainingCourse?.scoreConverts ?? []) : null
        return {
          finalScore,
          letter: convert?.letter ?? "",
        }
      })(),
      id: r.id,
      mssv: r.student?.code ?? "",
      hoTen: r.student?.userProfile?.fullname ?? "",
      attendanceScore: r.attendanceScore ?? null,
      midtermScore: r.midtermScore ?? null,
      examScore: r.examScore ?? null,
      description: r.description ?? "",
      examBanned: r.examBanned ?? false,
      examBannedReason: r.examBannedReason ?? "",
      examPostponed: r.examPostponed ?? false,
      examPostponedReason: r.examPostponedReason ?? "",
      suspended: r.suspended ?? false,
      suspendedReason: r.suspendedReason ?? "",
      isChanged: false,
    }))
    setRows(mapped)
  }, [scoreRows])

  type PatchDiemThi = Partial<
    Pick<
      RowData,
      | "examScore"
      | "description"
      | "examPostponed"
      | "examPostponedReason"
      | "suspended"
      | "suspendedReason"
    >
  >

  const tinhDongSauCapNhat = (row: RowData, patch: PatchDiemThi): RowData => {
    const next = { ...row, ...patch }
    const goc = scoreRows.find((x) => x.id === row.id)
    const trainingCourse = goc?.student?.fixedClass?.trainingCourse
    const finalScoreTinhToan =
      next.attendanceScore == null || next.midtermScore == null || next.examScore == null
        ? null
        : calcFinalScore(
            trainingCourse ?? HE_SO_MAC_DINH,
            {
              attendanceScore: next.attendanceScore,
              midtermScore: next.midtermScore,
              examScore: next.examScore,
              certificates: [],
              awards: [],
            },
            goc?.subjectClass?.type ?? $Enums.SubjectClassType.NORMAL
          )
    const finalScore = next.examBanned
      ? 0
      : finalScoreTinhToan != null
        ? Number(finalScoreTinhToan)
        : null
    const convert =
      finalScore != null ? scoreConvert(finalScore, trainingCourse?.scoreConverts ?? []) : null

    return {
      ...next,
      finalScore,
      letter: convert?.letter ?? "",
      isChanged: true,
    }
  }

  const handleImportConfirm = (data: ImportScoreData[]) => {
    const importMap = new Map(data.map((item) => [item.id, item]))
    setRows((prev) =>
      prev.map((row) => {
        const imported = importMap.get(row.id)
        if (!imported || row.examBanned) return row
        return tinhDongSauCapNhat(row, { examScore: imported.examScore })
      })
    )
    message.success("Nhập điểm từ file thành công!")
  }

  const capNhatDong = (id: string, patch: PatchDiemThi) => {
    setRows((prev) => prev.map((row) => (row.id === id ? tinhDongSauCapNhat(row, patch) : row)))
  }

  const thongKe = useMemo(() => {
    const tong = rows.length
    const daNhap = rows.filter((r) => r.examScore != null).length
    const chuaNhap = tong - daNhap
    const finals = rows.map((r) => r.finalScore).filter((v): v is number => v != null)

    const max = finals.length ? Math.max(...finals) : null
    const min = finals.length ? Math.min(...finals) : null
    const idsMax = max == null ? [] : rows.filter((r) => r.finalScore === max).map((r) => r.id)
    const idsMin = min == null ? [] : rows.filter((r) => r.finalScore === min).map((r) => r.id)

    return {
      tong,
      daNhap,
      chuaNhap,
      diemTb: finals.length ? finals.reduce((sum, v) => sum + v, 0) / finals.length : null,
      max,
      min,
      idsMax,
      idsMin,
    }
  }, [rows])

  const focusNhieuDongBang = (ids: string[]) => {
    if (ids.length === 0) return
    setDongFocusIds(ids)
    requestAnimationFrame(() => {
      const rowEl = vungBangRef.current?.querySelector<HTMLElement>(`tr[data-row-key="${ids[0]}"]`)
      rowEl?.scrollIntoView({ block: "center", behavior: "smooth" })
    })
  }

  const luu = async () => {
    if (khoaNhapDiem) {
      message.warning("Không thể lưu: lớp đã khóa nhập điểm hoặc chưa đủ điều kiện")
      return
    }

    Modal.confirm({
      title: "Xác nhận",
      content: "Bạn có chắc chắn muốn lưu điểm không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        const changed = rows.filter((r) => r.isChanged)
        if (changed.length === 0) {
          message.info("Không có thay đổi để lưu")
          return
        }

        if (changed.some((r) => r.examPostponed && !r.examPostponedReason)) {
          message.error("Vui lòng nhập lý do hoãn thi")
          return
        }
        if (changed.some((r) => r.suspended && !r.suspendedReason)) {
          message.error("Vui lòng nhập lý do đình chỉ")
          return
        }

        const allHaveExamScore = rows.every(
          (r) => r.examBanned || r.examPostponed || r.suspended || r.examScore != null
        )

        const tx: SqlTransactionBodyItem[] = [
          {
            model: "SubjectClass",
            operation: "update",
            data: {
              where: { id: lopId },
              data: { enteredExamScore: allHaveExamScore },
            },
          },
          ...changed.map((r) => ({
            model: "StudentSubjectScore" as const,
            operation: "update" as const,
            data: {
              where: { id: r.id },
              data: {
                examScore: r.examScore,
                finalScore: r.finalScore,
                description: r.description || null,
                examPostponed: r.examPostponed,
                examPostponedReason: r.examPostponedReason || null,
                suspended: r.suspended,
                suspendedReason: r.suspendedReason || null,
              },
            },
          })),
          {
            model: "StudentSubjectScoreHistory" as const,
            operation: "createMany" as const,
            data: {
              data: changed.map((r) => ({
                studentSubjectScoreId: r.id,
                attendanceScore: r.attendanceScore,
                midtermScore: r.midtermScore,
                examScore: r.examScore,
                finalScore: r.finalScore,
                description: r.description || null,
                examBanned: r.examBanned,
                examBannedReason: r.examBannedReason || null,
                examPostponed: r.examPostponed,
                examPostponedReason: r.examPostponedReason || null,
                suspended: r.suspended,
                suspendedReason: r.suspendedReason || null,
                updatedById: profileId,
              })),
            },
          },
        ]

        try {
          await sqlTransaction(tx)
          message.success("Lưu điểm thi thành công")
          await refetch()
          await refetchSubjectClass()
          queryClient.invalidateQueries({ queryKey: ["zenstack", "SubjectClass"] })
        } catch {
          message.error("Lưu điểm thất bại")
        }
      },
    })
  }

  const handleInPhieuDiem = () => {
    if (!lopId) {
      message.warning("Vui lòng chọn lớp học trước khi in")
      return
    }
    if (!daKhoaDiem) {
      message.warning("Chỉ được in phiếu điểm khi lớp đã được khoá điểm")
      return
    }
    const baseUrl =
      getRuntimeEnv("NEXT_PUBLIC_API_LMS_BASE_URL") || "https://api.daotao.mta.swantech.vn"
    const exportUrl = getExportSubjectClassScoreUrl({
      id: lopId,
      role: "GV",
      userId: profileId || undefined,
    })
    openXemTaiLieu({
      uri: getUrl(baseUrl, exportUrl),
      name: "Phiếu điểm",
      mimeType: "xlsx",
    })
  }

  const handleInPhieuDiemNhap = () => {
    if (!lopId) {
      message.warning("Vui lòng chọn lớp học trước khi in")
      return
    }
    const baseUrl =
      getRuntimeEnv("NEXT_PUBLIC_API_LMS_BASE_URL") || "https://api.daotao.mta.swantech.vn"
    const exportUrl = getExportSubjectClassScoreUrl({
      id: lopId,
      type: "NHAP",
      role: "GV",
      userId: profileId || undefined,
    })
    openXemTaiLieu({
      uri: getUrl(baseUrl, exportUrl),
      name: "Phiếu điểm nháp",
      mimeType: "xlsx",
    })
  }

  return (
    <div className="flex h-[calc(100vh-112px)] flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              router.push(ROUTER_PATH.CONG_GIANG_VIEN.LOP_GIANG_DAY_DANH_SACH_LOP_GIANG_DAY)
            }
            className="flex h-8 w-8 items-center justify-center rounded text-cgv-green-dark hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="m-0 text-xl font-bold uppercase tracking-wide text-cgv-green-dark">
            Nhập điểm thi
          </h1>
        </div>
        <Breadcrumb>
          <Breadcrumb.Item href="/" className="text-sm">
            Trang chủ
          </Breadcrumb.Item>
          <Breadcrumb.Item
            href={ROUTER_PATH.CONG_GIANG_VIEN.LOP_GIANG_DAY_DANH_SACH_LOP_GIANG_DAY}
            className="text-sm"
          >
            Giảng dạy
          </Breadcrumb.Item>
          <Breadcrumb.Item className="text-sm">Nhập điểm thi</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <div>
            <div className="mb-1 text-xs text-gray-500">Năm học</div>
            <Select
              loading={dangTaiNamHoc}
              value={selectedYearId}
              onChange={(yearId) => {
                const year = schoolYears.find((item) => item.id === yearId)
                const firstSemester = year?.semesters?.[0]
                if (firstSemester) onSelect(firstSemester.id)
              }}
              options={schoolYears.map((year) => ({ value: year.id, label: year.name }))}
              className="w-full"
            />
          </div>
          <div>
            <div className="mb-1 text-xs text-gray-500">Học kỳ</div>
            <Select
              value={semesterId}
              onChange={onSelect}
              options={semestersOfYear.map((semester) => ({
                value: semester.id,
                label: semester.name,
              }))}
              className="w-full"
            />
          </div>
          <div>
            <div className="mb-1 text-xs text-gray-500">Lớp</div>
            <Select
              loading={dangTaiLop}
              value={lopId}
              onChange={(value) => setLopId(value)}
              options={lopOptions}
              className="w-full"
            />
          </div>
          <div>
            <div className="mb-1 text-xs text-gray-500">Môn học</div>
            <Select
              loading={dangTaiLop}
              value={monHocId}
              onChange={(value) => {
                setMonHocId(value)
                setLopId(undefined)
              }}
              options={monHocOptions}
              className="w-full"
            />
          </div>
          <div className="flex items-end justify-end gap-2">
            <Button icon={<RefreshCcw size={14} />} onClick={() => refetch()}>
              Tải dữ liệu
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-3">
        <div className="overflow-hidden rounded-lg border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,auto)_minmax(0,1fr)]">
            <div className="border-b border-gray-100 bg-gray-50/70 px-3 py-2 lg:border-b-0 lg:border-r">
              <div className="space-y-0.5">
                <TheThongTinLopHang
                  icon={<Hash size={14} />}
                  label="Mã lớp:"
                  value={lopMonHoc?.code ?? "—"}
                />
                <TheThongTinLopHang
                  icon={<GraduationCap size={14} />}
                  label="Tín chỉ:"
                  value={String(lopMonHoc?.subject?.credit ?? "—")}
                />
                <TheThongTinLopHang
                  icon={<CalendarClock size={14} />}
                  label="Hạn nhập điểm:"
                  value={
                    lopMonHoc?.examScoreDeadline
                      ? formatDateVn(lopMonHoc.examScoreDeadline)
                      : "—"
                  }
                />
              </div>
            </div>

            <div className="bg-white p-1.5">
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-5">
                <TheThongKeNgang
                  icon={<ClipboardCheck size={18} />}
                  tieuDe="Đã nhập"
                  giaTri={String(thongKe.daNhap)}
                  tyLe={`${thongKe.tong ? Math.round((thongKe.daNhap / thongKe.tong) * 100) : 0}%`}
                  tone="green"
                />
                <TheThongKeNgang
                  icon={<CircleSlash2 size={18} />}
                  tieuDe="Chưa nhập"
                  giaTri={String(thongKe.chuaNhap)}
                  tyLe={`${thongKe.tong ? Math.round((thongKe.chuaNhap / thongKe.tong) * 100) : 0}%`}
                  tone="yellow"
                />
                <TheThongKeNgang
                  icon={<GraduationCap size={18} />}
                  tieuDe="Điểm HP trung bình"
                  giaTri={thongKe.diemTb != null ? thongKe.diemTb.toFixed(2) : "—"}
                  tyLe="/10"
                  tone="blue"
                />
                <TheThongKeNgang
                  icon={<CheckCircle2 size={18} />}
                  tieuDe="Điểm HP cao nhất"
                  giaTri={thongKe.max != null ? thongKe.max.toFixed(1) : "—"}
                  tyLe={`${thongKe.idsMax.length} sinh viên`}
                  tone="teal"
                  onClick={() => focusNhieuDongBang(thongKe.idsMax)}
                />
                <TheThongKeNgang
                  icon={<Ban size={18} />}
                  tieuDe="Điểm HP thấp nhất"
                  giaTri={thongKe.min != null ? thongKe.min.toFixed(1) : "—"}
                  tyLe={`${thongKe.idsMin.length} sinh viên`}
                  tone="red"
                  onClick={() => focusNhieuDongBang(thongKe.idsMin)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-100 bg-white p-3">
        <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="text-sm font-semibold text-cgv-green-dark">BẢNG NHẬP ĐIỂM THI</span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              icon={<FileUp size={14} />}
              onClick={() => setImportModalVisible(true)}
              disabled={!lopId || rows.length === 0 || khoaNhapDiem}
            >
              Nhập điểm từ file
            </Button>
            <ExportScoreTemplate
              selectedSubjectClass={lopId}
              subjectClass={lopMonHoc}
              dataTable={scoreRows}
              type="THI"
              disabled={khoaNhapDiem}
            />
            <Button
              icon={<Printer size={14} />}
              disabled={!coTheInPhieuDiem}
              onClick={handleInPhieuDiem}
            >
              In phiếu điểm
            </Button>
            <Button
              icon={<Printer size={14} />}
              disabled={!lopId}
              onClick={handleInPhieuDiemNhap}
            >
              In phiếu điểm nháp
            </Button>
            <Button
              type="primary"
              icon={<Save size={14} />}
              onClick={luu}
              disabled={khoaNhapDiem}
            >
              Lưu
            </Button>
            <XuatDanhSachThiButton
              examId={lopMonHoc?.exam?.id}
              examName={[lopMonHoc?.subject?.name, lopMonHoc?.code].filter(Boolean).join(" - ")}
              disabled={!coTheXuatDanhSachThi}
            />
          </div>
        </div>
        <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden">
          <Table<RowData>
            rowKey="id"
            pagination={false}
            size="small"
            dataSource={rows}
            scroll={{ x: "max-content", y: chieuCaoBody }}
            onRow={(record) => ({
              className: dongFocusIds.includes(record.id)
                ? "[&>td]:!bg-cgv-green/35 [&>td]:!transition-colors"
                : record.examBanned || record.suspended
                  ? "[&>td]:!bg-red-100"
                  : record.examPostponed
                    ? "[&>td]:!bg-yellow-100"
                    : undefined,
            })}
            columns={[
              { title: "STT", width: 56, align: "center", render: (_v, _r, i) => i + 1 },
              { title: "MÃ SV", dataIndex: "mssv", width: 100, align: "center" },
              { title: "Họ và tên", dataIndex: "hoTen", width: 180 },
              {
                title: "Chuyên cần",
                dataIndex: "attendanceScore",
                width: 120,
                align: "center",
                render: (v) => <Input value={v ?? ""} disabled />,
              },
              {
                title: "Định kỳ",
                dataIndex: "midtermScore",
                width: 120,
                align: "center",
                render: (v) => <Input value={v ?? ""} disabled />,
              },
              {
                title: "Điểm thi",
                dataIndex: "examScore",
                width: 120,
                align: "center",
                render: (value, row) =>
                  row.examBanned ? (
                    <span className="font-semibold text-red-500">Cấm thi</span>
                  ) : (
                    <InputNumber
                      value={value ?? undefined}
                      min={0}
                      max={10}
                      step={0.5}
                      disabled={khoaNhapDiem}
                      onChange={(v) => capNhatDong(row.id, { examScore: Number(v) })}
                      className="w-full"
                    />
                  ),
              },
              {
                title: "Điểm HP",
                dataIndex: "finalScore",
                width: 100,
                align: "center",
                render: (v) => v ?? "",
              },
              { title: "Điểm chữ", dataIndex: "letter", width: 100, align: "center" },
              {
                title: "Lý do cấm thi",
                dataIndex: "examBannedReason",
                width: 180,
                render: (v, row) => (row.examBanned ? v || "—" : ""),
              },
              {
                title: "Hoãn thi",
                dataIndex: "examPostponed",
                width: 80,
                align: "center",
                render: (value, row) => (
                  <Checkbox
                    checked={!!value}
                    disabled={khoaNhapDiem || row.examBanned}
                    onChange={(e) =>
                      capNhatDong(row.id, {
                        examPostponed: e.target.checked,
                        examPostponedReason: e.target.checked ? row.examPostponedReason : "",
                      })
                    }
                  />
                ),
              },
              {
                title: "Lý do hoãn thi",
                dataIndex: "examPostponedReason",
                width: 200,
                render: (value, row) => (
                  <AutoComplete
                    value={value || undefined}
                    onChange={(v: string) => capNhatDong(row.id, { examPostponedReason: v })}
                    placeholder="Nhập lý do hoãn thi"
                    options={examPostponeReason.map((s) => ({ label: s, value: s }))}
                    disabled={!row.examPostponed || khoaNhapDiem}
                    className="w-full"
                  >
                    <Input.TextArea autoSize />
                  </AutoComplete>
                ),
              },
              {
                title: "Đình chỉ",
                dataIndex: "suspended",
                width: 80,
                align: "center",
                render: (value, row) => (
                  <Checkbox
                    checked={!!value}
                    disabled={khoaNhapDiem || row.examBanned}
                    onChange={(e) =>
                      capNhatDong(row.id, {
                        suspended: e.target.checked,
                        suspendedReason: e.target.checked ? row.suspendedReason : "",
                      })
                    }
                  />
                ),
              },
              {
                title: "Lý do đình chỉ",
                dataIndex: "suspendedReason",
                width: 200,
                render: (value, row) => (
                  <AutoComplete
                    value={value || undefined}
                    onChange={(v: string) => capNhatDong(row.id, { suspendedReason: v })}
                    placeholder="Nhập lý do đình chỉ"
                    options={examSuspendedReason.map((s) => ({ label: s, value: s }))}
                    disabled={!row.suspended || khoaNhapDiem}
                    className="w-full"
                  >
                    <Input.TextArea autoSize />
                  </AutoComplete>
                ),
              },
              {
                title: "Ghi chú",
                dataIndex: "description",
                render: (value, row) => (
                  <div className="flex items-center gap-2">
                    <Input
                      value={value}
                      onChange={(e) => capNhatDong(row.id, { description: e.target.value })}
                      disabled={khoaNhapDiem}
                    />
                    <Button
                      type="text"
                      icon={<History size={14} />}
                      title="Lịch sử chỉnh sửa"
                      onClick={() => setHistoryTarget({ id: row.id, hoTen: row.hoTen })}
                    />
                    <Button
                      type="text"
                      icon={<RotateCcw size={14} />}
                      title="Đặt lại dòng điểm"
                      disabled={khoaNhapDiem}
                      onClick={() =>
                        capNhatDong(row.id, {
                          examScore: null,
                          description: "",
                          examPostponed: false,
                          examPostponedReason: "",
                          suspended: false,
                          suspendedReason: "",
                        })
                      }
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      <ImportScoreModal
        visible={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onConfirm={handleImportConfirm}
        existingStudents={scoreRows}
        scoreType="THI"
      />

      <Modal
        title={`Lịch sử chỉnh sửa điểm${historyTarget ? ` - ${historyTarget.hoTen}` : ""}`}
        open={!!historyTarget}
        onCancel={() => setHistoryTarget(null)}
        footer={null}
        width={980}
      >
        <Table
          rowKey="id"
          size="small"
          loading={dangTaiLichSu}
          dataSource={lichSuDiem}
          pagination={false}
          scroll={{ y: 420 }}
          columns={[
            {
              title: "Thời gian",
              width: 160,
              render: (_v, r) => dayjs(r.createdAt).format("DD/MM/YYYY HH:mm:ss"),
            },
            {
              title: "Người chỉnh sửa",
              width: 180,
              render: (_v, r) => r.updatedBy?.fullname ?? "—",
            },
            {
              title: "Chuyên cần",
              dataIndex: "attendanceScore",
              align: "center",
              width: 100,
              render: (v) => v ?? "",
            },
            {
              title: "Định kỳ",
              dataIndex: "midtermScore",
              align: "center",
              width: 100,
              render: (v) => v ?? "",
            },
            {
              title: "Điểm thi",
              dataIndex: "examScore",
              align: "center",
              width: 100,
              render: (v) => v ?? "",
            },
            {
              title: "Điểm HP",
              dataIndex: "finalScore",
              align: "center",
              width: 100,
              render: (v) => (v != null ? Number(v).toFixed(1) : ""),
            },
            {
              title: "Trạng thái",
              width: 180,
              render: (_v, r) =>
                [
                  r.examBanned && `Cấm thi: ${r.examBannedReason || "—"}`,
                  r.examPostponed && `Hoãn thi: ${r.examPostponedReason || "—"}`,
                  r.suspended && `Đình chỉ: ${r.suspendedReason || "—"}`,
                ]
                  .filter(Boolean)
                  .join("; "),
            },
            { title: "Ghi chú", dataIndex: "description", render: (v) => v || "" },
          ]}
        />
      </Modal>
    </div>
  )
}

export default NhapDiemThiGiangDayPage
