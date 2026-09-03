import "core-js/proposals/array-grouping-v2"
import type { Prisma, ScoreConvert, StudentSubjectScore } from "@workspace/db"
import { $Enums, SubjectClassType } from "@workspace/db"
import dayjs from "dayjs"
import Decimal from "decimal.js"
import { doReadNumber, InvalidNumberError, ReadingConfig } from "read-vietnamese-number" // or CDN URL

export { fastIsEqual } from "./fast-is-equal"

declare const window: (Window & typeof globalThis & Record<string, any>) | undefined

export const env = {
  NEXT_PUBLIC_APP_CODE: process.env.NEXT_PUBLIC_APP_CODE,
  NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  NEXT_PUBLIC_API_MODEL_BASE_URL: process.env.NEXT_PUBLIC_API_MODEL_BASE_URL,
  NEXT_PUBLIC_MINIO_ENDPOINT: process.env.NEXT_PUBLIC_MINIO_ENDPOINT,
  NEXT_PUBLIC_AUTH_ISSUER: process.env.NEXT_PUBLIC_AUTH_ISSUER,
  NEXT_PUBLIC_ASSET_PREFIX: process.env.NEXT_PUBLIC_ASSET_PREFIX,
  NEXT_PUBLIC_CHATBOT_SRC: process.env.NEXT_PUBLIC_CHATBOT_SRC,
  NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
  NEXT_PUBLIC_ONLY_OFFICE_ENDPOINT: process.env.NEXT_PUBLIC_ONLY_OFFICE_ENDPOINT,
  NEXT_PUBLIC_API_UPLOAD_URL: process.env.NEXT_PUBLIC_API_UPLOAD_URL,
  NEXT_PUBLIC_CHAT_BOT_URL: process.env.NEXT_PUBLIC_CHAT_BOT_URL,
  NEXT_PUBLIC_DOC_CHAT_BOT_URL: process.env.NEXT_PUBLIC_DOC_CHAT_BOT_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_LMS_BASE_URL: process.env.NEXT_PUBLIC_API_LMS_BASE_URL,
  NEXT_PUBLIC_API_SYSTEM_BASE_URL: process.env.NEXT_PUBLIC_API_SYSTEM_BASE_URL,
  NEXT_PUBLIC_API_PORTAL_BASE_URL: process.env.NEXT_PUBLIC_API_PORTAL_BASE_URL,
  NEXT_PUBLIC_API_EMS_BASE_URL: process.env.NEXT_PUBLIC_API_EMS_BASE_URL,
  NEXT_PUBLIC_API_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_API_PUBLIC_BASE_URL,
  NEXT_PUBLIC_CLIENT_ID: process.env.NEXT_PUBLIC_CLIENT_ID,
  NEXT_PUBLIC_CLIENT_SECRET: process.env.NEXT_PUBLIC_CLIENT_SECRET,
  NEXT_PUBLIC_ROOT_ORG_CODE: process.env.NEXT_PUBLIC_ROOT_ORG_CODE,
}

export type ConfigKeys =
  | "NEXT_PUBLIC_APP_CODE"
  | "NEXT_PUBLIC_ENVIRONMENT"
  | "NEXT_PUBLIC_API_MODEL_BASE_URL"
  | "NEXT_PUBLIC_MINIO_ENDPOINT"
  | "NEXT_PUBLIC_AUTH_ISSUER"
  | "NEXT_PUBLIC_ASSET_PREFIX"
  | "NEXT_PUBLIC_CHATBOT_SRC"
  | "NEXT_PUBLIC_BASE_PATH"
  | "NEXT_PUBLIC_ONLY_OFFICE_ENDPOINT"
  | "NEXT_PUBLIC_API_UPLOAD_URL"
  | "NEXT_PUBLIC_CHAT_BOT_URL"
  | "NEXT_PUBLIC_DOC_CHAT_BOT_URL"
  | "NEXT_PUBLIC_APP_URL"
  | "NEXT_PUBLIC_API_LMS_BASE_URL"
  | "NEXT_PUBLIC_API_SYSTEM_BASE_URL"
  | "NEXT_PUBLIC_API_PORTAL_BASE_URL"
  | "NEXT_PUBLIC_API_EMS_BASE_URL"
  | "NEXT_PUBLIC_API_PUBLIC_BASE_URL"
  | "NEXT_PUBLIC_ROOT_ORG_CODE"

export const getRuntimeEnv = (name: ConfigKeys): string => {
  if (typeof window === "undefined") {
    return env[name] || ""
  }

  const config = window?.[name] || env[name] || ""

  if (!config) {
    console.warn("Runtime config not found on window", name)
    return ""
  }

  return config
}

export function isNullish<T>(value: T) {
  return value === null || value === undefined
}

export function normalizeVietnamese(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
}

/** Bỏ khoảng trắng đầu/cuối và gom khoảng trắng thừa (kể cả NBSP từ Excel). */
export function normalizeCatalogName(value?: string | null) {
  if (value == null) return ""
  return String(value).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
}

export function filterOption(input: any, option: any) {
  const label = String(option?.label ?? "")
  return label.toLowerCase().includes(input.toLowerCase())
}

export function fuzzyMatch(input: string, label: string): boolean {
  const normInput = normalizeVietnamese(input)
  const normLabel = normalizeVietnamese(label)

  // 1. Nếu chứa trực tiếp
  if (normLabel.includes(normInput)) return true

  // 2. Nếu là viết tắt
  let i = 0
  let j = 0
  while (i < normInput.length && j < normLabel.length) {
    if (normInput[i] === normLabel[j]) i++
    j++
  }
  return i === normInput.length
}

export const isDevEnvironment = () => {
  return window?.location.host?.includes("localhost")
}

export const capitalizeFirstLetter = (str = ""): string =>
  str.charAt(0).toUpperCase() + str.slice(1)

export const numberToWords = (num: number): string => {
  const numberWords = [
    "không",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
    "mười",
  ]

  if (Number.isInteger(num) && num >= 0 && num <= 10) {
    return capitalizeFirstLetter(numberWords[num])
  }

  if (num > 0 && num < 10.99) {
    const integerPart = Math.floor(num)
    const decimalPart = Math.round((num - integerPart) * 10)

    if (decimalPart === 0) {
      return capitalizeFirstLetter(numberWords[integerPart])
    }

    return `${capitalizeFirstLetter(numberWords[integerPart])} phẩy ${numberWords[decimalPart]}`
  }

  return num ? num.toString() : ""
}

export const getMinioUrl = (uri: string | undefined | null) => {
  if (!uri) return ""
  if (uri.startsWith("blob")) return uri
  const publicEndpoint =
    getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT") ||
    process?.env?.MINIO_ENDPOINT ||
    "https://minio.swantech.vn"
  // Nếu là absolute URL nhưng đang trỏ tới host nội bộ không resolve được
  // (vd minio.mta.swantech.vn) thì rewrite sang public endpoint, giữ nguyên
  // path + query (signature presigned vẫn hợp lệ vì MinIO cấu hình MINIO_SERVER_URL).
  if (uri.startsWith("http")) {
    try {
      const src = new URL(uri)
      if (src.hostname === "minio.mta.swantech.vn") {
        const target = new URL(publicEndpoint)
        src.protocol = target.protocol
        src.hostname = target.hostname
        src.port = target.port
        return src.toString()
      }
    } catch {
      // noop — trả nguyên uri nếu không parse được
    }
    return uri
  }
  return new URL(uri, publicEndpoint).href
}

export function range(start: number, end: number): number[] {
  const result: number[] = []
  for (let i = start; i < end; i++) {
    result.push(i)
  }
  return result
}

export function parseDate(date?: string): dayjs.Dayjs {
  const dateFormats = [
    // Year = 4 digits
    "D/M/YYYY",
    "DD/M/YYYY",
    "D/MM/YYYY",
    "DD/MM/YYYY",

    // Year = 2 digits
    "D/M/YY",
    "DD/M/YY",
    "D/MM/YY",
    "DD/MM/YY",
  ]

  const trimmed = date?.replace(/^[']+|[']+$/g, "")
  return dayjs(trimmed, dateFormats, true)
}

type StudentSubjectScoreRelation = StudentSubjectScore & {
  finalScore: Decimal | null
  attendanceScore?: number | null
  midtermScore?: number | null
  examScore?: number | null
  student?: {
    fixedClass?: {
      trainingCourse?: {
        scoreConverts?: ScoreConvert[] | null
        scoreToPass?: number | null
        scoreToPassGraduation?: number | null
        scoreToPassConditional?: number | null
        scoreToTakeExam?: number | null
        examScoreToPass?: number | null
      } | null
    } | null
  }
}
declare global {
  interface Number {
    toFixedSmart(fractionDigits: number): string
    formatVND(): string
    toVndWord(unit?: string, firstCase?: boolean): string
    toRoman(): string
  }
  interface String {
    titleCase(): string
    firstCase(): string
  }
  interface Array<T> {
    compare(otherArray: T[], cb: (a: T, b: T) => boolean): boolean
    uniqueByKey<K extends keyof T>(key: K): T[]
    uniqueByKeys<K extends keyof T>(keys: K[]): T[]
    flatten<K extends keyof T>(key: K): T[]
    sortVietnameseName<K extends keyof T>(key: K): T[]
  }
}

type ScoreStats = { count: number; percentage: number }

Number.prototype.toRoman = function (): string {
  // A lookup object mapping Roman numeral symbols to their integer values,
  // ordered by value from largest to smallest.
  let num = this.valueOf()
  const romanValues = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  } as Record<string, number>
  let roman = ""

  // Iterate over the lookup object
  for (const key in romanValues) {
    const romanValue = romanValues[key as keyof typeof romanValues]

    // While the number is greater than or equal to the current value
    while (romanValue && num >= romanValue) {
      // Append the Roman symbol to the result string
      roman += key
      // Subtract the value from the number
      num -= romanValue
    }
  }
  return roman
}

Number.prototype.toVndWord = function (unit = "", firstCase = true): string {
  const config = new ReadingConfig()
  config.unit = [unit]
  try {
    // Start reading
    const result = doReadNumber(this.toString(), config)
    if (firstCase) {
      return result.firstCase()
    }
    return result
  } catch (err) {
    // Handle errors
    if (err instanceof InvalidNumberError) {
      console.error("Số không hợp lệ")
    } else {
      console.error(err)
    }
    return ""
  }
}

Number.prototype.toFixedSmart = function (fractionDigits: number): string {
  const fixed = this.toFixed(fractionDigits)
  return fixed.includes(".") ? fixed.replace(/\.?0+$/, "") : fixed
}
Number.prototype.formatVND = function (): string {
  return this.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
    .replace("₫", "VNĐ")
    .trim()
}
String.prototype.titleCase = function (): string {
  return this.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}
String.prototype.firstCase = function (): string {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase()
}

Array.prototype.compare = function <T>(
  this: T[],
  otherArray: T[],
  cb: (a: T, b: T) => boolean
): boolean {
  if (this.length !== otherArray.length) {
    return false
  }
  for (let i = 0; i < this.length; i++) {
    const otherItem = otherArray[i]
    const thisItem = this[i]
    if (!thisItem || !otherItem) {
      return false
    }
    if (!cb(thisItem, otherItem)) {
      return false
    }
  }
  return true
}

Array.prototype.flatten = function <T, K extends keyof T>(this: T[], key: K): T[] {
  const stack = [...this]
  const result = []
  while (stack.length) {
    const shift = stack.shift()
    if (!shift) continue
    const { [key]: children, ...node } = shift as any
    result.push(node)
    if (children?.length) {
      stack.unshift(...children)
    }
  }

  return result
}

Array.prototype.uniqueByKey = function <T, K extends keyof T>(this: T[], key: K): T[] {
  const seen = new Set<T[K]>()
  return this.filter((item) => {
    if (!seen.has(item[key])) {
      seen.add(item[key])
      return true
    }
    return false
  })
}

Array.prototype.uniqueByKeys = function <T, K extends keyof T>(this: T[], keys: K[]): T[] {
  const seen = new Set<string>()
  return this.filter((item) => {
    const composite = keys.map((key) => String(item[key])).join("|")
    if (!seen.has(composite)) {
      seen.add(composite)
      return true
    }
    return false
  })
}

Array.prototype.sortVietnameseName = function <T, K extends keyof T>(this: T[], key: K) {
  return this.sort((a, b) => {
    const splitName = (name: string) => {
      const parts = name.trim().split(" ")
      return {
        firstName: parts.pop() ?? "",
        lastName: parts.shift() ?? "",
        middleName: parts.join(" "),
      }
    }
    const nameA = splitName(a[key] as unknown as string)
    const nameB = splitName(b[key] as unknown as string)
    return (
      nameA.firstName.localeCompare(nameB.firstName, "vi") ||
      nameA.lastName.localeCompare(nameB.lastName, "vi") ||
      nameA.middleName.localeCompare(nameB.middleName, "vi")
    )
  })
}

export function splitFullName(fullName?: string): {
  firstName: string
  lastName: string
} {
  if (!fullName || typeof fullName !== "string") {
    return { firstName: "", lastName: "" }
  }
  const parts = fullName.trim().split(/\s+/)

  const firstName = parts.pop() || "" // Lấy phần cuối cùng làm tên
  const lastName = parts.join(" ") || "" // Phần còn lại là họ + tên đệm

  return { firstName, lastName }
}

export function formatLecturerName(
  lecturer?: Prisma.LecturerGetPayload<{
    select: {
      userProfile: {
        select: {
          fullname: true
          academicRankType: { select: { sMa: true } }
          academicDegreeType: { select: { sMa: true } }
        }
      }
      code: true
    }
  }> | null
) {
  if (!lecturer) return ""

  const prefix = [
    lecturer.userProfile?.academicRankType?.sMa,
    lecturer.userProfile?.academicDegreeType?.sMa,
  ]
    .filter(Boolean)
    .join(".")

  const fullname = lecturer.userProfile?.fullname ?? ""
  const codeSuffix = lecturer.code ? ` - ${lecturer.code}` : ""

  return `${prefix ? `${prefix} ` : ""}${fullname}${codeSuffix}`.trim()
}

const UNDERGRAD_LEVEL_CODES = new Set(["ĐH", "DH"])

function normalizeScoreLookup(value?: string | null) {
  return (value ?? "").trim().toLowerCase().normalize("NFC")
}

/** Đại học dân sự: type CIVILIAN + bậc Đại học (không gồm thạc sĩ/tiến sĩ dân sự). */
export function isUndergraduateCivilian(course?: {
  trainingObjectType?: {
    type?: string | null
    name?: string | null
    trainingLevel?: { code?: string | null; name?: string | null } | null
  } | null
} | null): boolean {
  const objectType = course?.trainingObjectType
  if (objectType?.type !== $Enums.TrainingObjectTypes.CIVILIAN) return false

  const levelCode = (objectType.trainingLevel?.code ?? "").trim().toUpperCase().normalize("NFC")
  if (UNDERGRAD_LEVEL_CODES.has(levelCode)) return true

  const levelName = normalizeScoreLookup(objectType.trainingLevel?.name)
  if (levelName) {
    if (
      levelName.includes("thạc") ||
      levelName.includes("tiến") ||
      levelName.includes("sau đại học")
    ) {
      return false
    }
    if (levelName.includes("đại học") || levelName.includes("dai hoc")) return true
  }

  const objectName = normalizeScoreLookup(objectType.name)
  return (
    (objectName.includes("đại học dân sự") || objectName.includes("dai hoc dan su")) &&
    !objectName.includes("sau đại học")
  )
}

export type TrainingCourseScoreCoef = Prisma.TrainingCourseGetPayload<{
  select: {
    coef_1: true
    coef_2: true
    coef_3: true
    scoreToTakeExam: true
    scoreToPass: true
    maxReExamScore: true
    reduceReExamScore: true
    examScoreToPass: true
  }
}> & {
  trainingObjectType?: {
    type?: string | null
    name?: string | null
    trainingLevel?: { code?: string | null; name?: string | null } | null
  } | null
}

export const calcFinalScore = (
  coef: TrainingCourseScoreCoef,
  subjectScore: Prisma.StudentSubjectScoreGetPayload<{
    select: {
      certificates: {
        select: {
          archivedCertificate: {
            select: {
              finalScore: true
            }
          }
        }
      }
      awards: {
        select: {
          status: true
          archivedAward: {
            select: {
              bonusScore: true
            }
          }
        }
      }
      attendanceScore: true
      midtermScore: true
      examScore: true
    }
  }>,
  subjectClassType: SubjectClassType
): Decimal | null => {
  if (!coef || !subjectScore) return null
  // 1. Find max certificate final score
  const maxCertFinalScore = subjectScore.certificates?.length
    ? Decimal.max(
        ...subjectScore.certificates.map((cert) => cert?.archivedCertificate?.finalScore)
      ).toDecimalPlaces(1)
    : null

  // 2. Check if any score is null
  if (
    subjectScore.attendanceScore === null ||
    subjectScore.midtermScore === null ||
    subjectScore.examScore === null
  ) {
    return maxCertFinalScore || null
  }

  // 3. Check if not enough to take exam
  if (
    subjectScore.attendanceScore < coef.scoreToTakeExam ||
    subjectScore.midtermScore < coef.scoreToTakeExam
  ) {
    return new Decimal(0)
  }

  // 3.5 Check exam score
  if (subjectScore.examScore < coef.examScoreToPass) {
    // Đại học dân sự: điểm thi dưới ngưỡng → điểm HP = 0. Đối tượng khác: điểm HP = điểm thi.
    if (isUndergraduateCivilian(coef)) {
      return new Decimal(0)
    }
    return new Decimal(subjectScore.examScore).toDecimalPlaces(1)
  }

  // 4. Calculate final score
  let finalScore = Math.min(
    new Decimal(subjectScore.attendanceScore)
      .mul(coef.coef_1)
      .add(new Decimal(subjectScore.midtermScore).mul(coef.coef_2))
      .add(new Decimal(subjectScore.examScore).mul(coef.coef_3))
      .toNumber(),
    10
  )

  // 4.5 Check reexam score
  if (subjectClassType === SubjectClassType.REEXAM) {
    if (finalScore >= coef.scoreToPass && finalScore <= coef.scoreToPass + coef.reduceReExamScore) {
      finalScore = coef.scoreToPass
    } else {
      finalScore = Math.min(finalScore - coef.reduceReExamScore, coef.maxReExamScore)
    }
  }

  if (maxCertFinalScore === null && finalScore < coef.scoreToPass) {
    return new Decimal(finalScore).toDecimalPlaces(1)
  }

  const bonusScore = subjectScore.awards
    .filter((a) => a.status === "APPROVED")
    .reduce((prev, curr) => prev + curr?.archivedAward?.bonusScore, 0)

  return Decimal.min(
    Decimal.max(finalScore, maxCertFinalScore || 0).add(bonusScore),
    subjectClassType === SubjectClassType.REEXAM ? coef.maxReExamScore : 10
  ).toDecimalPlaces(1)
}

export type ScoreConvertRange = {
  base10Min: number
  base10Max: number
  base4: number
  letter: string
  classification: string
  pass: boolean
  improvementRegister?: boolean
}

export type ConvertedScore = {
  base4: number | null
  letter: string
  classification: string
  pass: boolean
  improvementRegister: boolean
}

export type CourseScoreConfig = {
  attendanceScore?: number | null
  midtermScore?: number | null
  examScore?: number | null
  isGraduation?: boolean
  isConditional?: boolean
  scoreToTakeExam?: number | null
  examScoreToPass?: number | null
  scoreToPass?: number | null
  scoreToPassGraduation?: number | null
  scoreToPassConditional?: number | null
}

const FAILED_CONVERTED_SCORE: ConvertedScore = {
  base4: 0,
  letter: "F",
  classification: "",
  pass: false,
  improvementRegister: false,
}

function toScoreNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "object" && "toNumber" in value) {
    const n = (value as { toNumber: () => number }).toNumber()
    return Number.isFinite(n) ? n : null
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function courseScoreConfigFrom(
  course?: {
    scoreToTakeExam?: number | null
    examScoreToPass?: number | null
    scoreToPass?: number | null
    scoreToPassGraduation?: number | null
    scoreToPassConditional?: number | null
  } | null,
  scores?: {
    attendanceScore?: number | null
    midtermScore?: number | null
    examScore?: number | null
  } | null,
  flags?: { isGraduation?: boolean; isConditional?: boolean }
): CourseScoreConfig {
  return {
    scoreToTakeExam: course?.scoreToTakeExam,
    examScoreToPass: course?.examScoreToPass,
    scoreToPass: course?.scoreToPass,
    scoreToPassGraduation: course?.scoreToPassGraduation,
    scoreToPassConditional: course?.scoreToPassConditional,
    attendanceScore: scores?.attendanceScore,
    midtermScore: scores?.midtermScore,
    examScore: scores?.examScore,
    isGraduation: flags?.isGraduation,
    isConditional: flags?.isConditional,
  }
}

/** Trượt theo cấu hình khóa: điểm thi/CC/GK dưới ngưỡng, hoặc điểm HP dưới điểm qua môn. */
export function isFailedByCourseConfig(
  config: CourseScoreConfig,
  finalScore?: number | null
): boolean {
  const attendanceScore = toScoreNumber(config.attendanceScore)
  const midtermScore = toScoreNumber(config.midtermScore)
  const examScore = toScoreNumber(config.examScore)
  const scoreToTakeExam = toScoreNumber(config.scoreToTakeExam)
  const examScoreToPass = toScoreNumber(config.examScoreToPass)

  if (attendanceScore != null && scoreToTakeExam != null && attendanceScore < scoreToTakeExam) {
    return true
  }
  if (midtermScore != null && scoreToTakeExam != null && midtermScore < scoreToTakeExam) {
    return true
  }
  if (examScore != null && examScoreToPass != null && examScore < examScoreToPass) {
    return true
  }

  const score = toScoreNumber(finalScore)
  if (score == null) return false

  if (config.isGraduation) {
    const min = toScoreNumber(config.scoreToPassGraduation)
    return min != null && score < min
  }
  if (config.isConditional) {
    const min = toScoreNumber(config.scoreToPassConditional)
    return min != null && score < min
  }
  const min = toScoreNumber(config.scoreToPass)
  return min != null && score < min
}

export function convertScoreByRange(
  finalScore: number,
  scoreRanges: ScoreConvertRange[] = []
): ConvertedScore {
  const sortedRanges = [...scoreRanges].sort((a, b) => b.base10Min - a.base10Min)
  const matched = sortedRanges.find(
    (range) => finalScore >= range.base10Min && finalScore <= range.base10Max
  )

  if (!matched) {
    return {
      base4: null,
      letter: "-",
      classification: "Không xác định",
      pass: false,
      improvementRegister: false,
    }
  }

  return {
    base4: matched.base4,
    letter: matched.letter,
    classification: matched.classification,
    pass: matched.pass,
    improvementRegister: matched.improvementRegister ?? false,
  }
}

export function convertScoreWithCourseConfig(
  finalScore: number,
  scoreRanges: ScoreConvertRange[] = [],
  config?: CourseScoreConfig
): ConvertedScore {
  if (config && isFailedByCourseConfig(config, finalScore)) {
    return { ...FAILED_CONVERTED_SCORE }
  }
  return convertScoreByRange(finalScore, scoreRanges)
}

function getScoreClassification(
  finalScore: Decimal | null,
  examScore: Decimal | number | null,
  scoreConverts: ScoreConvert[],
  config?: CourseScoreConfig
) {
  // Nếu không có điểm thi ⇒ coi là Vắng
  if (examScore === null || examScore === undefined) {
    return { classification: "Không đạt", base10Max: null }
  }

  if (config && isFailedByCourseConfig(config, toScoreNumber(finalScore))) {
    return { classification: "Không đạt", base10Max: null }
  }

  // Nếu có điểm cuối cùng (finalScore), tìm classification
  const rank = scoreConverts.find(
    (item) => finalScore?.gte(item.base10Min) && finalScore?.lte(item.base10Max)
  )

  const classification = rank
    ? `${rank.classification}${rank.pass ? "" : "(Không đạt)"}`
    : "Không xác định"

  const base10Max = rank ? rank.base10Max : null

  return { classification, base10Max }
}

export function getScoreStatistics(
  dataTable: StudentSubjectScoreRelation[]
): Record<string, ScoreStats> {
  if (!dataTable.length) {
    return {}
  }

  const stats = new Map<string, { count: number; base10Max: number | null }>()

  dataTable.forEach((row) => {
    const finalScore = row.finalScore
    const examScore = row?.examScore ?? null
    const trainingCourse = row?.student?.fixedClass?.trainingCourse
    const scoreConverts = trainingCourse?.scoreConverts ?? []
    const config = courseScoreConfigFrom(trainingCourse, {
      attendanceScore: row?.attendanceScore,
      midtermScore: row?.midtermScore,
      examScore,
    })

    const { classification, base10Max } = getScoreClassification(
      finalScore,
      examScore,
      scoreConverts,
      config
    )

    const entry = stats.get(classification)
    if (entry) {
      entry.count += 1
    } else {
      stats.set(classification, { count: 1, base10Max })
    }
  })

  const total = dataTable.length
  const result: Record<string, ScoreStats> = {}
  let accumulatedPercentage = 0

  const entries = Array.from(stats.entries()).sort(
    (a, b) => Number(a[1].base10Max) - Number(b[1].base10Max)
  )

  entries.forEach(([classification, { count }], index) => {
    let percentage: number

    if (index === entries.length - 1) {
      percentage = Number.parseFloat((100 - accumulatedPercentage).toFixed(2))
    } else {
      percentage = Number.parseFloat(((count / total) * 100).toFixed(2))
      accumulatedPercentage += percentage
    }

    result[classification] = { count, percentage }
  })

  return result
}

export type ItemProps = {
  value: string
  label: string
  title?: string
  isParent?: boolean
}
export function diffArrays<T, K extends keyof T>(a: T[], b: T[], key: K) {
  const onlyInA = a.filter((itemA) => !b.some((itemB) => itemA[key] === itemB[key]))

  const onlyInB = b.filter((itemB) => !a.some((itemA) => itemA[key] === itemB[key]))

  const both = a.filter((itemA) => b.some((itemB) => itemA[key] === itemB[key]))

  return { onlyInA, onlyInB, both }
}

export function diffArraysKey<T>(a: T[], b: T[], keys: (keyof T)[]) {
  const getKey = (item: T) => keys.map((k) => String(item[k])).join("|")

  const bKeys = new Set(b.map(getKey))
  const aKeys = new Set(a.map(getKey))

  const onlyInA = a.filter((itemA) => !bKeys.has(getKey(itemA)))
  const onlyInB = b.filter((itemB) => !aKeys.has(getKey(itemB)))
  const both = a.filter((itemA) => bKeys.has(getKey(itemA)))

  return { onlyInA, onlyInB, both }
}

export function getFilenameFromContentDisposition(contentDispositionHeader: string): string | null {
  if (!contentDispositionHeader) {
    return null
  }

  // Regex to match filename or filename*
  const utf8FilenameRegex = /filename\*=UTF-8''([\w%-.]+)(?:; ?|$)/i
  const asciiFilenameRegex = /filename=(["]?)(.*?)\1(?:; ?|$)/i

  let filename = null

  // Try to match UTF-8 encoded filename first
  let match = contentDispositionHeader.match(utf8FilenameRegex)
  if (match?.[1]) {
    filename = decodeURIComponent(match[1])
  } else {
    // If no UTF-8, try ASCII filename
    match = contentDispositionHeader.match(asciiFilenameRegex)
    if (match?.[2]) {
      filename = match[2].replace(/"/g, "") // Remove quotes
    }
  }

  return filename
}

export function genOriginalDiplomaNumber({
  prefix,
  suffix,
  currentNumber,
  maxLength,
}: {
  prefix?: string | null
  suffix?: string | null
  currentNumber?: number | null
  maxLength?: number | null
}): string {
  const serial =
    currentNumber && maxLength
      ? currentNumber.toString().padStart(maxLength, "0")
      : (currentNumber ?? "")
  return `${prefix || ""}${serial}${suffix || ""}`
}

export function* chunk<T>(arr: T[], size: number): Generator<T[]> {
  for (let i = 0; i < arr.length; i += size) {
    yield arr.slice(i, i + size)
  }
}

/** Hiển thị điểm câu hỏi (0.25, 0.5, 1…) — tránh toFixed(1) làm 0.25 → 0.3 */
export function formatQuestionPoint(point?: number | null): string {
  if (point == null || Number.isNaN(point)) return "0"
  const rounded = Math.round(point * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}
