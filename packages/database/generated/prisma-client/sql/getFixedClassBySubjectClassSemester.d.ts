import * as $runtime from "../runtime/library"

/**
 * @param semesterYear
 * @param semesterType
 * @param subjectClassId
 * @param search
 * @param page
 * @param pageSize
 */
export const getFixedClassBySubjectClassSemester: (semesterYear: number, semesterType: number, subjectClassId: string, search: string | null, page: number, pageSize: number) => $runtime.TypedSql<getFixedClassBySubjectClassSemester.Parameters, getFixedClassBySubjectClassSemester.Result>

export namespace getFixedClassBySubjectClassSemester {
  export type Parameters = [semesterYear: number, semesterType: number, subjectClassId: string, search: string | null, page: number, pageSize: number]
  export type Result = {
    full_count: bigint | null
    fixedClassId: string
  }
}
