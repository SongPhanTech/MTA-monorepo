import { CouncilRole, SupervisorRole } from "@workspace/db/client"
import { formatDateVn, formatThangIn, nowVn } from "@workspace/libs/timezone"
import {
  councilMemberProfile,
  councilRoleOrder,
  formatAmountWithComma,
  getSupervisorDefaultPayAmount,
  getSupervisorName,
  readDecimalAmount,
  resolveCouncilMemberPayAmount,
  resolveInAcademy,
  tenDoiTuong,
} from "./thesis-payment.helpers"
import { loadThesisProjectsForPayment } from "./thesis-payment-query"

function resolveSupervisorPayAmounts(
  project: Awaited<ReturnType<typeof loadThesisProjectsForPayment>>[number]
) {
  return project.thesisSession?.configPayment?.supervisorPayAmounts ?? []
}

function buildSupervisorPaymentRows(
  project: Awaited<ReturnType<typeof loadThesisProjectsForPayment>>[number]
) {
  const rows: Array<{
    expert: NonNullable<typeof project.supervisor>
    amount: number
    bankAccountNumber: string
    bankName: string
  }> = []
  const defaults = resolveSupervisorPayAmounts(project)

  const resolveAmount = (
    recorded: unknown,
    role: SupervisorRole,
    expert: Parameters<typeof resolveInAcademy>[0] | null | undefined
  ) => {
    const amount = readDecimalAmount(recorded)
    if (amount > 0) return amount
    const inAcademy = resolveInAcademy(expert)
    return getSupervisorDefaultPayAmount(defaults, role, inAcademy)
  }

  if (project.singleSupervisorPaymentId || project.singleSupervisorPayment) {
    const expert = project.supervisor || project.coSupervisor
    if (expert) {
      rows.push({
        expert,
        amount: resolveAmount(
          project.singleSupervisorPayment?.amount,
          SupervisorRole.SINGLE,
          expert
        ),
        bankAccountNumber: expert.bankAccountNumber || "",
        bankName: expert.bankName || "",
      })
    }
    return rows
  }

  if (project.supervisor) {
    rows.push({
      expert: project.supervisor,
      amount: resolveAmount(
        project.supervisorPayment?.amount,
        SupervisorRole.SUPERVISOR,
        project.supervisor
      ),
      bankAccountNumber: project.supervisor.bankAccountNumber || "",
      bankName: project.supervisor.bankName || "",
    })
  }
  if (project.coSupervisor) {
    rows.push({
      expert: project.coSupervisor,
      amount: resolveAmount(
        project.coSupervisorPayment?.amount,
        SupervisorRole.CO_SUPERVISOR,
        project.coSupervisor
      ),
      bankAccountNumber: project.coSupervisor.bankAccountNumber || "",
      bankName: project.coSupervisor.bankName || "",
    })
  }
  return rows
}

function getStudentFromProject(
  project: Awaited<ReturnType<typeof loadThesisProjectsForPayment>>[number]
) {
  return project.registrations[0]?.student
}

export async function buildCouncilPaymentExportPayload(params: {
  thesisSessionId: string
  studentIds?: string[]
}) {
  const projects = await loadThesisProjectsForPayment(params.thesisSessionId, params.studentIds)
  const now = nowVn()
  const majorMap = new Map<string, Array<Record<string, unknown>>>()
  let khoaquanli = ""

  const studentsWithCouncil = projects.filter((project) => project.council?.members?.length)
  if (!studentsWithCouncil.length) {
    return null
  }

  for (const project of studentsWithCouncil) {
    const student = getStudentFromProject(project)
    if (!student) continue

    const councilDefaults = project.thesisSession?.configPayment?.councilPayAmounts ?? []
    const majorName = student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""
    if (!khoaquanli) {
      khoaquanli =
        student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.organization?.sTen || ""
    }

    const dob = student.userProfile?.dateOfBirth
      ? formatDateVn(student.userProfile.dateOfBirth)
      : ""
    const doiTuong = student.fixedClass?.trainingCourse?.trainingObjectType?.type
    const loaiDoiTuong = doiTuong ? (tenDoiTuong[doiTuong]?.fullname ?? "") : ""
    const khoaHoc = student.fixedClass?.trainingCourse?.name || ""
    const chuyenNganhCode =
      student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""
    const ngayBV = project.defenseDate ? formatDateVn(project.defenseDate) : ""
    const thongTinBaoVe = `${student.userProfile?.fullname || ""}\nNgày sinh: ${dob}\nĐối tượng: ${loaiDoiTuong}, ${khoaHoc}\nChuyên ngành: ${chuyenNganhCode}\nNgày BV: ${ngayBV}`

    const sortedMembers = [...(project.council?.members ?? [])].sort(
      (a, b) => (councilRoleOrder[a.role] || 99) - (councilRoleOrder[b.role] || 99)
    )

    const hdLines: string[] = []
    const ttLines: string[] = []
    const stkLines: string[] = []
    const nhLines: string[] = []
    let studentTotal = 0

    for (const member of sortedMembers) {
      const expert = councilMemberProfile(member)
      let rolePrefix = "UV"
      let roleSuffix = ""
      if (member.role === CouncilRole.CHAIRMAN) rolePrefix = "CT"
      else if (member.role === CouncilRole.SECRETARY) rolePrefix = "TK"
      else if (member.role === CouncilRole.REVIEWER_1) roleSuffix = ", PB1"
      else if (member.role === CouncilRole.REVIEWER_2) roleSuffix = ", PB2"

      const org = expert?.organization ? `, ${expert.organization}` : ""
      const name = getSupervisorName(expert, true)
      hdLines.push(`${rolePrefix}: ${name || ""}${org}${roleSuffix}`)

      const rawAmount = resolveCouncilMemberPayAmount(member, expert, councilDefaults)
      studentTotal += rawAmount
      ttLines.push(formatAmountWithComma(rawAmount))
      const bankNumber =
        expert?.expert?.lecturer?.userProfile?.bankAccountNumber ||
        expert?.lecturer?.userProfile?.bankAccountNumber ||
        expert?.bankAccountNumber ||
        "Chưa có thông tin"
      stkLines.push(bankNumber || "")
      const bankName =
        expert?.expert?.lecturer?.userProfile?.bankName ||
        expert?.lecturer?.userProfile?.bankName ||
        expert?.bankName ||
        "Chưa có thông tin"
      nhLines.push(bankName || "")
    }

    const tableRow = {
      thongTinBaoVe,
      thongTinHoiDong: hdLines.join("\n"),
      thongTinThanhToan: ttLines.join("\n"),
      thongTinStk: stkLines.join("\n"),
      thongTinNganHang: nhLines.join("\n"),
      rawAmount: studentTotal,
    }

    if (!majorMap.has(majorName)) majorMap.set(majorName, [])
    majorMap.get(majorName)?.push(tableRow)
  }

  const dataConvert = Array.from(majorMap.entries()).map(([majorName, items]) => {
    const firstProject = studentsWithCouncil.find(
      (project) =>
        getStudentFromProject(project)?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
          ?.name === majorName
    )
    const nguoiki = firstProject?.thesisSession?.chief?.trim() || ""
    const dotXet = firstProject?.thesisSession?.name || ""
    const tongTienSo = items.reduce((acc, curr) => acc + (Number(curr.rawAmount) || 0), 0)

    return {
      ngay: now.format("DD"),
      thang: formatThangIn(now.month() + 1),
      nam: now.format("YYYY"),
      khoa: getStudentFromProject(firstProject!)?.fixedClass?.trainingCourse?.name || "",
      dotXet,
      soQDBVLV: firstProject?.thesisSession?.defenseDecisionNumber || "",
      chuyenNganh: majorName,
      khoaQuanLi: khoaquanli,
      tongTienBangSo: formatAmountWithComma(tongTienSo),
      nguoiki,
      tongTienBangChu: Number(tongTienSo).toVndWord("đồng"),
      data: items.map((item, index) => ({
        stt: index + 1,
        thongTinBaoVe: item.thongTinBaoVe,
        thongTinHoiDong: item.thongTinHoiDong,
        thongTinThanhToan: item.thongTinThanhToan,
        thongTinStk: item.thongTinStk,
        thongTinNganHang: item.thongTinNganHang,
        empty: "",
      })),
    }
  })

  const items = dataConvert.map((item, idx) => ({
    ...item,
    "ngắt trang": idx === dataConvert.length - 1 ? "" : "ngắt trang",
  }))

  return {
    fileName: "ThanhToanHoiDongBaoVe",
    path: "ThanhToanHoiDongBV.xlsx",
    prefix: "mta/luan-van",
    data: { items },
    downloadName: "ThanhToanHoiDongBaoVe.xlsx",
  }
}

export async function buildSupervisorPaymentExportPayload(params: {
  thesisSessionId: string
  studentIds?: string[]
}) {
  const projects = await loadThesisProjectsForPayment(params.thesisSessionId, params.studentIds)
  const now = nowVn()
  const organizationMap = new Map<string, Record<string, unknown>>()
  let studentsWithSupervisor = 0

  for (const project of projects) {
    const student = getStudentFromProject(project)
    if (!student) continue

    const supervisorRows = buildSupervisorPaymentRows(project)
    if (!supervisorRows.length) continue
    studentsWithSupervisor += 1

    const orgName = project.organization?.sTen || "Chưa có đơn vị"
    if (!organizationMap.has(orgName)) {
      organizationMap.set(orgName, {
        ngay: now.format("DD"),
        thang: formatThangIn(now.month() + 1),
        nam: now.format("YYYY"),
        khoa: student.fixedClass?.trainingCourse?.name || "",
        dotXet: project.thesisSession?.name || "",
        nguoiki: project.thesisSession?.chief?.trim() || "",
        khoaQuanLi: orgName,
        soHocVien: "0",
        tongTienSo: 0,
        tongTienChu: "",
        data: [] as Array<Record<string, unknown>>,
      })
    }

    const currentGroup = organizationMap.get(orgName)!
    const rows = currentGroup.data as Array<Record<string, unknown>>

    const qdNum = project.thesisSession?.decisionNumber || "...."
    const qdDate = project.thesisSession?.decisionDate
      ? formatDateVn(project.thesisSession.decisionDate)
      : ".../.../...."
    const quyetDinh = `${qdNum} \n ngày ${qdDate}`

    const supervisorNames = supervisorRows.map((item) => getSupervisorName(item.expert, true))
    const thongTinHuongDan =
      supervisorNames.length > 1
        ? supervisorNames.map((name, index) => `${index + 1}. ${name}`).join("\n")
        : (supervisorNames[0] ?? "Chưa có GVHD")

    const amounts = supervisorRows.map((item) => item.amount)
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0)
    const tienThanhToan = totalAmount === 0 ? 0 : totalAmount
    const thongTinThanhToan =
      totalAmount === 0 ? "" : amounts.map((a) => formatAmountWithComma(a)).join("\n")

    rows.push({
      stt: rows.length + 1,
      quyetDinh,
      thongTinHuongDan,
      thongTinBaoVe: student.userProfile?.fullname || "",
      thongTinKhoa: student.fixedClass?.trainingCourse?.name || "",
      thongTinThanhToan,
      thongTinStk: supervisorRows.map((item) => item.bankAccountNumber).join("\n"),
      thongTinBank: supervisorRows.map((item) => item.bankName).join("\n"),
      thongtinKyNhan: "",
      tienThanhToan,
    })

    currentGroup.soHocVien = rows.length.toString()
    currentGroup.tongTienSo = (currentGroup.tongTienSo as number) + (tienThanhToan || 0)
    currentGroup.tongTienChu = Number(currentGroup.tongTienSo).toVndWord("đồng")
  }

  const groups = Array.from(organizationMap.values())
  if (!groups.length) {
    return {
      empty: true as const,
      studentsInSession: projects.length,
      studentsWithSupervisor,
    }
  }

  const items = groups.map((item, idx) => ({
    ...item,
    tongTienSo: formatAmountWithComma(item.tongTienSo as number),
    "ngắt trang": idx === groups.length - 1 ? "" : "ngắt trang",
  }))

  return {
    empty: false as const,
    studentsInSession: projects.length,
    studentsWithSupervisor,
    fileName: "ThanhToanHuongDan",
    path: "ThanhToanHuongDanTrongHV.xlsx",
    prefix: "mta/luan-van",
    data: { items },
    downloadName: "ThanhToanHuongDan.xlsx",
  }
}
