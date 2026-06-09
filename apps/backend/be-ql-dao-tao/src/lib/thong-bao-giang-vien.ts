import type { NotificationPriority, NotificationType, PrismaClient } from "@workspace/db"
import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)
dayjs.extend(timezone)

const TZ = "Asia/Ho_Chi_Minh"
const FMT_NGAY = "DD/MM/YYYY"
/** Số ngày trước hạn được coi là "sắp hết hạn". */
export const SO_NGAY_SAP_HET_HAN = 3

type MucCanhBao = "sap_het_han" | "qua_han"

type ThongBaoJobInput = {
  lecturerId: string
  type: NotificationType
  title: string
  content: string
  expiresAt?: Date | null
  priority: NotificationPriority
  code: string
}

const formatNgay = (value?: Date | null) => (value ? dayjs(value).tz(TZ).format(FMT_NGAY) : "")

const tinhMucCanhBaoHan = (expiresAt: Date): MucCanhBao | null => {
  const now = dayjs().tz(TZ)
  const han = dayjs(expiresAt).tz(TZ)

  if (now.isAfter(han.endOf("day"))) return "qua_han"
  if (han.diff(now.startOf("day"), "day") <= SO_NGAY_SAP_HET_HAN) return "sap_het_han"
  return null
}

const gomGiangVienNhapDiem = (lop: {
  lecturerId: string | null
  extraLecturerId: string | null
  enterGradeLecturerId: string | null
}) =>
  [
    ...new Set([lop.lecturerId, lop.extraLecturerId, lop.enterGradeLecturerId].filter(Boolean)),
  ] as string[]

const maThongBaoCron = (
  type: NotificationType,
  refId: string,
  lecturerId: string,
  slotKey: string
) => `CRON-${type}-${refId}-${lecturerId}-${slotKey}`

async function taoThongBaoCoMa(prisma: PrismaClient, danhSach: ThongBaoJobInput[]) {
  if (!danhSach.length) return 0

  const result = await prisma.notification.createMany({
    data: danhSach.map((item) => ({
      code: item.code,
      title: item.title,
      content: item.content,
      type: item.type,
      priority: item.priority,
      lecturerId: item.lecturerId,
      active: true,
      targetAll: false,
      publishedAt: new Date(),
      expiresAt: item.expiresAt ?? undefined,
    })),
    skipDuplicates: true,
  })

  return result.count
}

function noiDungHanQuaTrinh(lop: { code: string; mon: string }, han: string, muc: MucCanhBao) {
  if (muc === "qua_han") {
    return `Lớp <strong>${lop.code}</strong> - ${lop.mon}: đã quá hạn nhập điểm quá trình (hạn ${han}). Vui lòng hoàn thành sớm.`
  }
  return `Lớp <strong>${lop.code}</strong> - ${lop.mon}: sắp đến hạn nhập điểm quá trình (hạn ${han}).`
}

function noiDungHanThi(lop: { code: string; mon: string }, han: string, muc: MucCanhBao) {
  if (muc === "qua_han") {
    return `Lớp <strong>${lop.code}</strong> - ${lop.mon}: đã quá hạn nhập điểm thi (hạn ${han}). Vui lòng hoàn thành sớm.`
  }
  return `Lớp <strong>${lop.code}</strong> - ${lop.mon}: sắp đến hạn nhập điểm thi (hạn ${han}).`
}

function noiDungHanKhaoSat(ks: { name: string }, han: string, muc: MucCanhBao) {
  if (muc === "qua_han") {
    return `Khảo sát <strong>${ks.name}</strong>: đã quá hạn điền (hạn ${han}). Vui lòng hoàn thành sớm.`
  }
  return `Khảo sát <strong>${ks.name}</strong>: sắp đến hạn điền (hạn ${han}).`
}

/** Quét hạn nhập điểm quá trình / thi và khảo sát, đẩy Notification cho GV liên quan. */
async function quetVaThongBaoHanGiangVien(prisma: PrismaClient, slotKey: string) {
  const now = dayjs().tz(TZ)
  const sapHetHanDen = now.add(SO_NGAY_SAP_HET_HAN, "day").endOf("day").toDate()
  const homNay = now.startOf("day").toDate()

  const danhSach: ThongBaoJobInput[] = []

  const lopMonHoc = await prisma.subjectClass.findMany({
    where: {
      active: true,
      deletedAt: null,
      cancelled: false,
      OR: [
        { lecturerId: { not: null } },
        { extraLecturerId: { not: null } },
        { enterGradeLecturerId: { not: null } },
      ],
    },
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
      enteredScore: true,
      enteredExamScore: true,
      subject: { select: { name: true } },
    },
  })

  for (const lop of lopMonHoc) {
    const mon = lop.subject?.name || lop.name
    const meta = { code: lop.code, mon }

    if (!lop.enteredScore && lop.scoreDeadline) {
      const muc = tinhMucCanhBaoHan(lop.scoreDeadline)
      if (muc) {
        const tuNgay = formatNgay(lop.scoreDeadLineStart)
        const denNgay = formatNgay(lop.scoreDeadline)
        const han = tuNgay ? `${tuNgay} đến ${denNgay}` : denNgay
        const title =
          muc === "qua_han"
            ? `QUÁ HẠN NHẬP ĐIỂM QUÁ TRÌNH - ${lop.code}`
            : `SẮP ĐẾN HẠN NHẬP ĐIỂM QUÁ TRÌNH - ${lop.code}`

        for (const lecturerId of gomGiangVienNhapDiem(lop)) {
          danhSach.push({
            lecturerId,
            type: "PROCESS_SCORE_DEADLINE",
            title,
            content: noiDungHanQuaTrinh(meta, han, muc),
            expiresAt: lop.scoreDeadline,
            priority: muc === "qua_han" ? "URGENT" : "HIGH",
            code: maThongBaoCron("PROCESS_SCORE_DEADLINE", lop.id, lecturerId, slotKey),
          })
        }
      }
    }

    if (!lop.enteredExamScore && lop.examScoreDeadline) {
      const muc = tinhMucCanhBaoHan(lop.examScoreDeadline)
      if (muc) {
        const han = formatNgay(lop.examScoreDeadline)
        const title =
          muc === "qua_han"
            ? `QUÁ HẠN NHẬP ĐIỂM THI - ${lop.code}`
            : `SẮP ĐẾN HẠN NHẬP ĐIỂM THI - ${lop.code}`

        for (const lecturerId of gomGiangVienNhapDiem(lop)) {
          danhSach.push({
            lecturerId,
            type: "EXAM_DEADLINE",
            title,
            content: noiDungHanThi(meta, han, muc),
            expiresAt: lop.examScoreDeadline,
            priority: muc === "qua_han" ? "URGENT" : "HIGH",
            code: maThongBaoCron("EXAM_DEADLINE", lop.id, lecturerId, slotKey),
          })
        }
      }
    }
  }

  const khaoSat = await prisma.survey.findMany({
    where: {
      active: true,
      deletedAt: null,
      lectureId: { not: null },
      endDate: { not: null },
      startDate: { lte: now.toDate() },
      endDate: { gte: homNay, lte: sapHetHanDen },
    },
    select: {
      id: true,
      name: true,
      endDate: true,
      lectureId: true,
      lecture: { select: { id: true, userProfileId: true } },
    },
  })

  // Khảo sát quá hạn (endDate < hôm nay) vẫn trong cửa sổ nhắc 3 ngày sau hạn
  const khaoSatQuaHan = await prisma.survey.findMany({
    where: {
      active: true,
      deletedAt: null,
      lectureId: { not: null },
      endDate: {
        not: null,
        lt: homNay,
        gte: now.subtract(SO_NGAY_SAP_HET_HAN, "day").startOf("day").toDate(),
      },
      startDate: { lte: now.toDate() },
    },
    select: {
      id: true,
      name: true,
      endDate: true,
      lectureId: true,
      lecture: { select: { id: true, userProfileId: true } },
    },
  })

  const tatCaKhaoSat = [...khaoSat, ...khaoSatQuaHan]

  for (const ks of tatCaKhaoSat) {
    if (!ks.lectureId || !ks.endDate) continue

    const daHoanThanh = ks.lecture?.userProfileId
      ? await prisma.surveySession.findFirst({
          where: {
            surveyId: ks.id,
            profileId: ks.lecture.userProfileId,
            isCompleted: true,
          },
          select: { id: true },
        })
      : null

    if (daHoanThanh) continue

    const muc = tinhMucCanhBaoHan(ks.endDate)
    if (!muc) continue

    const han = formatNgay(ks.endDate)
    const title =
      muc === "qua_han"
        ? `QUÁ HẠN ĐIỀN KHẢO SÁT - ${ks.name}`
        : `SẮP ĐẾN HẠN ĐIỀN KHẢO SÁT - ${ks.name}`

    danhSach.push({
      lecturerId: ks.lectureId,
      type: "SURVEY_DEADLINE",
      title,
      content: noiDungHanKhaoSat({ name: ks.name }, han, muc),
      expiresAt: ks.endDate,
      priority: muc === "qua_han" ? "URGENT" : "HIGH",
      code: maThongBaoCron("SURVEY_DEADLINE", ks.id, ks.lectureId, slotKey),
    })
  }

  const soLuong = await taoThongBaoCoMa(prisma, danhSach)
  return { daQuet: danhSach.length, daTao: soLuong }
}

// --- API thủ công (gán hạn trực tiếp) ---

type LopMonHocNotify = {
  id: string
  code: string
  name: string
  lecturerId: string | null
  extraLecturerId: string | null
  enterGradeLecturerId: string | null
  scoreDeadline: Date | null
  scoreDeadLineStart: Date | null
  examScoreDeadline: Date | null
  subject: { name: string } | null
}

const selectLopMonHoc = {
  id: true,
  code: true,
  name: true,
  lecturerId: true,
  extraLecturerId: true,
  enterGradeLecturerId: true,
  scoreDeadline: true,
  scoreDeadLineStart: true,
  examScoreDeadline: true,
  subject: { select: { name: true } },
} satisfies Parameters<PrismaClient["subjectClass"]["findMany"]>[0]["select"]

async function thongBaoHanNhapDiemQuaTrinhServer(prisma: PrismaClient, subjectClassIds: string[]) {
  if (!subjectClassIds.length) return

  const lopList = await prisma.subjectClass.findMany({
    where: { id: { in: subjectClassIds } },
    select: selectLopMonHoc,
  })

  const slotKey = dayjs().tz(TZ).format("YYYY-MM-DD-HH-manual")
  const danhSach: ThongBaoJobInput[] = []

  for (const lop of lopList) {
    if (!lop.scoreDeadline) continue
    const mon = lop.subject?.name || lop.name
    const tuNgay = formatNgay(lop.scoreDeadLineStart)
    const denNgay = formatNgay(lop.scoreDeadline)
    const noiDungHan = tuNgay ? `${tuNgay} đến ${denNgay}` : denNgay

    for (const lecturerId of gomGiangVienNhapDiem(lop)) {
      danhSach.push({
        lecturerId,
        type: "PROCESS_SCORE_DEADLINE",
        title: `Hạn nhập điểm quá trình - ${lop.code}`,
        content: `Lớp <strong>${lop.code}</strong> - ${mon}: hạn nhập điểm quá trình ${noiDungHan}.`,
        expiresAt: lop.scoreDeadline,
        priority: "NORMAL",
        code: maThongBaoCron("PROCESS_SCORE_DEADLINE", lop.id, lecturerId, slotKey),
      })
    }
  }

  await taoThongBaoCoMa(prisma, danhSach)
}

async function thongBaoHanNhapDiemThiServer(prisma: PrismaClient, subjectClassIds: string[]) {
  if (!subjectClassIds.length) return

  const lopList = await prisma.subjectClass.findMany({
    where: { id: { in: subjectClassIds } },
    select: selectLopMonHoc,
  })

  const slotKey = dayjs().tz(TZ).format("YYYY-MM-DD-HH-manual")
  const danhSach: ThongBaoJobInput[] = []

  for (const lop of lopList) {
    if (!lop.examScoreDeadline) continue
    const mon = lop.subject?.name || lop.name
    const han = formatNgay(lop.examScoreDeadline)

    for (const lecturerId of gomGiangVienNhapDiem(lop)) {
      danhSach.push({
        lecturerId,
        type: "EXAM_DEADLINE",
        title: `Hạn nhập điểm thi - ${lop.code}`,
        content: `Lớp <strong>${lop.code}</strong> - ${mon}: hạn nhập điểm thi đến ${han}.`,
        expiresAt: lop.examScoreDeadline,
        priority: "NORMAL",
        code: maThongBaoCron("EXAM_DEADLINE", lop.id, lecturerId, slotKey),
      })
    }
  }

  await taoThongBaoCoMa(prisma, danhSach)
}

export {
  quetVaThongBaoHanGiangVien,
  thongBaoHanNhapDiemQuaTrinhServer,
  thongBaoHanNhapDiemThiServer,
}
