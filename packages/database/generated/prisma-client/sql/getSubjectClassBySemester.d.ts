import * as $runtime from "../runtime/library"

/**
 * @param semesterYear
 * @param semesterType
 * @param trainingCourseId
 * @param search
 * @param trainingMajorId
 * @param page
 * @param pageSize
 */
export const getSubjectClassBySemester: (semesterYear: number, semesterType: number, trainingCourseId: string | null, search: string | null, trainingMajorId: string | null, page: number, pageSize: number) => $runtime.TypedSql<getSubjectClassBySemester.Parameters, getSubjectClassBySemester.Result>

export namespace getSubjectClassBySemester {
  export type Parameters = [semesterYear: number, semesterType: number, trainingCourseId: string | null, search: string | null, trainingMajorId: string | null, page: number, pageSize: number]
  export type Result = {
    data: $runtime.JsonValue | null
  }
}
