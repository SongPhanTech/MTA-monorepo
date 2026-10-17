import { queryClient } from "@api/index"
import type { NotificationType } from "@workspace/db"
import { sqlTransaction } from "@workspace/libs/api/model"
import { formatDateVn } from "@workspace/libs/timezone"

type LopMonHocThongBao = {
  id: string
  code: string
  name?: string
  monHoc?: string
  lecturerId?: string | null
  extraLecturerId?: string | null
  enterGradeLecturerId?: string | null
  scoreDeadline?: Date | string | null
  scoreDeadLineStart?: Date | string | null
  examScoreDeadline?: Date | string | null
  lecturerAssignmentDeadline?: Date | string | null
}

type TaoThongBaoInput = {
  lecturerId: string
  type: NotificationType
  title: string
  content: string
  expiresAt?: Date | string | null
}

const formatNgay = (value?: Date | string | null) =>
  value ? formatDateVn(value, "DD/MM/YYYY") : ""

const tenMonHoc = (lop: LopMonHocThongBao) => lop.monHoc || lop.name || ""

const gomGiangVienNhapDiem = (lop: LopMonHocThongBao) =>
  [
    ...new Set([lop.lecturerId, lop.extraLecturerId, lop.enterGradeLecturerId].filter(Boolean)),
  ] as string[]

const gomGiangVienGiangDay = (lop: LopMonHocThongBao) =>
  [...new Set([lop.lecturerId, lop.extraLecturerId].filter(Boolean))] as string[]

async function taoThongBaoGiangVien(danhSach: TaoThongBaoInput[]) {
  if (!danhSach.length) return

  const res = await sqlTransaction(
    danhSach.map((tb) => ({
      model: "Notification",
      operation: "create",
      data: {
        data: {
          title: tb.title,
          content: tb.content,
          type: tb.type,
          lecturerId: tb.lecturerId,
          active: true,
          targetAll: false,
          publishedAt: new Date().toISOString(),
          ...(tb.expiresAt ? { expiresAt: new Date(tb.expiresAt).toISOString() } : {}),
        },
      },
    }))
  )

  if (res.status === 200) {
    await queryClient.invalidateQueries({ queryKey: ["zenstack", "Notification"] })
  }
}

async function layLopMonHoc(ids: string[]): Promise<LopMonHocThongBao[]> {
  if (!ids.length) return []

  const res = await sqlTransaction([
    {
      model: "SubjectClass",
      operation: "findMany",
      data: {
        where: { id: { in: ids } },
        select: {
          id: true,
          code: true,
          name: true,
          lecturerId: true,
          extraLecturerId: true,
          enterGradeLecturerId: true,
          scoreDeadline: true,
          scoreDeadLineStart: true,
          examScoreDeadline: true,
          lecturerAssignmentDeadline: true,
          subject: { select: { name: true } },
        },
      },
    },
  ])

  if (res.status !== 200) return []

  const raw = res.data[0] as Array<LopMonHocThongBao & { subject?: { name: string } }>
  return raw.map((item) => ({
    ...item,
    monHoc: item.subject?.name,
  }))
}

/** Gửi thông báo phân công giảng dạy cho GV chính / phụ. */
async function thongBaoPhanCongGiangDay(subjectClassIds: string[], chiGiangVienIds?: string[]) {
  const lopList = await layLopMonHoc(subjectClassIds)
  const danhSach: TaoThongBaoInput[] = []

  for (const lop of lopList) {
    const gvIds = chiGiangVienIds?.length
      ? chiGiangVienIds.filter((id) => gomGiangVienGiangDay(lop).includes(id))
      : gomGiangVienGiangDay(lop)

    for (const lecturerId of [...new Set(gvIds)]) {
      danhSach.push({
        lecturerId,
        type: "TEACHING_ASSIGNMENTS",
        title: `Phân công giảng dạy mới - ${lop.code}`,
        content: `Bạn được phân công giảng dạy lớp <strong>${lop.code}</strong> - ${tenMonHoc(lop)}.`,
        expiresAt: lop.lecturerAssignmentDeadline,
      })
    }
  }

  await taoThongBaoGiangVien(danhSach)
}

/** Gửi thông báo hạn nhập điểm quá trình. */
async function thongBaoHanNhapDiemQuaTrinh(subjectClassIds: string[]) {
  const lopList = await layLopMonHoc(subjectClassIds)
  const danhSach: TaoThongBaoInput[] = []

  for (const lop of lopList) {
    if (!lop.scoreDeadline) continue
    const tuNgay = formatNgay(lop.scoreDeadLineStart)
    const denNgay = formatNgay(lop.scoreDeadline)
    const noiDungHan = tuNgay ? `${tuNgay} đến ${denNgay}` : denNgay

    for (const lecturerId of gomGiangVienNhapDiem(lop)) {
      danhSach.push({
        lecturerId,
        type: "PROCESS_SCORE_DEADLINE",
        title: `Hạn nhập điểm quá trình - ${lop.code}`,
        content: `Lớp <strong>${lop.code}</strong> - ${tenMonHoc(lop)}: hạn nhập điểm quá trình ${noiDungHan}.`,
        expiresAt: lop.scoreDeadline,
      })
    }
  }

  await taoThongBaoGiangVien(danhSach)
}

/** Gửi thông báo hạn nhập điểm thi. */
async function thongBaoHanNhapDiemThi(subjectClassIds: string[]) {
  const lopList = await layLopMonHoc(subjectClassIds)
  const danhSach: TaoThongBaoInput[] = []

  for (const lop of lopList) {
    if (!lop.examScoreDeadline) continue
    const han = formatNgay(lop.examScoreDeadline)

    for (const lecturerId of gomGiangVienNhapDiem(lop)) {
      danhSach.push({
        lecturerId,
        type: "EXAM_DEADLINE",
        title: `Hạn nhập điểm thi - ${lop.code}`,
        content: `Lớp <strong>${lop.code}</strong> - ${tenMonHoc(lop)}: hạn nhập điểm thi đến ${han}.`,
        expiresAt: lop.examScoreDeadline,
      })
    }
  }

  await taoThongBaoGiangVien(danhSach)
}

/** Trả về GV mới được gán (chính / phụ) so với dữ liệu cũ. */
function layGiangVienPhanCongThayDoi(
  cu: { lecturerId?: string | null; extraLecturerId?: string | null },
  moi: { lecturerId?: string | null; extraLecturerId?: string | null }
) {
  const thayDoi: string[] = []
  if (moi.lecturerId && moi.lecturerId !== cu.lecturerId) thayDoi.push(moi.lecturerId)
  if (moi.extraLecturerId && moi.extraLecturerId !== cu.extraLecturerId) {
    thayDoi.push(moi.extraLecturerId)
  }
  return thayDoi
}

export {
  layGiangVienPhanCongThayDoi,
  thongBaoHanNhapDiemQuaTrinh,
  thongBaoHanNhapDiemThi,
  thongBaoPhanCongGiangDay,
}
