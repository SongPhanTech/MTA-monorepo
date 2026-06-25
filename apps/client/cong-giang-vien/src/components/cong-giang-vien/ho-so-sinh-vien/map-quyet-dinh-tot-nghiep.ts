import type { QuyetDinhTotNghiepSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { ApplicationStatus } from "@workspace/db/client"
import dayjs from "dayjs"

type GraduationSessionRow = {
  name?: string | null
  sessionDate?: Date | string | null
  graduationDecisionNumber?: string | null
  graduationDecisionDate?: Date | string | null
  graduationDecisionSigner?: string | null
}

type GraduationDecisionRow = {
  id: string
  code?: string | null
  decisionDate: Date | string
  notes?: string | null
  finalRanking?: { classification?: string | null } | null
  application?: {
    session?: GraduationSessionRow | null
    graduation?: boolean | null
    status?: ApplicationStatus
    rank?: { classification?: string | null } | null
  } | null
}

type GraduationApplicationRow = {
  id: string
  code?: string | null
  status: ApplicationStatus
  graduation?: boolean | null
  applicationDate: Date | string
  session?: GraduationSessionRow | null
  rank?: { classification?: string | null } | null
  decision?: {
    id: string
    code?: string | null
    decisionDate: Date | string
    notes?: string | null
    finalRanking?: { classification?: string | null } | null
  } | null
}

export type MapQuyetDinhTotNghiepInput = {
  graduationDecision?: GraduationDecisionRow | null
  graduationApplications?: GraduationApplicationRow[] | null
}

const dinhDangNgay = (value?: Date | string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY") : "—"

const layNamHoc = (session?: GraduationSessionRow | null, fallbackDate?: Date | string | null) => {
  const ngay = session?.graduationDecisionDate ?? session?.sessionDate ?? fallbackDate
  if (!ngay) return "—"
  const nam = dayjs(ngay).year()
  return `${nam - 1}-${nam}`
}

const layHocKy = (session?: GraduationSessionRow | null) => session?.name ?? "—"

const mapTuQuyetDinh = (decision: GraduationDecisionRow): QuyetDinhTotNghiepSinhVien => {
  const session = decision.application?.session
  const xepLoai =
    decision.finalRanking?.classification ??
    decision.application?.rank?.classification ??
    (decision.application?.graduation ? "Tốt nghiệp" : "—")

  return {
    id: decision.id,
    namHoc: layNamHoc(session, decision.decisionDate),
    hocKy: layHocKy(session),
    soQuyetDinh: session?.graduationDecisionNumber ?? decision.code ?? "—",
    loaiQuyetDinh: "Công nhận tốt nghiệp",
    noiDung: xepLoai,
    nguoiKy: session?.graduationDecisionSigner ?? "—",
    ngayKy: dinhDangNgay(session?.graduationDecisionDate ?? decision.decisionDate),
    ghiChu: decision.notes ?? "",
  }
}

const mapTuDon = (app: GraduationApplicationRow): QuyetDinhTotNghiepSinhVien | null => {
  const decision = app.decision
  const session = app.session
  const ngay =
    decision?.decisionDate ??
    session?.graduationDecisionDate ??
    app.applicationDate

  if (!decision && app.status !== ApplicationStatus.APPROVED) return null

  const xepLoai =
    decision?.finalRanking?.classification ??
    app.rank?.classification ??
    (app.graduation ? "Tốt nghiệp" : "—")

  return {
    id: decision?.id ?? app.id,
    namHoc: layNamHoc(session, ngay),
    hocKy: layHocKy(session),
    soQuyetDinh: session?.graduationDecisionNumber ?? decision?.code ?? app.code ?? "—",
    loaiQuyetDinh: "Công nhận tốt nghiệp",
    noiDung: xepLoai,
    nguoiKy: session?.graduationDecisionSigner ?? "—",
    ngayKy: dinhDangNgay(ngay),
    ghiChu: decision?.notes ?? "",
  }
}

export const mapQuyetDinhTotNghiep = (
  input: MapQuyetDinhTotNghiepInput
): QuyetDinhTotNghiepSinhVien[] => {
  const ketQua: QuyetDinhTotNghiepSinhVien[] = []
  const daCo = new Set<string>()

  if (input.graduationDecision) {
    const row = mapTuQuyetDinh(input.graduationDecision)
    ketQua.push(row)
    daCo.add(row.id)
  }

  for (const app of input.graduationApplications ?? []) {
    const row = mapTuDon(app)
    if (!row || daCo.has(row.id)) continue
    ketQua.push(row)
    daCo.add(row.id)
  }

  return ketQua.sort((a, b) => {
    const da = a.ngayKy !== "—" ? dayjs(a.ngayKy, "DD/MM/YYYY").valueOf() : 0
    const db = b.ngayKy !== "—" ? dayjs(b.ngayKy, "DD/MM/YYYY").valueOf() : 0
    return db - da
  })
}
