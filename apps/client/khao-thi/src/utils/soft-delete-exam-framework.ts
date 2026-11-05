import { queryClient } from "@api/index"
import { sqlTransaction } from "@workspace/libs/api/model"
import type { SqlTransactionItem } from "@workspace/libs/api/schemas/sqlTransactionItem"

/**
 * Xoá mềm khung đề / ma trận / chuẩn đầu ra.
 * `code` là @unique trên toàn hệ thống, xoá mềm vẫn giữ bản ghi nên phải đặt code = null
 * để tạo lại được mã cũ. Xoá cha thì xoá luôn các con để không còn chuẩn đầu ra "mồ côi" giữ mã.
 */
const softDeleteData = () => ({ deletedAt: new Date(), code: null })

const knowledgeBlockOp = (where: object): SqlTransactionItem => ({
  model: "KnowledgeBlock",
  operation: "updateMany",
  data: { where: { ...where, deletedAt: null }, data: softDeleteData() },
})

const examMatrixOp = (where: object): SqlTransactionItem => ({
  model: "ExamMatrix",
  operation: "updateMany",
  data: { where: { ...where, deletedAt: null }, data: softDeleteData() },
})

const run = async (operations: SqlTransactionItem[]) => {
  const res = await sqlTransaction(operations)
  if (res.status !== 200) throw new Error("Xoá thất bại")

  for (const model of ["ExamFramework", "ExamMatrix", "KnowledgeBlock", "Question", "DM_DonVi"]) {
    queryClient.invalidateQueries({ queryKey: ["zenstack", model] })
  }
}

export const softDeleteKnowledgeBlock = (id: string) => run([knowledgeBlockOp({ id })])

export const softDeleteExamMatrix = (id: string) =>
  run([knowledgeBlockOp({ examMatrixId: id }), examMatrixOp({ id })])

export const softDeleteExamFramework = (id: string) =>
  run([
    knowledgeBlockOp({ examMatrix: { examFrameworkId: id } }),
    examMatrixOp({ examFrameworkId: id }),
    {
      model: "ExamFramework",
      operation: "update",
      data: { where: { id }, data: { ...softDeleteData(), active: false } },
    },
  ])
