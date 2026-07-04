import ImportScoreModal, { type ImportScoreData } from "@components/commons/print/nhap-diem-tu-file"
import ExportScoreTemplate from "@components/commons/print/xuat-mau-nhap-diem"
import { scoreConvert } from "@hooks/scoreConverter"
import { ROUTER_PATH } from "@workspace/router"
import { calcFinalScore } from "@workspace/libs/utils"
import { useSession } from "@workspace/auth/react"
import {
  useFindManySchoolYear,
  useFindManyStudentSubjectScoreHistory,
  useFindManyStudentSubjectScore,
  useFindManySubjectClass,
} from "@workspace/db/hooks"
import { $Enums } from "@workspace/db/client"
import { sqlTransaction } from "@workspace/libs/api/model"
import type { SqlTransactionBodyItem } from "@workspace/libs/api/schemas/sqlTransactionBodyItem"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Breadcrumb, Button, Input, InputNumber, Modal, Select, Table, message } from "antd"
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
  RefreshCcw,
  RotateCcw,
  Save,
} from "lucide-react"
import { useRouter } from "next/router"
import { useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"

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

type ScoreRowGoc = {
  id: string
  student?: {
    fixedClass?: {
      trainingCourse?: {
        coef_1: number
        coef_2: number
      } | null
    } | null
  } | null
}

const tinhDiemQT = (row: RowData, goc?: ScoreRowGoc): number | null => {
  if (row.attendanceScore == null || row.midtermScore == null) return null
  if (row.finalScore != null) return row.finalScore
  const tc = goc?.student?.fixedClass?.trainingCourse ?? HE_SO_MAC_DINH
  return Number((row.attendanceScore * tc.coef_1 + row.midtermScore * tc.coef_2).toFixed(1))
}

const TheThongKeNgang = ({
  icon,
  tieuDe,
  giaTri,
  tyLe,
  tone = "blue",
}: {
  icon: ReactNode
  tieuDe: string
  giaTri: string
  tyLe?: string
  tone?: "green" | "yellow" | "blue" | "teal" | "red"
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
    <div className="flex h-[84px] items-center gap-2 rounded-lg border border-gray-100 bg-white px-2.5 py-2">
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
    </div>
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
    <span className="whitespace-nowrap font-semibold text-gray-900">{value}</span>
  </div>
)

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
  isChanged: boolean
}

const NhapDiemQuaTrinhGiangDayPage = () => {
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
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoBody, setChieuCaoBody] = useState(320)

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

  const { data: schoolYears = [] } = useFindManySchoolYear({
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

  const semesterOptions = useMemo(
    () =>
      schoolYears.flatMap((year) =>
        year.semesters.map((semester) => ({
          value: semester.id,
          label: `${year.name} ${semester.name}`,
        }))
      ),
    [schoolYears]
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

  const handleChangeMonHoc = (value?: string) => {
    setMonHocId(value)
    setLopId(undefined)
  }

  const { data: subjectClass } = useFindManySubjectClass(
    {
      where: { id: lopId },
      include: {
        semester: { include: { schoolYear: true } },
        subject: true,
        mainLecturer: { include: { userProfile: { select: { fullname: true } } } },
        classSchedules: { include: { room: true }, take: 1 },
        _count: { select: { subjectClassStudent: true } },
      },
      take: 1,
    },
    { enabled: !!lopId }
  )

  const lopMonHoc = subjectClass?.[0]
  const quaHanNhapDiemQuaTrinh = useMemo(() => {
    if (!lopMonHoc?.scoreDeadline) return false
    return dayjs().isAfter(dayjs(lopMonHoc.scoreDeadline))
  }, [lopMonHoc?.scoreDeadline])

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
      include: {
        updatedBy: { select: { fullname: true } },
      },
      orderBy: { createdAt: "desc" },
    },
    { enabled: !!historyTarget?.id }
  )

  useEffect(() => {
    const mapped: RowData[] = scoreRows.map((r) => ({
      // Sau khi refetch (ví dụ vừa lưu), tính lại điểm chữ từ điểm HP
      // để không bị rỗng cột "Điểm chữ".
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
      isChanged: false,
    }))
    setRows(mapped)
  }, [scoreRows])

  const tinhDongSauCapNhat = (
    row: RowData,
    patch: Partial<Pick<RowData, "attendanceScore" | "midtermScore" | "description">>
  ): RowData => {
    const next = { ...row, ...patch }
    const goc = scoreRows.find((x) => x.id === row.id)
    const trainingCourse = goc?.student?.fixedClass?.trainingCourse
    const finalScore =
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
    const convert =
      finalScore != null
        ? scoreConvert(Number(finalScore), trainingCourse?.scoreConverts ?? [])
        : null

    return {
      ...next,
      finalScore: finalScore != null ? Number(finalScore) : null,
      letter: convert?.letter ?? "",
      isChanged: true,
    }
  }

  const handleImportConfirm = (data: ImportScoreData[]) => {
    const importMap = new Map(data.map((item) => [item.id, item]))
    setRows((prev) =>
      prev.map((row) => {
        const imported = importMap.get(row.id)
        if (!imported) return row
        return tinhDongSauCapNhat(row, {
          attendanceScore: imported.attendanceScore,
          midtermScore: imported.midtermScore,
        })
      })
    )
    message.success("Nhập điểm từ file thành công!")
  }

  const capNhatDong = (
    id: string,
    patch: Partial<Pick<RowData, "attendanceScore" | "midtermScore" | "description">>
  ) => {
    setRows((prev) => prev.map((row) => (row.id === id ? tinhDongSauCapNhat(row, patch) : row)))
  }

  const thongKe = useMemo(() => {
    const tong = rows.length
    const daNhap = rows.filter((r) => r.attendanceScore != null && r.midtermScore != null).length
    const rowsWithQT = rows
      .map((row) => {
        const goc = scoreRows.find((x) => x.id === row.id)
        const diem = tinhDiemQT(row, goc)
        return diem == null
          ? null
          : { row, diem, duDieuKienThi: diem >= HE_SO_MAC_DINH.scoreToTakeExam }
      })
      .filter(
        (item): item is { row: RowData; diem: number; duDieuKienThi: boolean } => item != null
      )

    if (rowsWithQT.length === 0) {
      return {
        tong,
        daNhap,
        chuaNhap: tong - daNhap,
        max: null as number | null,
        min: null as number | null,
        diemTb: null as number | null,
        duDieuKienThi: 0,
        camThi: 0,
      }
    }

    const sorted = [...rowsWithQT].sort((a, b) => b.diem - a.diem)
    const maxItem = sorted[0]
    const minItem = sorted[sorted.length - 1]
    const tongDiem = rowsWithQT.reduce((sum, item) => sum + item.diem, 0)
    const duDieuKienThi = rowsWithQT.filter((item) => item.duDieuKienThi).length
    const camThi = rowsWithQT.length - duDieuKienThi

    return {
      tong,
      daNhap,
      chuaNhap: tong - daNhap,
      max: maxItem.diem,
      min: minItem.diem,
      diemTb: tongDiem / rowsWithQT.length,
      duDieuKienThi,
      camThi,
    }
  }, [rows, scoreRows])

  const luu = async () => {
    if (quaHanNhapDiemQuaTrinh) {
      message.warning("Đã quá hạn nhập điểm quá trình")
      return
    }

    const changed = rows.filter((r) => r.isChanged)
    if (changed.length === 0) {
      message.info("Không có thay đổi để lưu")
      return
    }

    const tx: SqlTransactionBodyItem[] = [
      {
        model: "SubjectClass",
        operation: "update",
        data: {
          where: { id: lopId },
          data: { enteredScore: true },
        },
      },
      ...changed.map((r) => ({
        model: "StudentSubjectScore" as const,
        operation: "update" as const,
        data: {
          where: { id: r.id },
          data: {
            attendanceScore: r.attendanceScore,
            midtermScore: r.midtermScore,
            finalScore: r.finalScore,
            description: r.description || null,
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
            updatedById: profileId,
          })),
        },
      },
    ]

    try {
      await sqlTransaction(tx)
      message.success("Lưu điểm thành công")
      await refetch()
    } catch {
      message.error("Lưu điểm thất bại")
    }
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
            Nhập điểm quá trình
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
          <Breadcrumb.Item className="text-sm">Nhập điểm quá trình</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <div className="mb-1 text-xs text-gray-500">Học kỳ</div>
            <Select
              value={semesterId}
              onChange={onSelect}
              options={semesterOptions}
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
              onChange={handleChangeMonHoc}
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
                    lopMonHoc?.scoreDeadline
                      ? dayjs(lopMonHoc.scoreDeadline).format("DD/MM/YYYY")
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
                  tieuDe="Điểm TB quá trình"
                  giaTri={thongKe.diemTb != null ? thongKe.diemTb.toFixed(1) : "—"}
                  tyLe="/10"
                  tone="blue"
                />
                <TheThongKeNgang
                  icon={<CheckCircle2 size={18} />}
                  tieuDe="Đủ điều kiện thi"
                  giaTri={String(thongKe.duDieuKienThi)}
                  tyLe={`${thongKe.tong ? Math.round((thongKe.duDieuKienThi / thongKe.tong) * 100) : 0}%`}
                  tone="teal"
                />
                <TheThongKeNgang
                  icon={<Ban size={18} />}
                  tieuDe="Cấm thi"
                  giaTri={String(thongKe.camThi)}
                  tyLe={`${thongKe.tong ? Math.round((thongKe.camThi / thongKe.tong) * 100) : 0}%`}
                  tone="red"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-100 bg-white p-3">
        <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="text-sm font-semibold text-cgv-green-dark">
            BẢNG NHẬP ĐIỂM QUÁ TRÌNH
          </span>
          <div className="flex items-center gap-2">
            <Button icon={<Save size={14} />} onClick={luu} disabled={quaHanNhapDiemQuaTrinh}>
              Lưu
            </Button>
            <Button
              icon={<FileUp size={14} />}
              onClick={() => setImportModalVisible(true)}
              disabled={!lopId || rows.length === 0 || quaHanNhapDiemQuaTrinh}
            >
              Nhập điểm từ file
            </Button>
            <ExportScoreTemplate
              selectedSubjectClass={lopId}
              subjectClass={lopMonHoc}
              dataTable={scoreRows}
              type="TX/ĐK"
              disabled={quaHanNhapDiemQuaTrinh}
            />
          </div>
        </div>
        <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden">
          <Table<RowData>
            rowKey="id"
            pagination={false}
            size="small"
            dataSource={rows}
            scroll={{ y: chieuCaoBody }}
            columns={[
              { title: "STT", width: 56, align: "center", render: (_v, _r, i) => i + 1 },
              { title: "MÃ SV", dataIndex: "mssv", width: 100, align: "center" },
              { title: "Họ và tên", dataIndex: "hoTen", width: 180 },
              {
                title: "Chuyên cần",
                dataIndex: "attendanceScore",
                width: 120,
                align: "center",
                render: (value, row) => (
                  <InputNumber
                    value={value ?? undefined}
                    min={0}
                    max={10}
                    step={0.5}
                    disabled={quaHanNhapDiemQuaTrinh}
                    onChange={(v) => capNhatDong(row.id, { attendanceScore: Number(v) })}
                    className="w-full"
                  />
                ),
              },
              {
                title: "Định kỳ",
                dataIndex: "midtermScore",
                width: 120,
                align: "center",
                render: (value, row) => (
                  <InputNumber
                    value={value ?? undefined}
                    min={0}
                    max={10}
                    step={0.5}
                    disabled={quaHanNhapDiemQuaTrinh}
                    onChange={(v) => capNhatDong(row.id, { midtermScore: Number(v) })}
                    className="w-full"
                  />
                ),
              },
              {
                title: "Điểm thi",
                dataIndex: "examScore",
                width: 120,
                align: "center",
                render: (value) => <Input value={value ?? ""} disabled />,
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
                title: "Ghi chú",
                dataIndex: "description",
                render: (value, row) => (
                  <div className="flex items-center gap-2">
                    <Input
                      value={value}
                      onChange={(e) => capNhatDong(row.id, { description: e.target.value })}
                      disabled={quaHanNhapDiemQuaTrinh}
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
                      disabled={quaHanNhapDiemQuaTrinh}
                      onClick={() =>
                        capNhatDong(row.id, {
                          attendanceScore: null,
                          midtermScore: null,
                          description: "",
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
        scoreType="TX/ĐK"
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
              title: "Ghi chú",
              dataIndex: "description",
              render: (v) => v || "",
            },
          ]}
        />
      </Modal>
    </div>
  )
}

export default NhapDiemQuaTrinhGiangDayPage
