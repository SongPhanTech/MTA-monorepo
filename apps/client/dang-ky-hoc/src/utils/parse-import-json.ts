export type ImportJsonPreview = {
  version: string
  exportedAt?: string
  sessionId: string
  sessionName: string
  semesterName?: string
  schoolYearName?: string
  startDate?: string
  endDate?: string
  active?: boolean
  recordCounts?: Record<string, number>
}

type ExportJsonShape = {
  version?: string
  exportedAt?: string
  counts?: Record<string, number>
  data?: {
    ClassRegisterSession?: Array<{
      id?: string
      name?: string
      startDate?: string
      endDate?: string
      active?: boolean
      semesterId?: string
    }>
    Semester?: Array<{ id?: string; name?: string }>
    SchoolYear?: Array<{ name?: string }>
  }
}

export async function parseImportJsonFile(file: File): Promise<ImportJsonPreview> {
  const text = await file.text()
  let json: ExportJsonShape

  try {
    json = JSON.parse(text) as ExportJsonShape
  } catch {
    throw new Error("File JSON không hợp lệ")
  }

  const session = json.data?.ClassRegisterSession?.[0]
  if (!session?.id || !session?.name) {
    throw new Error("Không tìm thấy thông tin đợt đăng ký (ClassRegisterSession) trong file")
  }

  const semester =
    json.data?.Semester?.find((s) => s.id === session.semesterId) ?? json.data?.Semester?.[0]
  const schoolYear = json.data?.SchoolYear?.[0]

  return {
    version: json.version ?? "—",
    exportedAt: json.exportedAt,
    sessionId: session.id,
    sessionName: session.name,
    semesterName: semester?.name,
    schoolYearName: schoolYear?.name,
    startDate: session.startDate,
    endDate: session.endDate,
    active: session.active,
    recordCounts: json.counts,
  }
}
