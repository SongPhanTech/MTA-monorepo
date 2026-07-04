/** Model ZModel thuộc schema `khao-thi` — dùng lọc OpenAPI Zenstack cho be-khao-thi. */
export const KHAO_THI_MODEL_NAMES = [
  "SurveyObjectType",
  "SurveyTopic",
  "SurveyQuestionGroup",
  "ClusterSurvey",
  "Survey",
  "SurveyQuestion",
  "SpecificChoice",
  "SurveyChoice",
  "SurveySession",
  "SurveyResponse",
  "QuestionBank",
  "Question",
  "MultipleChoiceOption",
  "FillInBlankSlot",
  "OrderingItem",
  "Exam",
  "ExamRoom",
  "ExamList",
  "ExamBank",
  "ExamBankQuestion",
  "ExamPaper",
  "ExamFramework",
  "ExamMatrix",
  "KnowledgeBlock",
  "ConfigExam",
  "EvaluationPeriod",
  "EvaluationStandardSet",
  "StandardCatalog",
  "CriterionCatalog",
  "EvidenceCategory",
  "Evidence",
  "EvaluationCriterionComment",
  "RequirementCriterionCatalog",
  "StandardPeriod",
  "CriterionPeriod",
  "AnalysisCriterion",
  "EvaluationCriterion",
  "RequirementCriterion",
  "AnalysisFormEvidence",
  "EvaluationCouncil",
  "EvaluationCouncilMember",
  "EvidenceFile",
] as const

function toModelPathSegment(modelName: string): string {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1)
}

export const KHAO_THI_MODEL_PATH_SEGMENTS = new Set(KHAO_THI_MODEL_NAMES.map(toModelPathSegment))

export function isKhaoThiModelPath(path: string): boolean {
  const match = path.match(/^\/api\/model\/([^/]+)/)
  if (!match?.[1]) return false
  return KHAO_THI_MODEL_PATH_SEGMENTS.has(match[1])
}
