import * as $runtime from "../runtime/library"

/**
 * @param questionBankId
 * @param questionType
 * @param point
 * @param knowledgeBlockId
 * @param limit
 */
export const getRandomQuestionIDs: (questionBankId: string, questionType: string, point: number, knowledgeBlockId: string | null, limit: number) => $runtime.TypedSql<getRandomQuestionIDs.Parameters, getRandomQuestionIDs.Result>

export namespace getRandomQuestionIDs {
  export type Parameters = [questionBankId: string, questionType: string, point: number, knowledgeBlockId: string | null, limit: number]
  export type Result = {
    id: string
  }
}
