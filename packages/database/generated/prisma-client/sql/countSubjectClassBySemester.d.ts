import * as $runtime from "../runtime/library"

/**
 * @param semesterYear
 * @param semesterType
 * @param trainingCourseId
 * @param search
 * @param trainingMajorId
 * @param trainingObjectTypeId
 */
export const countSubjectClassBySemester: (semesterYear: number, semesterType: number, trainingCourseId: string | null, search: string | null, trainingMajorId: string | null, trainingObjectTypeId: string) => $runtime.TypedSql<countSubjectClassBySemester.Parameters, countSubjectClassBySemester.Result>

export namespace countSubjectClassBySemester {
  export type Parameters = [semesterYear: number, semesterType: number, trainingCourseId: string | null, search: string | null, trainingMajorId: string | null, trainingObjectTypeId: string]
  export type Result = {
    total: bigint | null
  }
}
