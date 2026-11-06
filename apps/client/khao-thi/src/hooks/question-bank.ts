import { useFindFirstQuestionBank, useUpsertQuestionBank } from "@workspace/db/hooks"

export const DEFAULT_QUESTION_BANK_NAME = "Ngân hàng câu hỏi mặc định"

/**
 * Câu hỏi giờ được lưu theo khung đề (qua chuẩn đầu ra), không lưu tại kho nữa.
 * Question.questionBankId vẫn bắt buộc trong schema nên dùng 1 ngân hàng ẩn cho mỗi môn học:
 * lấy ngân hàng đang có của môn học, nếu chưa có thì tạo ngân hàng mặc định.
 */
const useEnsureQuestionBank = (subjectVersionId?: string) => {
  const { data: questionBank } = useFindFirstQuestionBank(
    {
      where: { subjectVersionId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    },
    { enabled: !!subjectVersionId }
  )

  const { mutateAsync: upsertQuestionBank } = useUpsertQuestionBank()

  const ensureQuestionBankId = async (): Promise<string | undefined> => {
    if (!subjectVersionId) return undefined
    if (questionBank?.id) return questionBank.id

    const res = await upsertQuestionBank({
      where: {
        subjectVersionId_name: { subjectVersionId, name: DEFAULT_QUESTION_BANK_NAME },
      },
      create: { subjectVersionId, name: DEFAULT_QUESTION_BANK_NAME },
      update: { deletedAt: null },
    })
    return res?.id
  }

  return { ensureQuestionBankId }
}

export default useEnsureQuestionBank
