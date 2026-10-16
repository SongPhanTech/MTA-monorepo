import type { PlvbAppendixSubject, PlvbPrintVariant } from "./plvb-print-settings"

export type PlvbPrintStudentSemester = {
  id: string
  name: string
  subjects: Array<
    PlvbAppendixSubject & {
      id?: string
      key?: string
      subjectKey?: string | null
      hocKyDuKien?: number | null
      stt?: number
    }
  >
}

export type PlvbPrintStudent = {
  id: string
  from?: Date | string | null
  userProfile: {
    fullname?: string | null
    code?: string | null
    dateOfBirth?: Date | string | null
    placeOfBirth?: string | null
    [key: string]: unknown
  }
  graduationDecision?: {
    diplomaNumber?: string | null
    originalDiplomaNumber?: string | null
    /** Prisma `Decimal` | number | string */
    finalGpa?: unknown
    finalRanking?: { classification?: string | null } | null
    trainingMajor?: {
      name?: string | null
      trainingField?: { name?: string | null } | null
    } | null
    diplomaType?: { name?: string | null } | null
  } | null
  fixedClass?: {
    name?: string | null
    trainingCourse?: {
      name?: string | null
      admissionStartDate?: Date | string | null
      trainingLanguage?: { name?: string | null } | null
      academicRankingConvert?: Array<{
        context?: string
        graduated?: boolean
        baseScore?: string
        base4Min?: number
        base4Max?: number
        base10Min?: number
        base10Max?: number
        classification?: string
      }>
      scoreConverts?: Array<{
        letter?: string | null
        base4?: number | null
        base10Min?: number | null
        base10Max?: number | null
      }>
    } | null
    curriculumVersion?: {
      trainingType?: { name?: string | null } | null
      trainingTime?: { name?: string | null } | null
      trainingLevel?: { name?: string | null } | null
      trainingLanguage?: { name?: string | null } | null
      diplomaType?: { name?: string | null } | null
      curriculum?: {
        trainingMajor?: {
          name?: string | null
          trainingField?: { name?: string | null } | null
        } | null
      } | null
    } | null
  } | null
  curriculumVersion?: {
    trainingType?: { name?: string | null } | null
    trainingTime?: { name?: string | null } | null
    trainingLevel?: { name?: string | null } | null
    trainingLanguage?: { name?: string | null } | null
    diplomaType?: { name?: string | null } | null
  } | null
  semesters: PlvbPrintStudentSemester[]
}

export type ModalPrintPhuLucVbInput = {
  students: PlvbPrintStudent[]
  printDate?: string
  signerName?: string
  defaultColumns?: 1 | 2
  /** military = hệ QS; international = hệ quốc tế */
  variant?: PlvbPrintVariant
}
