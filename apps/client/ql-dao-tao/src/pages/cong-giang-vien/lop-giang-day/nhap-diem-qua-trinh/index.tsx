import { CONG_GIANG_VIEN_LOP_GIANG_DAY_PATH } from "@constants/cong-giang-vien-path"
import DefaultLayout from "@layouts/default-layout"
import { scoreConvert } from "@hooks/scoreConverter"
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
import dayjs from "dayjs"
import { ArrowLeft, FileDown, FileUp, History, RotateCcw, Save } from "lucide-react"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"

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

  const handleChangeYear = (yearId: string) => {
    const year = schoolYears.find((item) => item.id === yearId)
    const firstSemester = year?.semesters?.[0]
    if (firstSemester) onSelect(firstSemester.id)
  }

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
            userProfile: { select: { fullname: true } },
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
      id: r.id,
      mssv: r.student?.code ?? "",
      hoTen: r.student?.userProfile?.fullname ?? "",
      attendanceScore: r.attendanceScore ?? null,
      midtermScore: r.midtermScore ?? null,
      examScore: r.examScore ?? null,
      finalScore: r.finalScore != null ? Number(r.finalScore) : null,
      letter: "",
      description: r.description ?? "",
      isChanged: false,
    }))
    setRows(mapped)
  }, [scoreRows])

  const capNhatDong = (
    id: string,
    patch: Partial<Pick<RowData, "attendanceScore" | "midtermScore" | "description">>
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        const next = { ...row, ...patch }
        const goc = scoreRows.find((x) => x.id === id)
        const trainingCourse = goc?.student?.fixedClass?.trainingCourse
        const heSoMacDinh = {
          coef_1: 0.1,
          coef_2: 0.3,
          coef_3: 0.6,
          scoreToTakeExam: 4,
          scoreToPass: 5,
          maxReExamScore: 5,
          reduceReExamScore: 0,
          examScoreToPass: 4,
        }
        const finalScore =
          next.attendanceScore == null || next.midtermScore == null || next.examScore == null
            ? null
            : calcFinalScore(
                trainingCourse ?? heSoMacDinh,
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
      })
    )
  }

  const thongKe = useMemo(() => {
    const tong = rows.length
    const daNhap = rows.filter((r) => r.attendanceScore != null && r.midtermScore != null).length
    const chuaNhap = tong - daNhap
    const finals = rows.map((r) => r.finalScore).filter((v): v is number => v != null)
    return {
      tong,
      daNhap,
      chuaNhap,
      max: finals.length ? Math.max(...finals) : 0,
      min: finals.length ? Math.min(...finals) : 0,
    }
  }, [rows])

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
            onClick={() => router.push(CONG_GIANG_VIEN_LOP_GIANG_DAY_PATH)}
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
          <Breadcrumb.Item href={CONG_GIANG_VIEN_LOP_GIANG_DAY_PATH} className="text-sm">
            Giảng dạy
          </Breadcrumb.Item>
          <Breadcrumb.Item className="text-sm">Nhập điểm quá trình</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <div>
            <div className="mb-1 text-xs text-gray-500">Năm học</div>
            <Select
              loading={dangTaiNamHoc}
              value={selectedYearId}
              onChange={handleChangeYear}
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
              onChange={handleChangeMonHoc}
              options={monHocOptions}
              className="w-full"
            />
          </div>
          <div className="flex items-end justify-end gap-2">
            <Button icon={<Save size={14} />} onClick={luu} disabled={quaHanNhapDiemQuaTrinh}>
              Lưu
            </Button>
            <Button icon={<FileUp size={14} />} onClick={() => message.info("Đang phát triển")}>
              Nhập Excel
            </Button>
            <Button icon={<FileDown size={14} />} onClick={() => message.info("Đang phát triển")}>
              Xuất Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div>
              Mã lớp: <b>{lopMonHoc?.code ?? ""}</b>
            </div>
            <div>
              Học kỳ: <b>{lopMonHoc?.semester?.name ?? ""}</b>
            </div>
            <div>
              Tên lớp: <b>{lopMonHoc?.name ?? ""}</b>
            </div>
            <div>
              Tín chỉ: <b>{lopMonHoc?.subject?.credit ?? ""}</b>
            </div>
            <div>
              Môn học: <b>{lopMonHoc?.subject?.name ?? ""}</b>
            </div>
            <div>
              Sĩ số sinh viên: <b>{lopMonHoc?._count?.subjectClassStudent ?? 0}</b>
            </div>
            <div>
              Hạn nhập điểm:{" "}
              <b>
                {lopMonHoc?.scoreDeadline
                  ? dayjs(lopMonHoc.scoreDeadline).format("DD/MM/YYYY HH:mm")
                  : ""}
              </b>
            </div>
          </div>
          <div className="rounded border border-gray-100 p-3 text-sm">
            <div className="mb-2 font-semibold text-cgv-green-dark">THỐNG KÊ</div>
            <div>
              Tổng số sinh viên: <b>{thongKe.tong}</b>
            </div>
            <div>
              Đã nhập điểm: <b className="text-green-600">{thongKe.daNhap}</b>
            </div>
            <div>
              Chưa nhập điểm: <b className="text-red-500">{thongKe.chuaNhap}</b>
            </div>
            <div className="mt-3">
              Điểm QT cao nhất: <b>{thongKe.max.toFixed(2)}</b>
            </div>
            <div>
              Điểm QT thấp nhất: <b>{thongKe.min.toFixed(2)}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-gray-100 bg-white p-3">
        <div className="mb-2 text-sm font-semibold text-cgv-green-dark">
          BẢNG NHẬP ĐIỂM QUÁ TRÌNH
        </div>
        <Table<RowData>
          rowKey="id"
          pagination={false}
          size="small"
          dataSource={rows}
          scroll={{ y: "calc(100vh - 520px)" }}
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
        <div className="mt-2 rounded bg-green-50 px-3 py-1 text-xs text-gray-600">
          Ghi chú: Điểm thành phần được tính theo thang điểm 0 - 10 (làm tròn 1 chữ số thập phân)
        </div>
      </div>

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

NhapDiemQuaTrinhGiangDayPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}

export default NhapDiemQuaTrinhGiangDayPage
